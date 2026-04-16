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
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import { RubyText, AutoRubyText } from "../components/Ruby";
import type { StockPrice } from "../lib/types";

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
  { key: "index", label: "📊 インデックス", desc: "初めての人におすすめ" },
  { key: "jp_stock", label: "🇯🇵 日本", desc: "" },
  { key: "us_stock", label: "🇺🇸 アメリカ", desc: "" },
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
  const styles = useMemo(() => createStyles(palette), [palette]);
  const orderScrollRef = useRef<ScrollView>(null);

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

  useEffect(() => {
    loadData();
  }, [childId]);

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
    if (!selected) {
      setOrderError("銘柄を 選んでね");
      return;
    }
    const amountNum = parseInt(amount);
    if (!amountNum || amountNum < 100) {
      setOrderError("100円 以上 入力してね");
      return;
    }
    if (amountNum > investBalance) {
      setOrderError(`残高が 足りないよ（残り ¥${investBalance.toLocaleString()}）`);
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

  function formatPrice(stock: StockPrice): string {
    if (stock.price_jpy > 0) return `¥${stock.price_jpy.toLocaleString()}`;
    if (stock.price > 0) {
      if (stock.currency === "JPY") return `¥${stock.price.toLocaleString()}`;
      return `$${stock.price.toLocaleString()}`;
    }
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← もどる</Text>
        </TouchableOpacity>
        <RubyText
          style={styles.headerTitle}
          parts={["🌱 ", ["投資", "とうし"]]}
          rubySize={6}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />
        }
      >
        {/* Balance */}
        <View style={styles.balanceCard}>
          <RubyText style={styles.balanceLabel} parts={[["増", "ふ"], "やすウォレット"]} rubySize={4} />
          <Text style={styles.balanceAmount}>¥{investBalance.toLocaleString()}</Text>
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
            <AutoRubyText
              text={syncing
                ? "更新中..."
                : isCoolingDown
                  ? `⏳ あと${Math.ceil(cooldownRemain / 60000)}分`
                  : "🔄 最新価格に更新"}
              style={styles.syncButtonText}
              rubySize={4}
            />
          </TouchableOpacity>
        </View>

        {/* Portfolio */}
        {portfolios.length === 0 ? (
          <View style={styles.emptyCard}>
            <AutoRubyText text="まだ投資はありません。" style={styles.emptyText} rubySize={5} />
            <AutoRubyText text="「株を買いたい！」ボタンで始めよう！" style={styles.emptyText} rubySize={5} />
            <View style={styles.tipCard}>
              <AutoRubyText text="🌱 投資の基本" style={styles.tipTitle} rubySize={6} />
              <AutoRubyText text="株は「お店の一部を持つ」こと。" style={styles.tipText} rubySize={5} />
              <AutoRubyText text="お店が頑張ると、株の値段が上がる！" style={styles.tipText} rubySize={5} />
              <AutoRubyText text="🐢 長く持つのがコツ！" style={styles.tipText} rubySize={5} />
              <AutoRubyText text="すぐ売らないで、じっくり育てよう。" style={styles.tipText} rubySize={5} />
              <AutoRubyText text="🎯 まずは1つ選んでみよう！" style={styles.tipText} rubySize={5} />
            </View>
          </View>
        ) : (
          <View style={styles.portfolioSection}>
            <RubyText
              style={styles.sectionTitle}
              parts={[["保有", "ほゆう"], ["銘柄", "めいがら"]]}
              rubySize={5}
            />
            {portfolios.map((p) => {
              const { amount: gain, percent, isUp } = calcGainLoss(p);
              return (
                <View key={p.id} style={styles.portfolioCard}>
                  <View style={styles.portfolioLeft}>
                    <Text style={styles.portfolioName}>{p.name}</Text>
                    <Text style={styles.portfolioSub}>
                      {p.symbol} ・ {p.shares.toFixed(2)}かぶ
                    </Text>
                  </View>
                  <View style={styles.portfolioRight}>
                    <Text style={styles.portfolioValue}>
                      ¥{(p.current_value || 0).toLocaleString()}
                    </Text>
                    <Text
                      style={[
                        styles.portfolioGain,
                        { color: isUp ? palette.walletInvest : "#dc2626" },
                      ]}
                    >
                      {isUp ? "📈" : "📉"} ¥{Math.abs(gain).toLocaleString()} ({percent})
                    </Text>
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
          <AutoRubyText text="🌱 株を買いたい！" style={styles.buyButtonText} rubySize={5} />
        </TouchableOpacity>
      </View>

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
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setOrderVisible(false)} style={styles.backButton}>
                <Text style={styles.backText}>← もどる</Text>
              </TouchableOpacity>
              <RubyText
                style={styles.headerTitle}
                parts={["🌱 ", ["株", "かぶ"], "を", ["買", "か"], "う"]}
                rubySize={5}
              />
            </View>

            <ScrollView
              ref={orderScrollRef}
              contentContainerStyle={styles.orderScrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              {orderSuccess ? (
                <View style={styles.successContainer}>
                  <Text style={styles.successEmoji}>📈</Text>
                  <AutoRubyText text="親にお願いしたよ！" style={styles.successTitle} rubySize={5} />
                  <AutoRubyText text="承認を待ってね" style={styles.successSub} rubySize={5} />
                </View>
              ) : (
                <>
                  {/* Balance */}
                  <View style={styles.orderBalanceCard}>
                    <RubyText style={styles.orderBalanceLabel} parts={[["増", "ふ"], "やすウォレット ", ["残高", "ざんだか"]]} rubySize={4} />
                    <Text style={styles.orderBalanceAmount}>¥{investBalance.toLocaleString()}</Text>
                  </View>

                  {/* Category tabs */}
                  <RubyText
                    style={styles.orderLabel}
                    parts={["カテゴリを", ["選", "えら"], "ぼう"]}
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
                        <Text
                          style={[
                            styles.categoryTabText,
                            activeCategory === cat.key && styles.categoryTabTextActive,
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {cat.label}
                        </Text>
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
                    parts={[["銘柄", "めいがら"], "を", ["選", "えら"], "ぼう"]}
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
                        <View style={styles.stockNameRow}>
                          <Text style={styles.stockName} numberOfLines={1}>
                            {stock.name_ja || stock.name}
                          </Text>
                          <Text style={styles.stockSymbol}>{stock.symbol}</Text>
                        </View>
                        <AutoRubyText
                          text={stock.description_kids}
                          style={styles.stockDesc}
                          rubySize={4}
                        />
                      </View>
                      <View style={styles.stockPriceCol}>
                        <Text style={styles.stockPrice}>{formatPrice(stock)}</Text>
                        {stock.change_percent !== 0 && (
                          <Text
                            style={[
                              styles.stockChange,
                              { color: stock.change_percent >= 0 ? palette.walletInvest : "#dc2626" },
                            ]}
                          >
                            {stock.change_percent >= 0 ? "📈" : "📉"}{" "}
                            {stock.change_percent >= 0 ? "+" : ""}
                            {stock.change_percent.toFixed(2)}%
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                  {filteredStocks.length === 0 && (
                    <Text style={styles.emptyStockText}>
                      この カテゴリの 銘柄は ありません
                    </Text>
                  )}

                  {/* Amount input */}
                  <RubyText
                    style={styles.orderLabel}
                    parts={["いくら ", ["投資", "とうし"], "する？（", ["円", "えん"], "）"]}
                    rubySize={5}
                  />
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="例: 500"
                    keyboardType="number-pad"
                    onFocus={() => {
                      setTimeout(() => orderScrollRef.current?.scrollToEnd({ animated: true }), 200);
                    }}
                  />
                  <AutoRubyText text="100円から投資できるよ" style={styles.amountHint} rubySize={4} />

                  {orderError ? (
                    <Text style={styles.errorText}>{orderError}</Text>
                  ) : null}

                  <TouchableOpacity
                    style={[styles.orderButton, orderLoading && styles.orderButtonDisabled]}
                    onPress={handleOrder}
                    disabled={orderLoading}
                  >
                    <AutoRubyText
                      text={orderLoading ? "送り中..." : "親に お願いする 📈"}
                      style={styles.orderButtonText}
                    />
                  </TouchableOpacity>

                  <AutoRubyText text="💡 買いたい株がないときは、おうちの人に相談してね" style={styles.orderHint} rubySize={4} />
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: p.background },
    flex1: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
      gap: 8,
    },
    backButton: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: p.surfaceMuted,
      minHeight: 44,
      minWidth: 44,
      justifyContent: "center",
    },
    backText: { fontSize: rf(14), color: p.textMuted, fontWeight: "600" },
    headerTitle: { fontSize: rf(16), fontWeight: "bold", color: p.textStrong, flexShrink: 1 },

    scrollContent: { padding: 16, paddingBottom: 100 },

    // Balance card
    balanceCard: {
      backgroundColor: "#f0fdf4",
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#bbf7d0",
      marginBottom: 16,
    },
    balanceLabel: { fontSize: rf(12), color: "#16a34a", fontWeight: "600" },
    balanceAmount: { fontSize: rf(28), fontWeight: "bold", color: "#15803d", marginTop: 4 },
    lastSyncText: { fontSize: 10, color: p.textMuted, marginTop: 4 },
    syncButton: {
      marginTop: 10,
      backgroundColor: "#dcfce7",
      borderRadius: 8,
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: "#86efac",
    },
    syncButtonDisabled: { opacity: 0.5 },
    syncButtonText: { fontSize: 12, color: "#16a34a", fontWeight: "600" },

    // Empty state
    emptyCard: { alignItems: "center", paddingVertical: 20 },
    emptyText: { fontSize: rf(14), color: p.textMuted, textAlign: "center" },
    tipCard: {
      backgroundColor: "#f0fdf4",
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      borderWidth: 1,
      borderColor: "#bbf7d0",
      width: "100%",
    },
    tipTitle: { fontSize: rf(14), fontWeight: "bold", color: "#15803d", marginBottom: 8 },
    tipText: { fontSize: rf(11), color: "#166534", marginBottom: 4 },

    // Portfolio
    portfolioSection: { marginTop: 8 },
    sectionTitle: { fontSize: rf(14), fontWeight: "bold", color: p.textStrong, marginBottom: 10 },
    portfolioCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 14,
      borderRadius: 12,
      backgroundColor: p.white,
      borderWidth: 1,
      borderColor: "#bbf7d0",
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
      borderTopWidth: 1,
      borderTopColor: p.border,
    },
    buyButton: {
      backgroundColor: "#22c55e",
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    buyButtonText: { fontSize: rf(18), fontWeight: "bold", color: p.white },

    // Order modal
    orderScrollContent: { padding: 16, paddingBottom: 40 },
    successContainer: { alignItems: "center", paddingVertical: 40 },
    successEmoji: { fontSize: 64, marginBottom: 12 },
    successTitle: { fontSize: rf(20), fontWeight: "bold", color: "#15803d" },
    successSub: { fontSize: rf(14), color: p.textMuted, marginTop: 4 },

    orderBalanceCard: {
      backgroundColor: "#f0fdf4",
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#bbf7d0",
      marginBottom: 16,
    },
    orderBalanceLabel: { fontSize: rf(11), color: "#16a34a", fontWeight: "600" },
    orderBalanceAmount: { fontSize: rf(22), fontWeight: "bold", color: "#15803d", marginTop: 2 },

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
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.white,
      alignItems: "center",
      justifyContent: "center",
    },
    categoryTabActive: {
      backgroundColor: "#dcfce7",
      borderColor: "#4ade80",
    },
    categoryTabText: { fontSize: 11, color: p.textMuted, textAlign: "center" },
    categoryTabTextActive: { fontWeight: "bold", color: "#166534" },
    categoryHint: { fontSize: 11, color: "#16a34a", textAlign: "center", marginBottom: 4, marginTop: 2 },

    stockCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: p.border,
      backgroundColor: p.white,
      marginBottom: 8,
      gap: 10,
    },
    stockCardSelected: {
      borderColor: "#4ade80",
      backgroundColor: "#dcfce7",
    },
    stockIcon: { fontSize: 28 },
    stockNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    stockName: { fontSize: rf(13), fontWeight: "bold", color: p.textStrong, flexShrink: 1 },
    stockSymbol: { fontSize: 10, color: p.textMuted },
    stockDesc: { fontSize: 11, color: p.textMuted, marginTop: 2, lineHeight: 16 },
    stockPriceCol: { alignItems: "flex-end" },
    stockPrice: { fontSize: 12, fontWeight: "bold", color: p.textStrong },
    stockChange: { fontSize: 10, fontWeight: "600", marginTop: 1 },
    emptyStockText: { fontSize: 13, color: p.textMuted, textAlign: "center", paddingVertical: 16 },

    amountInput: {
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 12,
      padding: 14,
      fontSize: rf(20),
      textAlign: "center",
      backgroundColor: p.surfaceMuted,
    },
    amountHint: { fontSize: 10, color: p.textMuted, textAlign: "center", marginTop: 4 },

    errorText: { color: "#dc2626", fontSize: 13, textAlign: "center", marginTop: 8 },

    orderButton: {
      backgroundColor: "#22c55e",
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    orderButtonDisabled: { opacity: 0.5 },
    orderButtonText: { fontSize: rf(18), fontWeight: "bold", color: p.white },

    orderHint: { fontSize: 10, color: p.textMuted, textAlign: "center", marginTop: 12, lineHeight: 16 },
  });
}
