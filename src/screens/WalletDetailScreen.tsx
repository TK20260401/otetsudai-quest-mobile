import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import { AutoRubyText, RubyText } from "../components/Ruby";
import { useAppAlert } from "../components/AppAlert";
import SavingGoalModal from "../components/SavingGoalModal";
import CoinSplitAnimation from "../components/animations/CoinSplitAnimation";
import SavingGoalMilestone from "../components/SavingGoalMilestone";
import type { Wallet, Transaction, SpendRequest, SavingGoal } from "../lib/types";
import MoneyTree, { getStage } from "../components/MoneyTree";
import { PixelChestOpenIcon, PixelCoinIcon, PixelCartIcon, PixelPiggyIcon, PixelChartIcon, PixelTreeIcon, PixelConfettiIcon, PixelHourglassIcon, PixelCheckIcon, PixelCrossIcon, PixelScrollIcon, PixelHouseIcon } from "../components/PixelIcons";
import CoinKunChat from "../components/CoinKunChat";

export default function WalletDetailScreen({
  route,
  navigation,
}: {
  route: any;
  navigation: any;
}) {
  const { childId, walletId } = route.params as {
    childId: string;
    walletId: string;
  };
  const { alert } = useAppAlert();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [spendRequests, setSpendRequests] = useState<SpendRequest[]>([]);
  const [savingGoals, setSavingGoals] = useState<SavingGoal[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCoinSplit, setShowCoinSplit] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);

  const loadData = useCallback(async () => {
    const [walletRes, txRes, spendRes, goalRes] = await Promise.all([
      supabase
        .from("otetsudai_wallets")
        .select("*")
        .eq("id", walletId)
        .single(),
      supabase
        .from("otetsudai_transactions")
        .select("*")
        .eq("wallet_id", walletId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("otetsudai_spend_requests")
        .select("*")
        .eq("child_id", childId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("otetsudai_saving_goals")
        .select("*")
        .eq("child_id", childId)
        .order("created_at", { ascending: false }),
    ]);

    setWallet(walletRes.data);
    setTransactions(txRes.data || []);
    setSpendRequests(spendRes.data || []);
    setSavingGoals(goalRes.data || []);
    setLoading(false);
  }, [childId, walletId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  // --- Filter helpers ---
  const filteredTransactions = useMemo(
    () =>
      transactions.filter(
        (tx) => filterType === "all" || tx.type === filterType
      ),
    [transactions, filterType]
  );

  const recentSpendRequests = useMemo(
    () =>
      spendRequests
        .filter(
          (r) =>
            r.status === "pending" ||
            (r.status === "approved" && r.payment_status === "pending_payment") ||
            r.status === "rejected"
        )
        .slice(0, 5),
    [spendRequests]
  );

  const unachievedGoals = useMemo(
    () => savingGoals.filter((g) => !g.is_achieved),
    [savingGoals]
  );

  const achievedGoals = useMemo(
    () => savingGoals.filter((g) => g.is_achieved),
    [savingGoals]
  );

  // --- Render ---

  if (loading) {
    return (
      <View style={styles.center}>
        <PixelCoinIcon size={40} />
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.loadingText}>おさいふを ひらいてるよ...</Text>
      </View>
    );
  }

  const spending = wallet?.spending_balance ?? 0;
  const saving = wallet?.saving_balance ?? 0;
  const invest = wallet?.invest_balance ?? 0;
  const total = spending + saving + invest;

  const filterTabs: { label: string; value: string; parts: (string | [string, string])[] }[] = [
    { label: "全部", value: "all", parts: [["全部", "ぜんぶ"]] as [string, string][] },
    { label: "冒険", value: "earn", parts: [["冒険", "ぼうけん"]] as (string | [string, string])[] },
    { label: "取引", value: "spend", parts: [["取引", "とりひき"]] as (string | [string, string])[] },
    { label: "金庫", value: "save", parts: [["金庫", "きんこ"]] as (string | [string, string])[] },
    { label: "錬成", value: "invest", parts: [["錬成", "れんせい"]] as (string | [string, string])[] },
  ];

  function TxTypeIcon({ type }: { type: string }) {
    switch (type) {
      case "earn": return <PixelCoinIcon size={18} />;
      case "spend": return <PixelCartIcon size={18} />;
      case "save": return <PixelPiggyIcon size={18} />;
      case "invest": return <PixelChartIcon size={18} />;
      default: return <PixelCoinIcon size={18} />;
    }
  }

  function txTypeName(type: string): string {
    switch (type) {
      case "earn":
        return "クエスト報酬";
      case "spend":
        return "取引";
      case "save":
        return "金庫";
      case "invest":
        return "錬成";
      default:
        return type;
    }
  }

  /**
   * 冒険ログの description を 2 行に分割
   * - 1 行目: 名詞 (タイトルの最初の半角スペース前)
   * - 2 行目: 承認 + 動詞 (末尾「承認」を 2 行目先頭に移動)
   * 例: "泡モンスター 討伐作戦 承認" → { line1: "泡モンスター", line2: "承認 討伐作戦" }
   */
  function splitDescription(desc: string): { line1: string; line2: string } {
    const trimmed = desc.trim();
    const hasApproval = trimmed.endsWith(" 承認");
    const main = hasApproval ? trimmed.slice(0, -3).trim() : trimmed;
    const spaceIdx = main.indexOf(" ");
    if (spaceIdx === -1) {
      // 単一トークン: 1 行目のみ
      return { line1: main, line2: hasApproval ? "承認" : "" };
    }
    const noun = main.slice(0, spaceIdx);
    const verb = main.slice(spaceIdx + 1).trim();
    return {
      line1: noun,
      line2: hasApproval ? `承認 ${verb}` : verb,
    };
  }

  function txAmountColor(type: string): string {
    switch (type) {
      case "earn":
        return palette.primary;
      case "spend":
        return palette.walletSpend;
      case "save":
        return palette.walletSave;
      case "invest":
        return palette.walletInvest;
      default:
        return palette.textBase;
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header — 金庫=中央(絶対配置)、もどる=左、505コロ=右 */}
      <View style={styles.header}>
        <View style={styles.headerCenter} pointerEvents="none">
          <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
            <PixelCoinIcon size={28} />
          </View>
          <RubyText style={styles.headerTitle} parts={[["金", "きん"], ["庫", "こ"]]} rubySize={9} />
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("ChildDashboard", { childId })}
          style={styles.backButton}
          accessibilityLabel="おうちに もどる"
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <PixelHouseIcon size={12} />
            <Text style={styles.backText}>もどる</Text>
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <Text
          style={styles.headerTotalAmount}
          adjustsFontSizeToFit
          numberOfLines={1}
          accessibilityLabel={`ぜんぶで ${total.toLocaleString()}コロ`}
        >
          {total.toLocaleString()}コロ
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        minimumZoomScale={1}
        maximumZoomScale={3}
        bouncesZoom
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ── 1. Three Pocket Cards（総額はヘッダーに統合） ── */}
        <CoinSplitAnimation visible={showCoinSplit} onComplete={() => setShowCoinSplit(false)} />
        <View style={styles.pocketRow}>
          {/* つかう → SpendRequest */}
          <TouchableOpacity
            style={[
              styles.pocketCard,
              {
                borderLeftColor: palette.walletSpend,
                backgroundColor: palette.walletSpendBg,
              },
            ]}
            accessibilityLabel={`取引 ${spending}コロ`}
            onPress={() => navigation.navigate("SpendRequest", {
              childId,
              walletId,
              spendingBalance: spending,
            })}
          >
            <View style={styles.pocketIconBox}><PixelCartIcon size={20} /></View>
            <RubyText
              style={styles.pocketLabel}
              parts={[["取引", "とりひき"]]}
              rubySize={7}
            />
            <Text
              style={[styles.pocketAmount, { color: palette.walletSpend }]}
            >
              {spending.toLocaleString()}
            </Text>
            <RubyText
              style={styles.pocketHint}
              parts={[["商人", "しょうにん"], "と", ["取引", "とりひき"]]}
              rubySize={6}
              noWrap
            />
          </TouchableOpacity>

          {/* ためる → 貯金目標セクション */}
          <TouchableOpacity
            style={[
              styles.pocketCard,
              {
                borderLeftColor: palette.walletSave,
                backgroundColor: palette.walletSaveBg,
              },
            ]}
            accessibilityLabel={`金庫 ${saving}コロ`}
            onPress={() => setShowGoalModal(true)}
          >
            <View style={styles.pocketIconBox}><PixelPiggyIcon size={20} /></View>
            <RubyText
              style={styles.pocketLabel}
              parts={[["金庫", "きんこ"]]}
              rubySize={7}
            />
            <Text
              style={[styles.pocketAmount, { color: palette.walletSave }]}
            >
              {saving.toLocaleString()}
            </Text>
            <RubyText
              style={styles.pocketHint}
              parts={[["宝", "たから"], "をしまう"]}
              rubySize={6}
              noWrap
            />
          </TouchableOpacity>

          {/* ふやす → Invest */}
          <TouchableOpacity
            style={[
              styles.pocketCard,
              {
                borderLeftColor: palette.walletInvest,
                backgroundColor: palette.walletInvestBg,
              },
            ]}
            accessibilityLabel={`錬成 ${invest}コロ`}
            onPress={() => navigation.navigate("Invest", {
              childId,
              investBalance: wallet?.invest_balance ?? 0,
            })}
          >
            <View style={styles.pocketIconBox}><PixelChartIcon size={20} /></View>
            <RubyText
              style={styles.pocketLabel}
              parts={[["錬成", "れんせい"]]}
              rubySize={7}
            />
            <Text
              style={[styles.pocketAmount, { color: palette.walletInvest }]}
            >
              {invest.toLocaleString()}
            </Text>
            <RubyText
              style={styles.pocketHint}
              parts={["コロを", ["育", "そだ"], "てる"]}
              rubySize={6}
              noWrap
            />
          </TouchableOpacity>
        </View>

        {/* ── ふやすの木 ── */}
        <View style={styles.treeSection}>
          <MoneyTree investBalance={invest} size={120} />
          <View style={styles.treeInfo}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <PixelTreeIcon size={18} />
              <RubyText parts={[["錬成", "れんせい"], "の", ["木", "き"], `: ${getStage(invest).label}`]} style={styles.treeLabel} rubySize={6} />
            </View>
            {getStage(invest).next && (
              <AutoRubyText
                text={`次の成長まであと${(getStage(invest).next! - invest).toLocaleString()}コロ`}
                style={styles.treeProgress}
                rubySize={5}
              />
            )}
            {!getStage(invest).next && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <AutoRubyText text="最大まで 成長した！" style={[styles.treeProgress, { color: palette.accent, fontWeight: "bold" }]} rubySize={5} />
                <PixelConfettiIcon size={16} />
              </View>
            )}
          </View>
        </View>

        {/* ── 3. Spend Request Button ── */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.spendRequestButton}
            onPress={() =>
              navigation.navigate("SpendRequest", {
                childId,
                walletId,
                spendingBalance: wallet?.spending_balance ?? 0,
              })
            }
            accessibilityLabel="取引リクエストを送る"
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <PixelCartIcon size={18} />
              <RubyText parts={[["取引", "とりひき"], "！"]} style={styles.spendRequestButtonText} rubySize={5} noWrap rubyColor="rgba(255,255,255,0.6)" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.investButton}
            onPress={() =>
              navigation.navigate("Invest", {
                childId,
                walletId,
                investBalance: wallet?.invest_balance ?? 0,
              })
            }
            accessibilityLabel="とうし がめんを ひらく"
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <PixelChartIcon size={18} />
              <RubyText parts={[["錬成", "れんせい"], "！"]} style={styles.investButtonText} rubySize={5} noWrap rubyColor="rgba(255,255,255,0.6)" />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── 4. Spend Request Status Cards ── */}
        {recentSpendRequests.length > 0 && (
          <View style={styles.section}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <PixelCartIcon size={18} />
              <AutoRubyText text="取引リクエスト" style={styles.sectionTitle} rubySize={7} />
            </View>
            {recentSpendRequests.map((req) => {
              if (req.status === "pending") {
                return (
                  <View
                    key={req.id}
                    style={[
                      styles.requestCard,
                      { backgroundColor: palette.accentLight },
                    ]}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <PixelHourglassIcon size={16} />
                      <AutoRubyText text="申請中" style={styles.requestStatus} rubySize={5} />
                    </View>
                    <AutoRubyText text={req.purpose} style={styles.requestPurpose} rubySize={5} />
                    <Text style={styles.requestAmount}>
                      {req.amount.toLocaleString()}コロ
                    </Text>
                  </View>
                );
              }
              if (
                req.status === "approved" &&
                req.payment_status === "pending_payment"
              ) {
                return (
                  <View
                    key={req.id}
                    style={[
                      styles.requestCard,
                      { backgroundColor: palette.greenLight },
                    ]}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <PixelCheckIcon size={16} />
                      <AutoRubyText text="承認済 お金を待ってね" style={styles.requestStatus} rubySize={5} />
                    </View>
                    <AutoRubyText text={req.purpose} style={styles.requestPurpose} rubySize={5} />
                    <Text style={styles.requestAmount}>
                      {req.amount.toLocaleString()}コロ
                    </Text>
                  </View>
                );
              }
              if (req.status === "rejected") {
                return (
                  <View
                    key={req.id}
                    style={[
                      styles.requestCard,
                      { backgroundColor: palette.redLight },
                    ]}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <PixelCrossIcon size={16} />
                      <AutoRubyText text="許可されませんでした" style={styles.requestStatus} rubySize={5} />
                    </View>
                    {req.reject_reason && (
                      <AutoRubyText text={`理由: ${req.reject_reason}`} style={styles.requestReason} rubySize={5} />
                    )}
                    <Text style={styles.requestAmount}>
                      {req.amount.toLocaleString()}コロ
                    </Text>
                  </View>
                );
              }
              return null;
            })}
          </View>
        )}

        {/* ── 5. Savings Goals Section (= お宝マップ) ── */}
        <View style={styles.section}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <PixelPiggyIcon size={18} />
            <AutoRubyText text="お宝マップ" style={styles.sectionTitle} rubySize={6} />
          </View>

          {/* Unachieved goals */}
          {unachievedGoals.map((goal) => {
            const pct =
              goal.target_amount > 0
                ? Math.min(
                    100,
                    Math.round((saving / goal.target_amount) * 100)
                  )
                : 0;
            return (
              <View key={goal.id} style={styles.goalCard}>
                <AutoRubyText text={goal.title} style={styles.goalTitle} rubySize={5} />
                {pct >= 100 ? (
                  <SavingGoalMilestone
                    show={pct >= 100}
                    goalTitle={goal.title}
                    onComplete={() => {}}
                  />
                ) : (
                  <>
                    <View style={styles.goalProgressBar}>
                      <View
                        style={[
                          styles.goalProgressFill,
                          { width: `${pct}%` },
                        ]}
                      />
                    </View>
                    <View style={styles.goalAmountRow}>
                      <Text style={styles.goalAmountText}>
                        {saving.toLocaleString()} / {goal.target_amount.toLocaleString()} コロ
                      </Text>
                      <Text style={styles.goalPctText}>{pct}%</Text>
                    </View>
                  </>
                )}
              </View>
            );
          })}

          {/* Achieved goals */}
          {achievedGoals.map((goal) => (
            <View key={goal.id} style={styles.goalCardAchieved}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <PixelCheckIcon size={16} />
                <AutoRubyText text={goal.title} style={styles.goalTitle} rubySize={5} />
              </View>
              <AutoRubyText
                text={`${goal.target_amount.toLocaleString()} コロ 達成！`}
                style={styles.goalAmountText}
                rubySize={4}
              />
            </View>
          ))}

          {savingGoals.length === 0 && (
            <AutoRubyText text="まだお宝マップがないよ" style={[styles.emptyHint, { textAlign: "left" }]} rubySize={7} />
          )}

          <TouchableOpacity
            style={styles.addGoalButton}
            onPress={() => setShowGoalModal(true)}
            accessibilityLabel="お宝マップを作る"
          >
            <AutoRubyText
              text="＋ お宝マップを作る"
              style={styles.addGoalText}
              rubySize={7}
            />
          </TouchableOpacity>
        </View>

        {/* ── 6. Transaction History with Filter ── */}
        <View style={styles.section}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <PixelScrollIcon size={18} />
            <AutoRubyText text="冒険ログ" style={styles.sectionTitle} rubySize={7} />
          </View>

          {/* Filter tabs */}
          <View style={styles.filterRow}>
            {filterTabs.map((tab) => (
              <TouchableOpacity
                key={tab.value}
                style={[
                  styles.filterTab,
                  filterType === tab.value && styles.filterTabActive,
                ]}
                onPress={() => setFilterType(tab.value)}
                accessibilityLabel={tab.label}
              >
                <RubyText
                  parts={tab.parts}
                  style={[
                    styles.filterTabText,
                    filterType === tab.value && styles.filterTabTextActive,
                  ]}
                  rubySize={5}
                  noWrap
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Transaction list */}
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => {
              const { line1, line2 } = splitDescription(tx.description || txTypeName(tx.type));
              return (
                <View key={tx.id} style={styles.historyItem}>
                  <View style={styles.historyType}><TxTypeIcon type={tx.type} /></View>
                  <View style={styles.historyInfo}>
                    <AutoRubyText text={line1} style={styles.historyDesc} rubySize={4} noWrap />
                    {line2 ? (
                      <AutoRubyText text={line2} style={styles.historyDescSub} rubySize={4} noWrap />
                    ) : null}
                    <Text style={styles.historyDate}>
                      {new Date(tx.created_at).toLocaleDateString("ja-JP")}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.historyAmount,
                      { color: txAmountColor(tx.type) },
                    ]}
                  >
                    {tx.type === "earn" ? "+" : "-"}
                    {tx.amount.toLocaleString()}
                  </Text>
                </View>
              );
            })
          ) : (
            <AutoRubyText text="まだ履歴がないよ" style={styles.emptyHint} rubySize={5} />
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Saving Goal Modal */}
      <SavingGoalModal
        visible={showGoalModal}
        childId={childId}
        onClose={() => setShowGoalModal(false)}
        onCreated={() => {
          setShowGoalModal(false);
          loadData();
        }}
      />
      <CoinKunChat role="child" />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────

