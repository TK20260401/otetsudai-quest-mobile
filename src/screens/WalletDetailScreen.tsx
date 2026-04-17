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
import type { Wallet, Transaction, SpendRequest, SavingGoal } from "../lib/types";
import MoneyTree, { getStage } from "../components/MoneyTree";
import { PixelChestOpenIcon, PixelCoinIcon, PixelCartIcon, PixelPiggyIcon, PixelChartIcon, PixelTreeIcon, PixelConfettiIcon, PixelHourglassIcon, PixelCheckIcon, PixelCrossIcon, PixelScrollIcon } from "../components/PixelIcons";

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

  const filterTabs: { label: string; value: string }[] = [
    { label: "全部", value: "all" },
    { label: "💰 稼ぐ", value: "earn" },
    { label: "🛒 使う", value: "spend" },
    { label: "🐷 貯める", value: "save" },
    { label: "📈 増やす", value: "invest" },
  ];

  function txTypeEmoji(type: string): string {
    switch (type) {
      case "earn":
        return "💰";
      case "spend":
        return "🛒";
      case "save":
        return "🐷";
      case "invest":
        return "📈";
      default:
        return "💰";
    }
  }

  function txTypeName(type: string): string {
    switch (type) {
      case "earn":
        return "かせいだ";
      case "spend":
        return "つかった";
      case "save":
        return "ためた";
      case "invest":
        return "ふやした";
      default:
        return type;
    }
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="もどる"
        >
          <Text style={styles.backText}>← もどる</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <PixelCoinIcon size={22} />
          <AutoRubyText text="おさいふ" style={styles.headerTitle} rubySize={7} />
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ── 1. Total Balance Card ── */}
        <View style={styles.totalCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <PixelChestOpenIcon size={22} />
            <AutoRubyText
              text="ぜんぶの おかね"
              style={styles.totalLabel}
              rubySize={7}
            />
          </View>
          <Text
            style={styles.totalAmount}
            adjustsFontSizeToFit
            numberOfLines={1}
          >
            {total.toLocaleString()}円
          </Text>
        </View>

        {/* ── 2. Three Pocket Cards ── */}
        <View style={styles.pocketRow}>
          {/* つかう */}
          <View
            style={[
              styles.pocketCard,
              {
                borderLeftColor: palette.walletSpend,
                backgroundColor: palette.walletSpendBg,
              },
            ]}
            accessibilityLabel={`つかう ${spending}円`}
          >
            <PixelCartIcon size={20} />
            <RubyText
              style={styles.pocketLabel}
              parts={[["使", "つか"], "う"]}
              rubySize={7}
            />
            <Text
              style={[styles.pocketAmount, { color: palette.walletSpend }]}
            >
              {spending.toLocaleString()}
            </Text>
          </View>

          {/* ためる */}
          <View
            style={[
              styles.pocketCard,
              {
                borderLeftColor: palette.walletSave,
                backgroundColor: palette.walletSaveBg,
              },
            ]}
            accessibilityLabel={`ためる ${saving}円`}
          >
            <PixelPiggyIcon size={20} />
            <RubyText
              style={styles.pocketLabel}
              parts={[["貯", "た"], "める"]}
              rubySize={7}
            />
            <Text
              style={[styles.pocketAmount, { color: palette.walletSave }]}
            >
              {saving.toLocaleString()}
            </Text>
          </View>

          {/* ふやす */}
          <View
            style={[
              styles.pocketCard,
              {
                borderLeftColor: palette.walletInvest,
                backgroundColor: palette.walletInvestBg,
              },
            ]}
            accessibilityLabel={`ふやす ${invest}円`}
          >
            <PixelChartIcon size={20} />
            <RubyText
              style={styles.pocketLabel}
              parts={[["増", "ふ"], "やす"]}
              rubySize={7}
            />
            <Text
              style={[styles.pocketAmount, { color: palette.walletInvest }]}
            >
              {invest.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* ── ふやすの木 ── */}
        <View style={styles.treeSection}>
          <MoneyTree investBalance={invest} size={120} />
          <View style={styles.treeInfo}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <PixelTreeIcon size={18} />
              <AutoRubyText text={`ふやすの木: ${getStage(invest).label}`} style={styles.treeLabel} rubySize={6} />
            </View>
            {getStage(invest).next && (
              <AutoRubyText
                text={`次の成長まで あと ${(getStage(invest).next! - invest).toLocaleString()}円`}
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
            accessibilityLabel="つかうリクエストを おくる"
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <PixelCartIcon size={18} />
              <Text style={styles.spendRequestButtonText}>つかいたい！</Text>
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
              <Text style={styles.investButtonText}>ふやす！</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── 4. Spend Request Status Cards ── */}
        {recentSpendRequests.length > 0 && (
          <View style={styles.section}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <PixelCartIcon size={18} />
              <AutoRubyText text="つかうリクエスト" style={styles.sectionTitle} rubySize={7} />
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
                      <Text style={styles.requestStatus}>しんせいちゅう</Text>
                    </View>
                    <Text style={styles.requestPurpose}>{req.purpose}</Text>
                    <Text style={styles.requestAmount}>
                      {req.amount.toLocaleString()}円
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
                      <Text style={styles.requestStatus}>しょうにんずみ おかねをまってね</Text>
                    </View>
                    <Text style={styles.requestPurpose}>{req.purpose}</Text>
                    <Text style={styles.requestAmount}>
                      {req.amount.toLocaleString()}円
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
                      <Text style={styles.requestStatus}>きょかされませんでした</Text>
                    </View>
                    {req.reject_reason && (
                      <Text style={styles.requestReason}>
                        りゆう: {req.reject_reason}
                      </Text>
                    )}
                    <Text style={styles.requestAmount}>
                      {req.amount.toLocaleString()}円
                    </Text>
                  </View>
                );
              }
              return null;
            })}
          </View>
        )}

        {/* ── 5. Savings Goals Section ── */}
        <View style={styles.section}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <PixelPiggyIcon size={18} />
            <AutoRubyText text="ちょきん目標" style={styles.sectionTitle} rubySize={7} />
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
                <Text style={styles.goalTitle}>{goal.title}</Text>
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
                    {saving.toLocaleString()} / {goal.target_amount.toLocaleString()} 円
                  </Text>
                  <Text style={styles.goalPctText}>{pct}%</Text>
                </View>
              </View>
            );
          })}

          {/* Achieved goals */}
          {achievedGoals.map((goal) => (
            <View key={goal.id} style={styles.goalCardAchieved}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <PixelCheckIcon size={16} />
                <Text style={styles.goalTitle}>{goal.title}</Text>
              </View>
              <Text style={styles.goalAmountText}>
                {goal.target_amount.toLocaleString()} 円 達成！
              </Text>
            </View>
          ))}

          {savingGoals.length === 0 && (
            <Text style={styles.emptyHint}>
              まだ ちょきん目標が ないよ
            </Text>
          )}

          <TouchableOpacity
            style={styles.addGoalButton}
            onPress={() => setShowGoalModal(true)}
            accessibilityLabel="ちょきん目標をつくる"
          >
            <AutoRubyText
              text="＋ 目標をつくる"
              style={styles.addGoalText}
              rubySize={7}
            />
          </TouchableOpacity>
        </View>

        {/* ── 6. Transaction History with Filter ── */}
        <View style={styles.section}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <PixelScrollIcon size={18} />
            <AutoRubyText text="履歴" style={styles.sectionTitle} rubySize={7} />
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
                <Text
                  style={[
                    styles.filterTabText,
                    filterType === tab.value && styles.filterTabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Transaction list */}
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => (
              <View key={tx.id} style={styles.historyItem}>
                <Text style={styles.historyType}>{txTypeEmoji(tx.type)}</Text>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyDesc}>
                    {tx.description || txTypeName(tx.type)}
                  </Text>
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
            ))
          ) : (
            <Text style={styles.emptyHint}>まだ りれきが ないよ</Text>
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
      backgroundColor: p.surfaceMuted,
    },
    container: {
      flex: 1,
      backgroundColor: p.surfaceMuted,
    },

    // Header
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: p.white,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
    },
    backButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: p.surfaceMuted,
      minHeight: 48,
      justifyContent: "center",
    },
    backText: {
      fontSize: 14,
      color: p.textMuted,
    },
    headerTitle: {
      fontSize: rf(18),
      fontWeight: "bold",
      color: p.primaryDark,
      textAlign: "center",
    },
    scroll: { flex: 1 },

    // Total Balance Card
    totalCard: {
      backgroundColor: p.white,
      margin: 12,
      marginBottom: 0,
      padding: 20,
      borderRadius: 12,
      alignItems: "center",
      shadowColor: p.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
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
      shadowColor: p.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    pocketIcon: {
      fontSize: 22,
      marginBottom: 4,
    },
    pocketLabel: {
      fontSize: 12,
      color: p.textMuted,
      marginBottom: 2,
      lineHeight: 20,
    },
    pocketAmount: {
      fontSize: 16,
      fontWeight: "bold",
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
      shadowColor: p.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    spendRequestButtonText: {
      fontSize: rf(16),
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
      shadowColor: p.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    investButtonText: {
      fontSize: rf(16),
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
      marginBottom: 8,
    },

    // Spend Request Status Cards
    requestCard: {
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
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
      backgroundColor: p.white,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      shadowColor: p.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    goalCardAchieved: {
      backgroundColor: p.greenLight,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
    },
    goalTitle: {
      fontSize: 15,
      fontWeight: "bold",
      color: p.textStrong,
      marginBottom: 8,
    },
    goalProgressBar: {
      height: 10,
      backgroundColor: p.surfaceMuted,
      borderRadius: 5,
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
      backgroundColor: p.walletSaveBg,
      borderWidth: 1,
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
      backgroundColor: p.surfaceMuted,
      borderRadius: 10,
      padding: 3,
      marginBottom: 10,
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
      backgroundColor: p.white,
      borderRadius: 10,
      padding: 12,
      marginBottom: 6,
      shadowColor: p.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
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
      fontSize: 14,
      color: p.textStrong,
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
      textAlign: "center",
      paddingVertical: 20,
    },
    loadingEmoji: { fontSize: 48, marginBottom: 12 },
    loadingText: { color: p.textMuted, marginTop: 12, fontSize: 14 },
    headerSpacer: { width: 80 },
    bottomSpacer: { height: 40 },
    treeSection: {
      alignItems: "center" as const,
      backgroundColor: p.surface,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 12,
      marginTop: 12,
      borderWidth: 1,
      borderColor: p.walletInvestBorder,
      shadowColor: p.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
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
