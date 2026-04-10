import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { getSession, clearSession } from "../lib/session";
import { colors } from "../lib/colors";
import { getTaskIcon } from "../lib/task-icons";
import { getLevelProgress } from "../lib/levels";
import { checkAndAwardBadges, BADGE_DEFINITIONS } from "../lib/badges";
import { getStampById } from "../lib/stamps";
import type { Task, Wallet, Transaction, Badge } from "../lib/types";

export default function ChildDashboardScreen({
  route,
  navigation,
}: {
  route: any;
  navigation: any;
}) {
  const { childId } = route.params;
  const [childName, setChildName] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [stampNotifs, setStampNotifs] = useState<
    { id: string; taskTitle: string; stamp: string | null; message: string | null }[]
  >([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [tab, setTab] = useState<"quests" | "history">("quests");

  const loadData = useCallback(async () => {
    const session = await getSession();
    if (!session) return;

    setChildName(session.name);

    const [taskRes, walletRes, txRes, badgeRes, stampRes] = await Promise.all([
      supabase
        .from("otetsudai_tasks")
        .select("*")
        .eq("family_id", session.familyId)
        .eq("is_active", true)
        .or(
          `assigned_child_id.is.null,assigned_child_id.eq.${childId}`
        ),
      supabase
        .from("otetsudai_wallets")
        .select("*")
        .eq("child_id", childId)
        .single(),
      supabase
        .from("otetsudai_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("otetsudai_badges")
        .select("*")
        .eq("child_id", childId),
      // Recent approvals with stamp/message
      supabase
        .from("otetsudai_task_logs")
        .select("id, approval_stamp, approval_message, task:otetsudai_tasks(title)")
        .eq("child_id", childId)
        .eq("status", "approved")
        .not("approval_stamp", "is", null)
        .order("approved_at", { ascending: false })
        .limit(5),
    ]);

    setTasks(taskRes.data || []);
    setWallet(walletRes.data);
    setTransactions(txRes.data || []);
    setBadges(badgeRes.data || []);

    // Stamp notifications from parents
    const stamps = (stampRes.data || []).map((s: any) => ({
      id: s.id,
      taskTitle: s.task?.title || "",
      stamp: s.approval_stamp,
      message: s.approval_message,
    }));
    setStampNotifs(stamps);

    // Calculate total earned
    if (walletRes.data) {
      const w = walletRes.data;
      setTotalEarned(
        w.spending_balance + w.saving_balance + w.invest_balance
      );
    }

    setLoading(false);
  }, [childId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  async function handleComplete(task: Task) {
    setSubmitting(task.id);
    await supabase.from("otetsudai_task_logs").insert({
      task_id: task.id,
      child_id: childId,
      status: "pending",
    });
    setSubmitting(null);
    Alert.alert("🎉 クエストクリア！", "おやのしょうにんをまってね！");
    await checkAndAwardBadges(childId);
    await loadData();
  }

  function handleLogout() {
    clearSession().then(() => {
      navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const levelInfo = getLevelProgress(totalEarned);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          🧒 {childName}
        </Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>← もどる</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Level */}
        <View style={styles.levelCard}>
          <Text style={styles.levelIcon}>{levelInfo.current.icon}</Text>
          <View style={styles.levelInfo}>
            <Text style={styles.levelTitle}>
              Lv.{levelInfo.current.level} {levelInfo.current.title}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${levelInfo.progress}%` },
                ]}
              />
            </View>
            {levelInfo.next && (
              <Text style={styles.levelNext}>
                つぎのレベルまで あと {levelInfo.remaining}えん
              </Text>
            )}
          </View>
        </View>

        {/* Stamp Notifications */}
        {stampNotifs.length > 0 && (
          <View style={styles.stampCard}>
            <Text style={styles.sectionTitle}>おやからのメッセージ</Text>
            {stampNotifs.map((s) => {
              const stampDef = s.stamp ? getStampById(s.stamp) : null;
              return (
                <View key={s.id} style={styles.stampNotif}>
                  {stampDef && (
                    <Text style={styles.stampNotifEmoji}>{stampDef.emoji}</Text>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stampNotifTask}>{s.taskTitle}</Text>
                    {stampDef && (
                      <Text style={styles.stampNotifLabel}>
                        {stampDef.label}
                      </Text>
                    )}
                    {s.message && (
                      <Text style={styles.stampNotifMsg}>
                        「{s.message}」
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Wallet */}
        {wallet && (
          <View style={styles.walletCard}>
            <Text style={styles.walletTitle}>おさいふ</Text>
            <Text style={styles.walletTotal}>
              {(
                wallet.spending_balance +
                wallet.saving_balance +
                wallet.invest_balance
              ).toLocaleString()}
              えん
            </Text>
            <View style={styles.walletRow}>
              <View style={[styles.walletItem, { borderColor: colors.spend }]}>
                <Text style={styles.walletLabel}>つかう</Text>
                <Text style={[styles.walletAmount, { color: colors.spend }]}>
                  {wallet.spending_balance.toLocaleString()}
                </Text>
              </View>
              <View style={[styles.walletItem, { borderColor: colors.save }]}>
                <Text style={styles.walletLabel}>ためる</Text>
                <Text style={[styles.walletAmount, { color: colors.save }]}>
                  {wallet.saving_balance.toLocaleString()}
                </Text>
              </View>
              <View
                style={[styles.walletItem, { borderColor: colors.invest }]}
              >
                <Text style={styles.walletLabel}>ふやす</Text>
                <Text style={[styles.walletAmount, { color: colors.invest }]}>
                  {wallet.invest_balance.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <View style={styles.badgeCard}>
            <Text style={styles.sectionTitle}>バッジ</Text>
            <View style={styles.badgeRow}>
              {badges.map((b) => {
                const def = BADGE_DEFINITIONS[b.badge_type];
                return def ? (
                  <View key={b.id} style={styles.badgeItem}>
                    <Text style={styles.badgeEmoji}>{def.emoji}</Text>
                    <Text style={styles.badgeLabel}>{def.label}</Text>
                  </View>
                ) : null;
              })}
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabButton, tab === "quests" && styles.tabActive]}
            onPress={() => setTab("quests")}
          >
            <Text
              style={[
                styles.tabText,
                tab === "quests" && styles.tabTextActive,
              ]}
            >
              クエスト
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, tab === "history" && styles.tabActive]}
            onPress={() => setTab("history")}
          >
            <Text
              style={[
                styles.tabText,
                tab === "history" && styles.tabTextActive,
              ]}
            >
              りれき
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quest list */}
        {tab === "quests" && (
          <View style={styles.section}>
            {tasks.length === 0 ? (
              <Text style={styles.emptyText}>
                クエストがまだないよ。おやにたのんでね！
              </Text>
            ) : (
              tasks.map((task) => (
                <View key={task.id} style={styles.questCard}>
                  <View style={styles.questInfo}>
                    <Text style={styles.questIcon}>
                      {getTaskIcon(task.title)}
                    </Text>
                    <View style={styles.questDetails}>
                      <Text style={styles.questTitle}>{task.title}</Text>
                      <Text style={styles.questReward}>
                        💰 {task.reward_amount}えん
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => handleComplete(task)}
                    disabled={submitting === task.id}
                  >
                    <Text style={styles.clearButtonText}>
                      {submitting === task.id ? "..." : "クリア！"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* History */}
        {tab === "history" && (
          <View style={styles.section}>
            {transactions.length === 0 ? (
              <Text style={styles.emptyText}>まだりれきがないよ</Text>
            ) : (
              transactions.map((tx) => (
                <View key={tx.id} style={styles.historyItem}>
                  <Text style={styles.historyType}>
                    {tx.type === "earn"
                      ? "💰"
                      : tx.type === "spend"
                        ? "🛒"
                        : tx.type === "save"
                          ? "🐷"
                          : "📈"}
                  </Text>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyDesc}>
                      {tx.description || tx.type}
                    </Text>
                    <Text style={styles.historyDate}>
                      {new Date(tx.created_at).toLocaleDateString("ja-JP")}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.historyAmount,
                      {
                        color:
                          tx.type === "earn" ? colors.primary : colors.spend,
                      },
                    ]}
                  >
                    {tx.type === "earn" ? "+" : "-"}
                    {tx.amount}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.slateLight,
  },
  container: {
    flex: 1,
    backgroundColor: colors.slateLight,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primaryDark,
    flex: 1,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.grayLight,
  },
  logoutText: { fontSize: 14, color: colors.slate },
  scroll: { flex: 1 },

  // Level
  levelCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    margin: 12,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  levelIcon: { fontSize: 36, marginRight: 12 },
  levelInfo: { flex: 1 },
  levelTitle: { fontSize: 16, fontWeight: "bold", color: colors.slateDark },
  progressBar: {
    height: 8,
    backgroundColor: colors.grayLight,
    borderRadius: 4,
    marginTop: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  levelNext: { fontSize: 11, color: colors.slate, marginTop: 4 },

  // Wallet
  walletCard: {
    backgroundColor: colors.white,
    margin: 12,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  walletTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.slate,
    marginBottom: 4,
  },
  walletTotal: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.slateDark,
    marginBottom: 12,
  },
  walletRow: {
    flexDirection: "row",
    gap: 8,
  },
  walletItem: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  walletLabel: { fontSize: 12, color: colors.slate, marginBottom: 2 },
  walletAmount: { fontSize: 16, fontWeight: "bold" },

  // Badges
  // Stamp notifications
  stampCard: {
    backgroundColor: colors.amberLight,
    margin: 12,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  stampNotif: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  stampNotifEmoji: { fontSize: 32, marginRight: 10 },
  stampNotifTask: { fontSize: 13, color: colors.slate },
  stampNotifLabel: { fontSize: 15, fontWeight: "bold", color: colors.slateDark },
  stampNotifMsg: { fontSize: 13, color: colors.primaryDark, marginTop: 2 },

  badgeCard: {
    backgroundColor: colors.white,
    margin: 12,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.slateDark,
    marginBottom: 8,
  },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  badgeItem: { alignItems: "center", width: 64 },
  badgeEmoji: { fontSize: 28 },
  badgeLabel: { fontSize: 10, color: colors.slate, textAlign: "center" },

  // Tabs
  tabRow: {
    flexDirection: "row",
    margin: 12,
    marginBottom: 0,
    backgroundColor: colors.grayLight,
    borderRadius: 10,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  tabActive: { backgroundColor: colors.white },
  tabText: { fontSize: 14, color: colors.slate },
  tabTextActive: { color: colors.slateDark, fontWeight: "bold" },

  // Quests
  section: { margin: 12, marginBottom: 0 },
  questCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  questInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  questIcon: { fontSize: 28, marginRight: 10 },
  questDetails: { flex: 1 },
  questTitle: { fontSize: 15, fontWeight: "600", color: colors.slateDark },
  questReward: { fontSize: 13, color: colors.amber, marginTop: 2 },
  clearButton: {
    backgroundColor: colors.amber,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 8,
  },
  clearButtonText: { color: colors.white, fontWeight: "bold", fontSize: 14 },

  // History
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  historyType: { fontSize: 22, marginRight: 10 },
  historyInfo: { flex: 1 },
  historyDesc: { fontSize: 14, color: colors.slateDark },
  historyDate: { fontSize: 11, color: colors.gray, marginTop: 2 },
  historyAmount: { fontSize: 16, fontWeight: "bold" },

  emptyText: {
    textAlign: "center",
    color: colors.slate,
    fontSize: 14,
    paddingVertical: 24,
  },
});