function createStyles(p: Palette) {
  return StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: p.background,
    },
    container: {
      flex: 1,
      backgroundColor: p.background,
    },

    // Header
    header: {
      position: "relative" as const,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 10,
      backgroundColor: p.background,
      borderBottomWidth: 1.5,
      borderBottomColor: p.border,
      minHeight: 56,
      gap: 8,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 5,
      borderWidth: 1,
      borderColor: p.primary,
      backgroundColor: p.background,
    },
    backText: {
      fontSize: 11,
      fontWeight: "bold",
      color: p.textMuted,
    },
    headerTitleGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flexShrink: 1,
      flex: 1,
      justifyContent: "center",
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
    headerTotalAmount: {
      fontSize: 12,
      fontWeight: "bold",
      color: p.accent,
    },
    headerTitle: {
      fontSize: rf(28),
      fontWeight: "900",
      color: p.primaryDark,
      textAlign: "center",
    },
    scroll: { flex: 1 },

    // Total Balance Card
    totalCard: {
      margin: 12,
      marginBottom: 0,
      padding: 20,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: p.goldBorder,
    },
    totalLabel: {
      fontSize: 14,
      fontWeight: "bold",
      color: p.textMuted,
      marginBottom: 4,
    },
    totalAmount: {
      fontSize: rf(28),
      fontWeight: "bold",
      color: p.textStrong,
    },

    // Three Pocket Cards
    pocketRow: {
      flexDirection: "row",
      marginHorizontal: 12,
      marginTop: 10,
      gap: 8,
    },
    pocketCard: {
      flex: 1,
      borderLeftWidth: 4,
      borderRadius: 12,
      padding: 12,
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: p.border,
    },
    pocketIcon: {
      fontSize: 22,
      marginBottom: 4,
    },
    pocketLabel: {
      fontSize: 12,
      color: p.textMuted,
      // ルビが上の SVG アイコンに被らないように余白を確保 (ルビは漢字の上に
      // 約 6-8px 出っ張るため、marginTop も含めて 8 + 14 ≒ 22 程度必要)
      marginTop: 22,
      marginBottom: 2,
    },
    pocketAmount: {
      fontSize: 16,
      fontWeight: "bold",
    },
    pocketHint: {
      fontSize: 9,
      color: p.textMuted,
      // 上のラベル/数字とルビが被らないように余白増
      marginTop: 10,
      textAlign: "center",
    },
    // 3SVGアイコンの寸法差を 20×20 固定枠で吸収
    pocketIconBox: {
      width: 20,
      height: 20,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },

    // Action Row
    actionRow: {
      flexDirection: "row",
      marginHorizontal: 12,
      marginTop: 12,
      gap: 8,
    },
    spendRequestButton: {
      flex: 1,
      backgroundColor: p.walletSpend,
      borderRadius: 14,
      minHeight: 52,
      alignItems: "center",
      justifyContent: "center",
    },
    spendRequestButtonText: {
      fontSize: rf(13),
      fontWeight: "bold",
      color: p.white,
    },
    investButton: {
      flex: 1,
      backgroundColor: p.walletInvest,
      borderRadius: 14,
      minHeight: 52,
      alignItems: "center",
      justifyContent: "center",
    },
    investButtonText: {
      fontSize: rf(13),
      fontWeight: "bold",
      color: p.white,
    },

    // Sections
    section: {
      margin: 12,
      marginBottom: 0,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: p.textStrong,
      marginBottom: 4,
    },

    // Spend Request Status Cards
    requestCard: {
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1.5,
      borderColor: p.border,
    },
    requestStatus: {
      fontSize: 14,
      fontWeight: "bold",
      color: p.textStrong,
      marginBottom: 4,
    },
    requestPurpose: {
      fontSize: 13,
      color: p.textBase,
      marginBottom: 2,
    },
    requestAmount: {
      fontSize: 15,
      fontWeight: "bold",
      color: p.textStrong,
    },
    requestReason: {
      fontSize: 13,
      color: p.textBase,
      marginBottom: 2,
    },

    // Saving Goals
    goalCard: {
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1.5,
      borderColor: p.walletSaveBorder,
    },
    goalCardAchieved: {
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1.5,
      borderColor: p.green,
    },
    goalTitle: {
      fontSize: 15,
      fontWeight: "bold",
      color: p.textStrong,
      marginBottom: 8,
    },
    goalProgressBar: {
      height: 10,
      borderRadius: 5,
      borderWidth: 0.5,
      borderColor: p.border,
      overflow: "hidden",
      marginBottom: 6,
    },
    goalProgressFill: {
      height: 10,
      backgroundColor: p.walletSave,
      borderRadius: 5,
    },
    goalAmountRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    goalAmountText: {
      fontSize: 13,
      color: p.textBase,
    },
    goalPctText: {
      fontSize: 13,
      fontWeight: "bold",
      color: p.walletSave,
    },
    addGoalButton: {
      borderWidth: 1.5,
      borderColor: p.walletSaveBorder,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      marginTop: 4,
    },
    addGoalText: {
      fontSize: 15,
      fontWeight: "bold",
      color: p.walletSave,
    },

    // Filter Tabs
    filterRow: {
      flexDirection: "row",
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: p.border,
      padding: 3,
      marginBottom: 10,
      justifyContent: "center",
      gap: 2,
    },
    filterTab: {
      flex: 1,
      minHeight: 44,
      minWidth: 48,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    filterTabActive: {
      backgroundColor: p.primary,
    },
    filterTabText: {
      fontSize: 11,
      color: p.textMuted,
    },
    filterTabTextActive: {
      color: p.white,
      fontWeight: "bold",
    },

    // Transaction History Items
    historyItem: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 10,
      padding: 12,
      marginBottom: 6,
      borderWidth: 1.5,
      borderColor: p.border,
    },
    historyType: {
      fontSize: 22,
      marginRight: 10,
      width: 32,
      textAlign: "center",
    },
    historyInfo: {
      flex: 1,
    },
    historyDesc: {
      fontSize: 13,
      fontWeight: "bold" as const,
      color: p.textStrong,
    },
    historyDescSub: {
      fontSize: 11,
      color: p.textBase,
      marginTop: 1,
    },
    historyDate: {
      fontSize: 11,
      color: p.textMuted,
      marginTop: 2,
    },
    historyAmount: {
      fontSize: 16,
      fontWeight: "bold",
      marginLeft: 8,
    },

    // Empty state
    emptyHint: {
      fontSize: 14,
      color: p.textMuted,
      marginVertical: 12,
    },
    loadingEmoji: { fontSize: 48, marginBottom: 12 },
    loadingText: { color: p.textMuted, marginTop: 12, fontSize: 14 },
    headerSpacer: { width: 56 },
    bottomSpacer: { height: 40 },
    treeSection: {
      alignItems: "center" as const,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 12,
      marginTop: 12,
      borderWidth: 1.5,
      borderColor: p.walletInvestBorder,
    },
    treeInfo: {
      alignItems: "center" as const,
      marginTop: 8,
    },
    treeLabel: {
      fontSize: rf(14),
      fontWeight: "bold" as const,
      color: p.walletInvestText,
    },
    treeProgress: {
      fontSize: 12,
      color: p.textMuted,
      marginTop: 4,
    },
  });
}
