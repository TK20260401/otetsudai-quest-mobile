import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useTheme, type Palette, linkStyles } from "../theme";
import { rf } from "../lib/responsive";
import { RubyText, AutoRubyText } from "../components/Ruby";
import type { StockPrice } from "../lib/types";
import { PixelSeedlingIcon, PixelChartIcon, PixelChartDownIcon, PixelHourglassIcon, PixelRefreshIcon, PixelLightbulbIcon, PixelTargetIcon, PixelBarChartIcon, PixelDoorIcon, PixelHouseIcon, PixelCrossIcon, PixelShieldIcon } from "../components/PixelIcons";
import RpgButton from "../components/RpgButton";
import { getSession } from "../lib/session";
import CoinKunChat from "../components/CoinKunChat";

type Portfolio = {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  buy_price: number;
  current_price: number | null;
  current_value: number;
  updated_at: string;
};

const SYNC_COOLDOWN_MS = 5 * 60 * 1000;

const CATEGORIES = [
  { key: "index", label: "よくばり", desc: "冒険デビューに ぴったり！" },
  { key: "jp_stock", label: "🇯🇵 サムライタウン", desc: "" },
  { key: "us_stock", label: "🇺🇸 ロケットシティ", desc: "" },
] as const;

export default function InvestScreen({
  route,
  navigation,
}: {
  route: any;
  navigation: any;
}) {
  const { childId, walletId, investBalance: initialBalance } = route.params as {
    childId: string;
    walletId: string;
    investBalance: number;
  };
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const orderScrollRef = useRef<ScrollView>(null);

  const [hasParent, setHasParent] = useState<boolean | null>(null);
  const [investBalance, setInvestBalance] = useState(initialBalance);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [cooldownRemain, setCooldownRemain] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Order modal
  const [orderVisible, setOrderVisible] = useState(false);
  const [stocks, setStocks] = useState<StockPrice[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("index");
  const [selected, setSelected] = useState<StockPrice | null>(null);
  const [amount, setAmount] = useState("");
  const [orderError, setOrderError] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Request modal (リストにない銘柄を団長にリクエスト)
  const [requestVisible, setRequestVisible] = useState(false);
  const [requestSymbol, setRequestSymbol] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState(false);

  useEffect(() => {
    checkHasParent();
    loadData();
  }, [childId]);

  async function checkHasParent() {
    try {
      const session = await getSession();
      if (!session?.familyId) return;
      const { data } = await supabase
        .from("otetsudai_families")
        .select("has_parent")
        .eq("id", session.familyId)
        .single();
      setHasParent(data?.has_parent ?? false);
    } catch {
      setHasParent(false);
    }
  }

useEffect(() => {
    if (cooldownRemain <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemain((prev) => {
        if (prev <= 1000) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemain]);

  const loadData = useCallback(async () => {
    const [portfolioRes, walletRes] = await Promise.all([
      supabase
        .from("otetsudai_invest_portfolios")
        .select("*")
        .eq("child_id", childId)
        .order("created_at", { ascending: false }),
      supabase
        .from("otetsudai_wallets")
        .select("*")
        .eq("child_id", childId)
        .single(),
    ]);

    if (portfolioRes.data) {
      setPortfolios(portfolioRes.data);
      if (portfolioRes.data.length > 0 && portfolioRes.data[0].updated_at) {
        setLastSync(portfolioRes.data[0].updated_at);
      }
    }
    if (walletRes.data) {
      setInvestBalance(walletRes.data.invest_balance);
    }
    setLoading(false);
    setRefreshing(false);
  }, [childId]);

  // 画面復帰時にウォレット残高を再取得（親が承認した分の即時反映）
  // loadData は useCallback 済みで stable
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  async function handleSync() {
    if (lastSync) {
      const elapsed = Date.now() - new Date(lastSync).getTime();
      if (elapsed < SYNC_COOLDOWN_MS) {
        const remain = SYNC_COOLDOWN_MS - elapsed;
        setCooldownRemain(remain);
        return;
      }
    }

    setSyncing(true);
    try {
      // Call the Supabase edge function directly
      const { data, error } = await supabase.functions.invoke("stock-sync");
      if (!error && data) {
        await loadData();
        setLastSync(new Date().toISOString());
        setCooldownRemain(SYNC_COOLDOWN_MS);
      }
    } catch {
      // silently fail
    } finally {
      setSyncing(false);
    }
  }

  function calcGainLoss(p: Portfolio) {
    if (!p.current_price) return { amount: 0, percent: "0.00%", isUp: true };
    const gain = (p.current_price - p.buy_price) * p.shares;
    const pct = (((p.current_price - p.buy_price) / p.buy_price) * 100).toFixed(2);
    return { amount: Math.floor(gain), percent: `${pct}%`, isUp: gain >= 0 };
  }

  // Order modal
  async function openOrderModal() {
    setSelected(null);
    setAmount("");
    setOrderError("");
    setOrderSuccess(false);
    setActiveCategory("index");
    setOrderVisible(true);

    const { data } = await supabase
      .from("otetsudai_stock_prices")
      .select("*")
      .eq("is_preset", true)
      .order("category")
      .order("symbol");
    setStocks((data as StockPrice[]) || []);
  }

  const filteredStocks = stocks.filter((s) => s.category === activeCategory);

  async function handleOrder() {
    if (!selected) return;
    const amountNum = parseInt(amount);
    if (!amountNum || amountNum < 1) {
      setOrderError("コロを入力してね");
      return;
    }
    // USD銘柄は1株単位 → 1株分のコロが最低額
    // JPY銘柄(jp_stock/index)は100コロ最低 (単元未満OK)
    const sharePrice = Math.ceil(selected.price_jpy || 0);
    const minAmount = selected.currency === "USD" ? sharePrice : 100;
    if (amountNum < minAmount) {
      setOrderError(`コロが足りないよ (お宝1つは ${minAmount.toLocaleString()}コロ)`);
      return;
    }
    if (amountNum > investBalance) {
      setOrderError(`冒険資金が足りないよ (残り ${investBalance.toLocaleString()}コロ)`);
      return;
    }

    setOrderError("");
    setOrderLoading(true);

    const { error } = await supabase.from("otetsudai_invest_orders").insert({
      child_id: childId,
      wallet_id: walletId,
      symbol: selected.symbol,
      name: selected.name_ja || selected.name,
      amount: amountNum,
      order_type: "buy",
      status: "pending",
    });

    setOrderLoading(false);
    if (error) {
      setOrderError("送れませんでした。もう一度 試してね");
      return;
    }

    setOrderSuccess(true);
    setTimeout(() => {
      setOrderVisible(false);
      loadData();
    }, 2000);
  }

  // リストにない銘柄を団長にリクエスト送信
  async function handleSendRequest() {
    const sym = requestSymbol.trim().toUpperCase();
    if (!sym) {
      setRequestError("シンボルを入力してね");
      return;
    }
    setRequestLoading(true);
    try {
      const session = await getSession();
      if (!session?.familyId) {
        setRequestError("家族情報が見つからないよ");
        return;
      }
      const messageBody = `📈 銘柄リクエスト: ${sym}${requestReason ? `\n理由: ${requestReason}` : ""}`;
      const { error } = await supabase.from("otetsudai_messages").insert({
        family_id: session.familyId,
        from_user_id: session.userId,
        to_user_id: null,
        message: messageBody,
      });
      if (error) {
        setRequestError("送れませんでした。もう一度 試してね");
        return;
      }
      setRequestSuccess(true);
      setTimeout(() => {
        setRequestVisible(false);
        setRequestSuccess(false);
        setRequestSymbol("");
        setRequestReason("");
        setRequestError("");
      }, 1800);
    } finally {
      setRequestLoading(false);
    }
  }

  /**
   * 銘柄名/説明文を地域プレフィックス境界で 2 行に分割。
   * - 「の」が見つかればその直後で改行（「サムライタウンの精鋭225」→「サムライタウンの」/「精鋭225」）
   * - なければ既知地域名（ロケットシティ/サムライタウン/テクノ/江戸）の直後で改行
   * - どれもなければ 1 行のまま
   */
  function splitGeoPrefix(text: string): { line1: string; line2: string } {
    // 短い文字列は分割せず 1 行（江戸のお宝全部 など）
    if (text.length <= 8) {
      return { line1: text, line2: "" };
    }
    // 既知の地域名プレフィックスのみ分割対象（順序: 長い物から）
    // 「江戸」は短く 1 行に収まるため除外
    const geoNames = [
      "ロケットシティ",
      "サムライタウン",
      "テクノロジー",
      "テクノ",
    ];
    for (const g of geoNames) {
      // 「ロケットシティの〜」のように の が続く場合は の まで line1 に含める
      if (text.startsWith(g + "の") && text.length > g.length + 1) {
        return { line1: g + "の", line2: text.slice(g.length + 1) };
      }
      // 「ロケットシティ勇者30」のように の が無い場合は地域名で分割
      if (text.startsWith(g) && text.length > g.length) {
        return { line1: g, line2: text.slice(g.length) };
      }
    }
    return { line1: text, line2: "" };
  }

  function formatPrice(stock: StockPrice): string {
    // USD 銘柄は原価をドル表記（$516 等）
    if (stock.currency === "USD") {
      if (stock.price > 0) return `$${stock.price.toLocaleString()}`;
      return "—";
    }
    // JPY 銘柄はコロ表記
    if (stock.price_jpy > 0) return `${stock.price_jpy.toLocaleString()}コロ`;
    if (stock.price > 0) return `${stock.price.toLocaleString()}コロ`;
    return "—";
  }

  const isCoolingDown = cooldownRemain > 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header — タイトル絶対配置で完全中央揃え、戻るボタンは左に重ね配置 */}
      <View style={styles.header}>
        <View style={styles.headerCenter} pointerEvents="none">
          <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
            <PixelSeedlingIcon size={28} />
          </View>
          <RubyText style={styles.headerTitle} parts={[["錬", "れん"], ["成", "せい"]]} rubySize={9} />
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("ChildDashboard", { childId })}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="おうちにもどる"
          accessibilityRole="button"
        >
          <PixelHouseIcon size={12} />
          <Text style={styles.backText}>もどる</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        minimumZoomScale={1}
        maximumZoomScale={3}
        bouncesZoom
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
        }
      >
        {/* Balance */}
        <View style={styles.balanceCard}>
          <RubyText style={styles.balanceLabel} parts={[["冒険", "ぼうけん"], ["資金", "しきん"]]} rubySize={4} />
          <Text style={styles.balanceAmount}>{investBalance.toLocaleString()}コロ</Text>
          {lastSync && (
            <Text style={styles.lastSyncText}>
              最終更新: {new Date(lastSync).toLocaleString("ja-JP")}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.syncButton, (syncing || isCoolingDown) && styles.syncButtonDisabled]}
            onPress={handleSync}
            disabled={syncing || isCoolingDown}
          >
            {syncing ? (
              <Text style={styles.syncButtonText}>更新中...</Text>
            ) : isCoolingDown ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <PixelHourglassIcon size={12} />
                <AutoRubyText text={`あと${Math.ceil(cooldownRemain / 60000)}分`} style={styles.syncButtonText} rubySize={4} noWrap />
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <PixelRefreshIcon size={12} />
                <AutoRubyText text="お宝相場を更新" style={styles.syncButtonText} rubySize={4} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Portfolio */}
        {portfolios.length === 0 ? (
          <View style={styles.emptyCard}>
            <RubyText parts={["まだお", ["宝", "たから"], "はないよ。"]} style={styles.emptyText} rubySize={5} />
            <AutoRubyText text="「冒険ショップへ！」ボタンで始めよう！" style={styles.emptyText} rubySize={5} />
            <View style={styles.tipCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <PixelSeedlingIcon size={16} />
                <AutoRubyText text="錬成の基本" style={styles.tipTitle} rubySize={6} />
              </View>
              <AutoRubyText text="お宝は「冒険商会の主人になる」しるし。" style={styles.tipText} rubySize={5} />
              <AutoRubyText text="冒険商会が大繁盛すると、お宝の値段が上がる！" style={styles.tipText} rubySize={5} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <PixelHourglassIcon size={14} />
                <AutoRubyText text="急がずじっくり育てるのがコツ！" style={styles.tipText} rubySize={5} />
              </View>
              <AutoRubyText text="すぐ手放さないで、じっくり育てよう。" style={styles.tipText} rubySize={5} />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <PixelTargetIcon size={14} />
                <AutoRubyText text="まずは1つ仕入れてみよう！" style={styles.tipText} rubySize={5} />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.portfolioSection}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <PixelBarChartIcon size={16} />
              <RubyText
                style={styles.sectionTitle}
                parts={[["手持", "ても"], "ちのお", ["宝", "たから"]]}
                rubySize={5}
              />
            </View>
            {portfolios.map((p) => {
              const { amount: gain, percent, isUp } = calcGainLoss(p);
              return (
                <View key={p.id} style={styles.portfolioCard}>
                  <View style={styles.portfolioLeft}>
                    <Text style={styles.portfolioName}>{p.name}</Text>
                    <Text style={styles.portfolioSub}>
                      {p.symbol} ・ {p.shares.toFixed(2)}個
                    </Text>
                  </View>
                  <View style={styles.portfolioRight}>
                    <Text style={styles.portfolioValue}>
                      {(p.current_value || 0).toLocaleString()}コロ
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                      {isUp ? <PixelChartIcon size={14} /> : <PixelChartDownIcon size={14} />}
                      <Text
                        style={[
                          styles.portfolioGain,
                          { color: isUp ? palette.walletInvest : palette.red },
                        ]}
                      >
                        {Math.abs(gain).toLocaleString()}コロ ({percent})
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Buy button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.buyButton} onPress={openOrderModal}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <PixelSeedlingIcon size={20} />
            <AutoRubyText text="冒険ショップへ！" style={styles.buyButtonText} rubySize={5} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Parent Lock Modal */}
      {hasParent === false && (
        <Modal
          visible={true}
          animationType="fade"
          transparent={true}
          onRequestClose={() => navigation.goBack()}
        >
          <View style={styles.lockOverlay}>
            <View style={styles.lockCard}>
              <PixelShieldIcon size={48} />
              <Text style={styles.lockTitle}>
                冒険団長が必要！
              </Text>
              <Text style={styles.lockDesc}>
                「錬成」は冒険団長が{"\n"}
                参加すると使えるようになるよ
              </Text>
              <RpgButton
                tier="gold"
                size="md"
                fullWidth
                onPress={() => navigation.navigate("InviteParent")}
                accessibilityLabel="おうちのひとをよぶ"
              >
                <Text style={styles.lockButtonText}>
                  おうちの ひとを よぶ
                </Text>
              </RpgButton>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.lockBackLink}
                accessibilityLabel="まえに もどる"
                accessibilityRole="button"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" }}>
                  <PixelDoorIcon size={14} />
                  <Text style={styles.lockBackText}>もどる</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Order Modal */}
      <Modal
        visible={orderVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setOrderVisible(false)}
      >
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
          <KeyboardAvoidingView
            style={styles.flex1}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
              <TouchableOpacity
                onPress={() => {
                  setOrderVisible(false);
                  navigation.navigate("ChildDashboard", { childId });
                }}
                style={styles.backButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="もどる"
                accessibilityRole="button"
              >
                <PixelHouseIcon size={16} />
                <Text style={styles.backText}>もどる</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1, justifyContent: "center" }}>
                <PixelSeedlingIcon size={18} />
                <RubyText style={styles.headerTitle} parts={[["冒険", "ぼうけん"], "ショップ"]} rubySize={6} />
              </View>
            </View>

            <ScrollView
              ref={orderScrollRef}
              contentContainerStyle={styles.orderScrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              {orderSuccess ? (
                <View style={styles.successContainer}>
                  <PixelChartIcon size={56} />
                  <AutoRubyText text="注文クエスト発動！" style={styles.successTitle} rubySize={5} />
                  <AutoRubyText text="おうちのひとの承認を待ってね" style={styles.successSub} rubySize={5} />
                </View>
              ) : (
                <>
                  {/* Balance */}
                  <View style={styles.orderBalanceCard}>
                    <RubyText style={styles.orderBalanceLabel} parts={[["冒険", "ぼうけん"], ["資金", "しきん"]]} rubySize={4} />
                    <Text style={styles.orderBalanceAmount}>{investBalance.toLocaleString()}コロ</Text>
                  </View>

                  {/* Category tabs */}
                  <RubyText
                    style={styles.orderLabel}
                    parts={[["冒険先", "ぼうけんさき"], "を", ["選", "えら"], "ぼう"]}
                    rubySize={4}
                  />
                  <View style={styles.categoryRow}>
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat.key}
                        style={[
                          styles.categoryTab,
                          activeCategory === cat.key && styles.categoryTabActive,
                        ]}
                        onPress={() => {
                          setActiveCategory(cat.key);
                          setSelected(null);
                          setOrderError("");
                        }}
                      >
                        <AutoRubyText
                          style={[
                            styles.categoryTabText,
                            activeCategory === cat.key && styles.categoryTabTextActive,
                          ]}
                          text={cat.label}
                          rubySize={4}
                          noWrap
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                  {CATEGORIES.find((c) => c.key === activeCategory)?.desc ? (
                    <AutoRubyText
                      text={CATEGORIES.find((c) => c.key === activeCategory)!.desc}
                      style={styles.categoryHint}
                      rubySize={4}
                    />
                  ) : null}

                  {/* Stock list */}
                  <RubyText
                    style={styles.orderLabel}
                    parts={["トレジャーハント"]}
                    rubySize={4}
                  />
                  {filteredStocks.map((stock) => (
                    <TouchableOpacity
                      key={stock.symbol}
                      style={[
                        styles.stockCard,
                        selected?.symbol === stock.symbol && styles.stockCardSelected,
                      ]}
                      onPress={() => {
                        setSelected(stock);
                        setOrderError("");
                      }}
                    >
                      <Text style={styles.stockIcon}>{stock.icon}</Text>
                      <View style={styles.flex1}>
                        <View style={{ flexDirection: "column", gap: 2 }}>
                          {(() => {
                            const { line1, line2 } = splitGeoPrefix(stock.name_ja || stock.name);
                            return (
                              <>
                                <AutoRubyText text={line1} style={styles.stockName} rubySize={4} />
                                {line2 ? (
                                  <AutoRubyText text={line2} style={styles.stockName} rubySize={4} />
                                ) : null}
                              </>
                            );
                          })()}
                          <Text style={styles.stockSymbol}>{stock.symbol}</Text>
                        </View>
                        {(() => {
                          const { line1, line2 } = splitGeoPrefix(stock.description_kids);
                          return (
                            <View style={{ marginTop: 2 }}>
                              <AutoRubyText text={line1} style={styles.stockDesc} rubySize={4} />
                              {line2 ? (
                                <AutoRubyText text={line2} style={styles.stockDesc} rubySize={4} />
                              ) : null}
                            </View>
                          );
                        })()}
                      </View>
                      <View style={styles.stockPriceCol}>
                        <Text style={styles.stockPrice}>{formatPrice(stock)}</Text>
                        {stock.currency === "USD" ? (
                          <AutoRubyText
                            text="海の向こうのコロ(ドル)"
                            style={styles.stockOverseaHint}
                            rubySize={3}
                          />
                        ) : (
                          <AutoRubyText
                            text="サムライタウンのコロ(円)"
                            style={styles.stockOverseaHint}
                            rubySize={3}
                          />
                        )}
                        {stock.change_percent !== 0 && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                            {stock.change_percent >= 0 ? <PixelChartIcon size={12} /> : <PixelChartDownIcon size={12} />}
                            <Text
                              style={[
                                styles.stockChange,
                                { color: stock.change_percent >= 0 ? palette.walletInvest : palette.red },
                              ]}
                            >
                              {stock.change_percent >= 0 ? "+" : ""}
                              {stock.change_percent.toFixed(2)}%
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                  {filteredStocks.length === 0 && (
                    <AutoRubyText text="この冒険先にはお宝がないよ" style={styles.emptyStockText} rubySize={5} />
                  )}

                  {/* Amount input */}
                  <RubyText
                    style={styles.orderLabel}
                    parts={[["何", "なん"], "コロでお", ["宝", "たから"], "を", ["錬成", "れんせい"], "する？"]}
                    rubySize={5}
                  />
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="例: 500"
                    placeholderTextColor={palette.textPlaceholder}
                    keyboardType="number-pad"
                    onFocus={() => {
                      setTimeout(() => orderScrollRef.current?.scrollToEnd({ animated: true }), 400);
                    }}
                  />
                  <AutoRubyText
                    text={
                      // 銘柄選択時は 1 株分のコロを動的表示 (子供がいくら必要か理解できるように)
                      selected
                        ? selected.currency === "USD"
                          ? `お宝1つ ≈ ${Math.ceil(selected.price_jpy || 0).toLocaleString()}コロ (1つから)`
                          : selected.category === "jp_stock"
                            ? `お宝1つ ≈ ${Math.ceil(selected.price_jpy || 0).toLocaleString()}コロ (100コロからかけらOK)`
                            : `お宝1つ ≈ ${Math.ceil(selected.price_jpy || 0).toLocaleString()}コロ (100コロから)`
                        : // 未選択時はタブごとのデフォルト
                          activeCategory === "us_stock"
                          ? "お宝1つ分から (高め)"
                          : activeCategory === "jp_stock"
                            ? "100コロから (かけらOK)"
                            : "100コロから"
                    }
                    style={styles.amountHint}
                    rubySize={4}
                  />

                  {orderError ? (
                    <AutoRubyText text={orderError} style={styles.errorText} rubySize={5} />
                  ) : null}

                  <TouchableOpacity
                    style={[styles.orderButton, (orderLoading || !selected) && styles.orderButtonDisabled]}
                    onPress={handleOrder}
                    disabled={orderLoading || !selected}
                  >
                    {orderLoading ? (
                      <Text style={styles.orderButtonText}>送り中...</Text>
                    ) : (() => {
                      const buttonText = selected ? `${selected.name_ja || selected.name}を錬成する` : "お宝を選んでね";
                      // 長い銘柄名(例: ロケットシティ大冒険500を錬成する=17字)は枠に収まらないためフォント縮小
                      const isLong = buttonText.length > 12;
                      return (
                        <View style={styles.orderButtonInner}>
                          <AutoRubyText
                            text={buttonText}
                            style={[styles.orderButtonText, isLong && { fontSize: rf(14) }]}
                            rubyColor="#1a0f2e"
                            noWrap
                          />
                          {selected ? <PixelChartIcon size={isLong ? 14 : 18} /> : null}
                        </View>
                      );
                    })()}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.requestLink}
                    onPress={() => setRequestVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel="リストにないお宝を団長にお願いする"
                  >
                    <PixelLightbulbIcon size={14} />
                    <AutoRubyText text="リストにないお宝を団長にお願いする" style={styles.requestLinkText} rubySize={4} />
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>

          {/* リクエストモーダル: 注文モーダル内にネストして表示確実化 */}
          <Modal
            visible={requestVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setRequestVisible(false)}
          >
            <KeyboardAvoidingView
              style={styles.requestOverlay}
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <TouchableOpacity
                style={styles.requestBackdrop}
                activeOpacity={1}
                onPress={() => {
                  Keyboard.dismiss();
                  setRequestVisible(false);
                }}
              />
              <View style={styles.requestSheet}>
                {activeCategory === "jp_stock" ? (
                  <RubyText
                    style={styles.requestTitle}
                    parts={["サムライタウンの", ["団長", "だんちょう"], "に", ["銘柄", "めいがら"], "を", ["相談", "そうだん"]]}
                    rubySize={6}
                  />
                ) : activeCategory === "us_stock" ? (
                  <RubyText
                    style={styles.requestTitle}
                    parts={["ロケットシティの", ["団長", "だんちょう"], "に", ["銘柄", "めいがら"], "を", ["相談", "そうだん"]]}
                    rubySize={6}
                  />
                ) : (
                  <RubyText
                    style={styles.requestTitle}
                    parts={[["団長", "だんちょう"], "に", ["銘柄", "めいがら"], "を", ["相談", "そうだん"]]}
                    rubySize={6}
                  />
                )}
                <RubyText
                  parts={[
                    ["欲", "ほ"], "しいお", ["宝", "たから"], "のシンボル (",
                    ["例", "れい"], ": ",
                    activeCategory === "us_stock"
                      ? "NVDA = エヌビディア"
                      : activeCategory === "jp_stock"
                        ? "7974.T = 任天堂"
                        : "SPYD",
                    ") と、", ["何", "なん"], "で", ["欲", "ほ"], "しいかを",
                    ["書", "か"], "いてね",
                  ]}
                  style={styles.requestSubtitle}
                  rubySize={4}
                />

                <AutoRubyText text="シンボル" style={styles.requestLabel} rubySize={4} />
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.requestInput}
                    value={requestSymbol}
                    onChangeText={setRequestSymbol}
                    placeholder=""
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                  {!requestSymbol && (
                    <View pointerEvents="none" style={styles.placeholderOverlay}>
                      <RubyText
                        parts={
                          activeCategory === "us_stock"
                            ? [["例", "れい"], ": NVDA (エヌビディア)"]
                            : activeCategory === "jp_stock"
                              ? [["例", "れい"], ": 7974.T (", ["任天堂", "にんてんどう"], ")"]
                              : [["例", "れい"], ": SPYD"]
                        }
                        style={styles.placeholderText}
                        rubySize={3}
                        noWrap
                      />
                    </View>
                  )}
                </View>

                <RubyText
                  parts={[["理由", "りゆう"], "(", ["書", "か"], "かなくてもOK)"]}
                  style={styles.requestLabel}
                  rubySize={4}
                />
                <View style={styles.inputWrap}>
                  <TextInput
                    style={[styles.requestInput, styles.requestInputMulti]}
                    value={requestReason}
                    onChangeText={setRequestReason}
                    placeholder=""
                    multiline
                    numberOfLines={3}
                  />
                  {!requestReason && (
                    <View pointerEvents="none" style={styles.placeholderOverlayMulti}>
                      <RubyText
                        parts={
                          activeCategory === "us_stock"
                            ? [["例", "れい"], ": AIチップで", ["有名", "ゆうめい"], "だから"]
                            : activeCategory === "jp_stock"
                              ? [["例", "れい"], ": ", ["任天堂", "にんてんどう"], "のゲームが", ["好", "す"], "きだから"]
                              : [
                                  ["例", "れい"], ": ", ["毎月", "まいつき"], "コロがもらえるアメリカのお",
                                  ["宝", "たから"], "の", ["詰", "つ"], "め", ["合", "あ"], "わせ",
                                ]
                        }
                        style={styles.placeholderText}
                        rubySize={3}
                      />
                    </View>
                  )}
                </View>

                {requestError ? (
                  <AutoRubyText text={requestError} style={styles.errorText} rubySize={4} />
                ) : null}
                {requestSuccess ? (
                  <AutoRubyText text="送ったよ！団長からの返事を待ってね" style={styles.requestSuccess} rubySize={4} />
                ) : null}

                <View style={styles.requestButtonRow}>
                  <TouchableOpacity
                    style={styles.requestCancelButton}
                    onPress={() => {
                      Keyboard.dismiss();
                      setRequestVisible(false);
                    }}
                    disabled={requestLoading}
                  >
                    <AutoRubyText text="やめる" style={styles.requestCancelText} rubySize={4} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.requestSendButton, requestLoading && styles.orderButtonDisabled]}
                    onPress={handleSendRequest}
                    disabled={requestLoading || requestSuccess}
                  >
                    {requestLoading ? (
                      <ActivityIndicator color="#1a0f2e" />
                    ) : (
                      <AutoRubyText text="送信" style={styles.requestSendText} rubyColor="#1a0f2e" rubySize={4} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
            {/* リクエストモーダル内コインくん */}
            <CoinKunChat role="child" />
          </Modal>
          {/* 注文モーダル内コインくん */}
          <CoinKunChat role="child" />
        </SafeAreaView>
      </Modal>

      {/* 画面ルートのコインくん (モーダル非表示時用) */}
      <CoinKunChat role="child" />
    </SafeAreaView>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: p.background },
    flex1: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

    header: {
      position: "relative" as const,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
      gap: 10,
      backgroundColor: p.background,
      minHeight: 56,
    },
    headerCenter: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 8,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 5,
      backgroundColor: p.background,
      borderWidth: 1,
      borderColor: p.primary,
    },
    backText: { fontSize: 11, fontWeight: "bold", color: p.textMuted },
    backHint: { fontSize: 9, fontWeight: "600", color: p.textMuted, opacity: 0.7, marginTop: -1 },
    headerTitle: { fontSize: rf(28), fontWeight: "900", color: p.primaryDark, flexShrink: 1, textAlign: "center" as const },

    scrollContent: { padding: 16, paddingBottom: 140 },

    // Balance card
    balanceCard: {
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: p.walletInvestBorder,
      marginBottom: 16,
    },
    balanceLabel: { fontSize: rf(12), color: p.walletInvestText, fontWeight: "600" },
    balanceAmount: { fontSize: rf(28), fontWeight: "bold", color: p.walletInvestText, marginTop: 4 },
    lastSyncText: { fontSize: 10, color: p.textMuted, marginTop: 4 },
    syncButton: {
      marginTop: 10,
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderWidth: 1.5,
      borderColor: p.walletInvestBorder,
    },
    syncButtonDisabled: { opacity: 0.5 },
    syncButtonText: { fontSize: 12, color: p.walletInvestText, fontWeight: "600" },

    // Empty state
    emptyCard: { alignItems: "center", paddingVertical: 20 },
    emptyText: { fontSize: rf(14), color: p.textMuted, textAlign: "center" },
    tipCard: {
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      borderWidth: 1.5,
      borderColor: p.walletInvestBorder,
      width: "100%",
    },
    tipTitle: { fontSize: rf(14), fontWeight: "bold", color: p.walletInvestText, marginBottom: 8 },
    tipText: { fontSize: rf(11), color: p.textBase, marginBottom: 4 },

    // Portfolio
    portfolioSection: { marginTop: 8 },
    sectionTitle: { fontSize: rf(14), fontWeight: "bold", color: p.textStrong, marginBottom: 10 },
    portfolioCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: p.walletInvestBorder,
      marginBottom: 8,
    },
    portfolioLeft: { flex: 1 },
    portfolioName: { fontSize: rf(14), fontWeight: "bold", color: p.textStrong },
    portfolioSub: { fontSize: 11, color: p.textMuted, marginTop: 2 },
    portfolioRight: { alignItems: "flex-end" },
    portfolioValue: { fontSize: rf(14), fontWeight: "bold", color: p.textStrong },
    portfolioGain: { fontSize: 11, fontWeight: "600", marginTop: 2 },

    // Bottom bar
    bottomBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      paddingBottom: 32,
      backgroundColor: p.background,
      borderTopWidth: 2,
      borderTopColor: p.walletInvestBorder,
    },
    buyButton: {
      backgroundColor: p.walletInvest,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: p.accent,
    },
    // 緑地に白文字はコントラスト比 ~3:1 と低いため黒文字＋太字＋シャドウで
    // 視認性を確保
    buyButtonText: {
      fontSize: rf(20),
      fontWeight: "900",
      color: "#1a0f2e",
      letterSpacing: 1,
      textShadowColor: "rgba(255,255,255,0.4)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },

    // Order modal
    orderScrollContent: { padding: 16, paddingBottom: 40 },
    successContainer: { alignItems: "center", paddingVertical: 40 },
    successEmoji: { fontSize: 64, marginBottom: 12 },
    successTitle: { fontSize: rf(20), fontWeight: "bold", color: p.walletInvestText },
    successSub: { fontSize: rf(14), color: p.textMuted, marginTop: 4 },

    orderBalanceCard: {
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: p.walletInvestBorder,
      marginBottom: 16,
    },
    orderBalanceLabel: { fontSize: rf(11), color: p.walletInvestText, fontWeight: "600" },
    orderBalanceAmount: { fontSize: rf(22), fontWeight: "bold", color: p.walletInvestText, marginTop: 2 },

    orderLabel: {
      fontSize: rf(13),
      fontWeight: "bold",
      color: p.textStrong,
      marginBottom: 8,
      marginTop: 12,
    },

    categoryRow: { flexDirection: "row", gap: 6, marginBottom: 4 },
    categoryTab: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: p.border,
      alignItems: "center",
      justifyContent: "center",
    },
    categoryTabActive: {
      borderColor: p.walletInvestBorder,
    },
    categoryTabText: { fontSize: 11, color: p.textMuted, textAlign: "center" },
    categoryTabTextActive: { fontWeight: "bold", color: p.walletInvestText },
    categoryHint: { fontSize: 11, color: p.walletInvestText, textAlign: "center", marginBottom: 4, marginTop: 2 },

    stockCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: p.border,
      marginBottom: 8,
      gap: 10,
    },
    stockCardSelected: {
      borderColor: p.walletInvestBorder,
    },
    stockIcon: { fontSize: 24 },
    stockNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    stockName: { fontSize: rf(12), fontWeight: "bold" as const, color: p.textStrong, flexShrink: 1 },
    stockSymbol: { fontSize: 9, color: p.textMuted },
    stockDesc: { fontSize: 10, color: p.textMuted, marginTop: 2 },
    stockPriceCol: { alignItems: "flex-end" },
    stockPrice: { fontSize: 11, fontWeight: "bold" as const, color: p.textStrong },
    stockOverseaHint: { fontSize: 7, color: p.textMuted, marginTop: 1, fontStyle: "italic" as const },
    stockChange: { fontSize: 9, fontWeight: "600" as const, marginTop: 1 },
    emptyStockText: { fontSize: 13, color: p.textMuted, textAlign: "center", paddingVertical: 16 },

    amountInput: {
      borderWidth: 1.5,
      borderColor: p.border,
      borderRadius: 12,
      padding: 14,
      fontSize: rf(20),
      textAlign: "center",
      color: p.textStrong,
    },
    amountHint: { fontSize: 10, color: p.textMuted, textAlign: "center", marginTop: 4 },

    errorText: { color: p.red, fontSize: 13, textAlign: "center", marginTop: 8 },

    orderButton: {
      backgroundColor: p.walletInvest,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 12,
      alignItems: "center",
      marginTop: 16,
    },
    orderButtonInner: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 4,
      flexShrink: 1,
    },
    orderButtonDisabled: { opacity: 0.5 },
    orderButtonText: {
      fontSize: rf(18),
      fontWeight: "900",
      color: "#1a0f2e",
      letterSpacing: 1,
      textShadowColor: "rgba(255,255,255,0.4)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },

    orderHint: { fontSize: 10, color: p.textMuted, textAlign: "center", marginTop: 12, lineHeight: 16 },

    // Request link & modal (リストにない銘柄を団長にお願い)
    requestLink: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: 10,
      paddingHorizontal: 8,
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: p.border,
    },
    requestLinkText: {
      fontSize: rf(12),
      color: p.primary,
      textDecorationLine: "underline" as const,
      fontWeight: "600",
    },
    requestOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    requestBackdrop: { ...StyleSheet.absoluteFillObject },
    requestSheet: {
      backgroundColor: p.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 28,
      gap: 8,
    },
    requestTitle: {
      fontSize: rf(18),
      fontWeight: "900",
      color: p.textStrong,
      marginBottom: 4,
    },
    requestSubtitle: {
      fontSize: rf(12),
      color: p.textMuted,
      marginBottom: 8,
      lineHeight: 18,
    },
    requestLabel: {
      fontSize: rf(12),
      color: p.textStrong,
      fontWeight: "700",
      marginTop: 6,
    },
    requestInput: {
      borderWidth: 1.5,
      borderColor: p.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: rf(14),
      color: p.textStrong,
      backgroundColor: p.surface,
    },
    requestInputMulti: {
      minHeight: 70,
      textAlignVertical: "top" as const,
    },
    inputWrap: {
      position: "relative" as const,
    },
    placeholderOverlay: {
      position: "absolute" as const,
      left: 12,
      right: 12,
      top: 0,
      bottom: 0,
      justifyContent: "center" as const,
    },
    placeholderOverlayMulti: {
      position: "absolute" as const,
      left: 12,
      right: 12,
      top: 12,
    },
    placeholderText: {
      fontSize: rf(14),
      color: p.textPlaceholder,
    },
    requestSuccess: {
      fontSize: rf(12),
      color: p.walletInvest,
      textAlign: "center" as const,
      marginTop: 4,
      fontWeight: "700",
    },
    requestButtonRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 14,
    },
    requestCancelButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: p.border,
      alignItems: "center",
    },
    requestCancelText: {
      fontSize: rf(14),
      color: p.textMuted,
      fontWeight: "700",
    },
    requestSendButton: {
      flex: 1.5,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: p.walletInvest,
      alignItems: "center",
    },
    requestSendText: {
      fontSize: rf(14),
      color: "#1a0f2e",
      fontWeight: "900",
    },

    // Lock modal
    lockOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    lockCard: {
      backgroundColor: p.background,
      borderRadius: 20,
      padding: 28,
      alignItems: "center",
      width: "100%",
      maxWidth: 340,
      borderWidth: 1.5,
      borderColor: p.borderStrong,
    },
    lockTitle: {
      fontSize: rf(18),
      fontWeight: "800",
      color: p.primaryDark,
      marginTop: 16,
      marginBottom: 8,
      textAlign: "center",
    },
    lockDesc: {
      fontSize: rf(13),
      color: p.textMuted,
      textAlign: "center",
      lineHeight: rf(20),
      marginBottom: 20,
    },
    lockButtonText: {
      fontSize: rf(16),
      fontWeight: "bold",
      color: "#2A1800",
    },
    lockBackLink: {
      marginTop: 16,
      paddingVertical: 8,
      paddingHorizontal: 16,
      minHeight: 44,
      justifyContent: "center",
    },
    lockBackText: {
      ...linkStyles(p).linkTextMuted,
      fontSize: 11,
    },
  });
}
