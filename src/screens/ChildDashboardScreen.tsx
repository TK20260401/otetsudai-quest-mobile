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
import { getLevelProgress, getCurrentLevel } from "../lib/levels";
import type { Level } from "../lib/levels";
import { checkAndAwardBadges, BADGE_DEFINITIONS } from "../lib/badges";
import { getStampById } from "../lib/stamps";
import type { Task, Wallet, Transaction, Badge } from "../lib/types";
import CharacterSvg from "../components/CharacterSvg";
import LevelUpModal from "../components/LevelUpModal";
import PriceRequestModal from "../components/PriceRequestModal";
import ChildReactionModal from "../components/ChildReactionModal";
import { getChildStampById } from "../lib/child-stamps";

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
  const [mood, setMood] = useState<"active" | "normal" | "lonely">("normal");
  // レベルアップ演出
  const [prevLevelRef, setPrevLevelRef] = useState<Level | null>(null);
  const [levelUpModal, setLevelUpModal] = useState<{
    prev: Level;
    next: Level;
  } | null>(null);
  // クエストクリア演出
  const [questClearMsg, setQuestClearMsg] = useState<string | null>(null);
  // ねあげリクエスト
  const [priceRequestTask, setPriceRequestTask] = useState<Task | null>(null);
  // 返信済みメッセージ履歴
  const [repliedMessages, setRepliedMessages] = useState<any[]>([]);
  // 子ども返信モーダル
  const [unreadLogs, setUnreadLogs] = useState<
    { id: string; taskTitle: string; rewardAmount: number; parentStamp: string | null; parentMessage: string | null }[]
  >([]);

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
      // Recent approvals with stamp/message（未返信のみ表示）
      supabase
        .from("otetsudai_task_logs")
        .select("id, approval_stamp, approval_message, child_reaction_at, child_reaction_stamp, child_reaction_message, task:otetsudai_tasks(title)")
        .eq("child_id", childId)
        .eq("status", "approved")
        .not("approval_stamp", "is", null)
        .is("child_reaction_at", null)
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

    // Calculate total earned + level up detection
    if (walletRes.data) {
      const w = walletRes.data;
      const newTotal = w.spending_balance + w.saving_balance + w.invest_balance;
      const newLevel = getCurrentLevel(newTotal);

      // レベルアップ検出（prevLevelRefが存在し、レベルが上がった場合）
      if (prevLevelRef && newLevel.level > prevLevelRef.level) {
        setLevelUpModal({ prev: prevLevelRef, next: newLevel });
      }
      setPrevLevelRef(newLevel);
      setTotalEarned(newTotal);
    }

    // 機嫌判定：直近3日のクエスト活動
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const recentApprovals = (stampRes.data || []).filter(
      (s: any) => s.approved_at && new Date(s.approved_at) >= threeDaysAgo
    );
    // stampResにはapproved_atがないのでtask_logsから取得
    const { data: recentLogs } = await supabase
      .from("otetsudai_task_logs")
      .select("approved_at")
      .eq("child_id", childId)
      .eq("status", "approved")
      .gte("approved_at", threeDaysAgo.toISOString())
      .limit(1);
    if (recentLogs && recentLogs.length > 0) {
      setMood("active");
    } else {
      // 承認ログが1件以上あるのに最近ないならlonely
      const { count } = await supabase
        .from("otetsudai_task_logs")
        .select("id", { count: "exact", head: true })
        .eq("child_id", childId)
        .eq("status", "approved");
      setMood(count && count > 0 ? "lonely" : "normal");
    }

    // 未返信の承認済みログを検出
    const { data: unreplied } = await supabase
      .from("otetsudai_task_logs")
      .select("id, approval_stamp, approval_message, task:otetsudai_tasks(title, reward_amount)")
      .eq("child_id", childId)
      .eq("status", "approved")
      .is("child_reaction_at", null)
      .not("approval_stamp", "is", null)
      .order("approved_at", { ascending: true });

    const unread = (unreplied || []).map((log: any) => ({
      id: log.id,
      taskTitle: log.task?.title || "",
      rewardAmount: log.task?.reward_amount || 0,
      parentStamp: log.approval_stamp,
      parentMessage: log.approval_message,
    }));
    setUnreadLogs(unread);

    // 返信済みメッセージ履歴
    const { data: replied } = await supabase
      .from("otetsudai_task_logs")
      .select("id, approval_stamp, approval_message, child_reaction_stamp, child_reaction_message, child_reaction_at, task:otetsudai_tasks(title, reward_amount)")
      .eq("child_id", childId)
      .eq("status", "approved")
      .not("child_reaction_at", "is", null)
      .order("child_reaction_at", { ascending: false })
      .limit(10);
    setRepliedMessages(replied || []);

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

    // クリア前のレベルを記録
    const beforeLevel = getCurrentLevel(totalEarned);

    await supabase.from("otetsudai_task_logs").insert({
      task_id: task.id,
      child_id: childId,
      status: "pending",
    });
    setSubmitting(null);

    // キャラクターのクリア反応セリフ
    const clearMessages = [
      "やったね！クエストクリア！ ⚔️",
      "すごい！おやの しょうにんを まってね！",
      "かっこいい！つぎも がんばろう！",
      "ナイスクリア！きみは つよくなってる！",
    ];
    const msg = clearMessages[Math.floor(Math.random() * clearMessages.length)];
    setQuestClearMsg(msg);
    setTimeout(() => setQuestClearMsg(null), 3000);

    await checkAndAwardBadges(childId);
    await loadData();

    // レベルアップ検出（承認前なので実際のレベルアップはloadData後に確認）
    const afterLevel = getCurrentLevel(totalEarned);
    if (afterLevel.level > beforeLevel.level) {
      setLevelUpModal({ prev: beforeLevel, next: afterLevel });
    }
  }

  function handleLogout() {
    clearSession().then(() => {
      navigation.reset({ index: 0, routes: [{ name: "Landing" }] });
    });
  }

  function handleReset() {
    Alert.alert(
      "🔄 データリセット",
      "おさいふ・クエストログ・バッジをぜんぶリセットします。もとにもどせません。",
      [
        { text: "やめる", style: "cancel" },
        {
          text: "リセットする",
          style: "destructive",
          onPress: async () => {
            const session = await getSession();
            if (!session) return;

            // 財布を0に
            await supabase
              .from("otetsudai_wallets")
              .update({
                spending_balance: 0,
                saving_balance: 0,
                invest_balance: 0,
              })
              .eq("child_id", childId);

            // タスクログ削除
            await supabase
              .from("otetsudai_task_logs")
              .delete()
              .eq("child_id", childId);

            // バッジ削除
            await supabase
              .from("otetsudai_badges")
              .delete()
              .eq("child_id", childId);

            // トランザクション削除
            if (wallet) {
              await supabase
                .from("otetsudai_transactions")
                .delete()
                .eq("wallet_id", wallet.id);
            }

            Alert.alert("✅ リセットかんりょう", "データをリセットしました");
            await loadData();
          },
        },
      ]
    );
  }

  // ★特別クエスト: 期間内かどうか判定
  function isSpecialActive(task: Task): boolean {
    if (!task.is_special) return false;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (task.start_date && new Date(task.start_date) > today) return false;
    if (task.end_date) {
      const end = new Date(task.end_date);
      end.setDate(end.getDate() + 1); // end_date当日は含む
      if (today >= end) return false;
    }
    return true;
  }

  // ★特別クエスト: 残り日数テキスト
  function getCountdownText(endDate: string): string {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return "きょうまで！";
    if (diff === 1) return "あと1にち！";
    return `あと${diff}にち`;
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
        {/* キャラクター育成 */}
        <View style={[
          styles.levelCard,
          mood === "active" ? styles.levelCardActive :
          mood === "lonely" ? styles.levelCardLonely :
          styles.levelCardNormal,
        ]}>
          <View style={styles.characterColumn}>
            <CharacterSvg level={levelInfo.current.level} mood={mood} size={100} />
            <Text style={styles.appearanceText}>{levelInfo.current.appearance}</Text>
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelTitle}>
              Lv.{levelInfo.current.level} {levelInfo.current.title}
            </Text>
            {/* セリフ吹き出し */}
            <View style={styles.speechBubble}>
              <Text style={styles.speechText}>
                「{mood === "active"
                  ? levelInfo.current.greetingActive
                  : mood === "lonely"
                    ? levelInfo.current.greetingLonely
                    : levelInfo.current.greeting}」
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${levelInfo.progress}%` },
                ]}
              />
            </View>
            {levelInfo.next ? (
              <Text style={styles.levelNext}>
                つぎのレベルまで あと {levelInfo.remaining.toLocaleString()}えん
              </Text>
            ) : (
              <Text style={[styles.levelNext, { color: colors.amber, fontWeight: "bold" }]}>
                さいこうレベル たっせい！ 🎊
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

        {/* そうび（バッジ → 装備として表示） */}
        {badges.length > 0 && (
          <View style={styles.badgeCard}>
            <Text style={styles.sectionTitle}>⚔️ そうび</Text>
            <View style={styles.badgeRow}>
              {badges.map((b) => {
                const def = BADGE_DEFINITIONS[b.badge_type];
                return def ? (
                  <View key={b.id} style={styles.equipItem}>
                    <View style={styles.equipIconWrap}>
                      <Text style={styles.badgeEmoji}>{def.emoji}</Text>
                    </View>
                    <Text style={styles.badgeLabel}>{def.label}</Text>
                  </View>
                ) : null;
              })}
              {/* 未獲得スロット */}
              {Array.from({ length: Math.max(0, 5 - badges.length) }).map((_, i) => (
                <View key={`empty-${i}`} style={styles.equipItem}>
                  <View style={styles.equipIconEmpty}>
                    <Text style={styles.equipEmptyText}>？</Text>
                  </View>
                  <Text style={styles.badgeLabel}>？？？</Text>
                </View>
              ))}
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
            {/* ★特別クエスト */}
            {tasks.filter((t) => t.is_special && isSpecialActive(t)).length > 0 && (
              <>
                <Text style={styles.specialSectionTitle}>★ とくべつクエスト</Text>
                {tasks
                  .filter((t) => t.is_special && isSpecialActive(t))
                  .map((task) => (
                    <View key={task.id} style={styles.specialQuestCard}>
                      <View style={styles.specialQuestHeader}>
                        <Text style={styles.specialStars}>
                          {"★".repeat(task.special_difficulty || 1)}
                          {"☆".repeat(3 - (task.special_difficulty || 1))}
                        </Text>
                        {task.end_date && (
                          <Text style={styles.specialCountdown}>
                            {getCountdownText(task.end_date)}
                          </Text>
                        )}
                      </View>
                      <View style={styles.questInfo}>
                        <Text style={styles.questIcon}>
                          {getTaskIcon(task.title)}
                        </Text>
                        <View style={styles.questDetails}>
                          <Text style={styles.specialQuestTitle}>{task.title}</Text>
                          <View style={styles.rewardRow}>
                            <Text style={styles.specialQuestReward}>
                              💰 {task.reward_amount}えん
                            </Text>
                            {task.proposal_status === "pending" && (
                              <Text style={styles.pendingBadge}>⏳ リクエストちゅう</Text>
                            )}
                          </View>
                          {task.description && (
                            <Text style={styles.specialQuestDesc}>
                              {task.description}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.questActions}>
                        <TouchableOpacity
                          style={styles.specialClearButton}
                          onPress={() => handleComplete(task)}
                          disabled={submitting === task.id}
                        >
                          <Text style={styles.clearButtonText}>
                            {submitting === task.id ? "..." : "★ クリア！"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
              </>
            )}

            {/* 通常クエスト */}
            {tasks.filter((t) => !t.is_special).length > 0 && (
              <>
                {tasks.filter((t) => t.is_special && isSpecialActive(t)).length > 0 && (
                  <Text style={[styles.sectionTitle, { marginTop: 16 }]}>クエスト</Text>
                )}
                {tasks
                  .filter((t) => !t.is_special)
                  .map((task) => (
                    <View key={task.id} style={styles.questCard}>
                      <View style={styles.questInfo}>
                        <Text style={styles.questIcon}>
                          {getTaskIcon(task.title)}
                        </Text>
                        <View style={styles.questDetails}>
                          <Text style={styles.questTitle}>{task.title}</Text>
                          <View style={styles.rewardRow}>
                            <Text style={styles.questReward}>
                              💰 {task.reward_amount}えん
                            </Text>
                            {task.proposal_status === "pending" && (
                              <Text style={styles.pendingBadge}>⏳ リクエストちゅう</Text>
                            )}
                          </View>
                          {task.price_change_comment && (
                            <Text style={styles.priceComment}>
                              📝 「{task.price_change_comment}」
                            </Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.questActions}>
                        <TouchableOpacity
                          style={styles.clearButton}
                          onPress={() => handleComplete(task)}
                          disabled={submitting === task.id}
                        >
                          <Text style={styles.clearButtonText}>
                            {submitting === task.id ? "..." : "クリア！"}
                          </Text>
                        </TouchableOpacity>
                        {task.proposal_status !== "pending" && (
                          <TouchableOpacity
                            style={styles.priceUpButton}
                            onPress={() => setPriceRequestTask(task)}
                          >
                            <Text style={styles.priceUpText}>💰↑</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
              </>
            )}

            {tasks.length === 0 && (
              <Text style={styles.emptyText}>
                クエストがまだないよ。おやにたのんでね！
              </Text>
            )}
          </View>
        )}

        {/* History */}
        {tab === "history" && (
          <View style={styles.section}>
            {/* 返信済みメッセージ履歴 */}
            {repliedMessages.length > 0 && (
              <View style={styles.repliedSection}>
                <Text style={styles.repliedTitle}>💬 おやとの やりとり</Text>
                {repliedMessages.map((log: any) => {
                  const cStamp = log.child_reaction_stamp
                    ? getChildStampById(log.child_reaction_stamp)
                    : null;
                  const pStamp = log.approval_stamp
                    ? getStampById(log.approval_stamp)
                    : null;
                  return (
                    <View key={log.id} style={styles.repliedCard}>
                      <Text style={styles.repliedTaskName}>🎯 {log.task?.title}</Text>
                      {pStamp && (
                        <Text style={styles.repliedParent}>
                          おや: {pStamp.emoji} {pStamp.label}
                          {log.approval_message ? ` 「${log.approval_message}」` : ""}
                        </Text>
                      )}
                      <Text style={styles.repliedChild}>
                        じぶん: {cStamp ? `${cStamp.emoji} ${cStamp.label}` : ""}
                        {log.child_reaction_message ? ` 「${log.child_reaction_message}」` : ""}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}

            {transactions.length === 0 && repliedMessages.length === 0 ? (
              <Text style={styles.emptyText}>まだりれきがないよ</Text>
            ) : transactions.length === 0 ? null : (
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

        {/* 開発用リセット */}
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetText}>🔄 データリセット（テスト用）</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* クエストクリア時のキャラ反応（フローティング） */}
      {questClearMsg && (
        <View style={styles.questClearBanner}>
          <CharacterSvg level={levelInfo.current.level} mood="active" size={48} />
          <Text style={styles.questClearText}>{questClearMsg}</Text>
        </View>
      )}

      {/* 子ども返信モーダル（返信必須） */}
      {unreadLogs.length > 0 && (
        <ChildReactionModal
          logs={unreadLogs}
          onAllDone={() => {
            setUnreadLogs([]);
            loadData();
          }}
        />
      )}

      {/* ねあげリクエストモーダル */}
      {priceRequestTask && (
        <PriceRequestModal
          visible={!!priceRequestTask}
          task={priceRequestTask}
          onClose={() => setPriceRequestTask(null)}
          onSent={() => {
            setPriceRequestTask(null);
            loadData();
          }}
        />
      )}

      {/* レベルアップ演出モーダル */}
      {levelUpModal && (
        <LevelUpModal
          visible={!!levelUpModal}
          prevLevel={levelUpModal.prev}
          newLevel={levelUpModal.next}
          onClose={() => setLevelUpModal(null)}
        />
      )}
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

  // キャラクター育成
  levelCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    margin: 12,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  levelCardActive: {
    backgroundColor: "#ecfdf5",
    borderColor: "#6ee7b7",
  },
  levelCardNormal: {
    backgroundColor: "#fffbeb",
    borderColor: "#fcd34d",
  },
  levelCardLonely: {
    backgroundColor: "#eff6ff",
    borderColor: "#93c5fd",
  },
  characterColumn: {
    alignItems: "center" as const,
    marginRight: 8,
    minWidth: 100,
  },
  appearanceText: {
    fontSize: 9,
    color: colors.slate,
    marginTop: -2,
    textAlign: "center" as const,
  },
  levelInfo: { flex: 1 },
  levelTitle: { fontSize: 15, fontWeight: "bold" as const, color: colors.slateDark },
  speechBubble: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
    marginBottom: 6,
  },
  speechText: {
    fontSize: 12,
    color: "#374151",
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.grayLight,
    borderRadius: 4,
    overflow: "hidden" as const,
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
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badgeEmoji: { fontSize: 24 },
  badgeLabel: { fontSize: 9, color: colors.slate, textAlign: "center" as const },
  equipItem: { alignItems: "center" as const, width: 60 },
  equipIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fef3c7",
    borderWidth: 2,
    borderColor: colors.amber,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 4,
  },
  equipIconEmpty: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.grayLight,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 4,
  },
  equipEmptyText: {
    fontSize: 18,
    color: colors.gray,
  },

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
  // ★特別クエスト
  specialSectionTitle: {
    fontSize: 17,
    fontWeight: "bold" as const,
    color: colors.gold,
    marginBottom: 8,
  },
  specialQuestCard: {
    backgroundColor: colors.goldLight,
    borderWidth: 2,
    borderColor: colors.goldBorder,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  specialQuestHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 6,
  },
  specialStars: {
    fontSize: 16,
    color: colors.gold,
    letterSpacing: 2,
  },
  specialCountdown: {
    fontSize: 12,
    fontWeight: "bold" as const,
    color: colors.red,
    backgroundColor: "#fef2f2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden" as const,
  },
  specialQuestTitle: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: colors.slateDark,
  },
  specialQuestReward: {
    fontSize: 14,
    fontWeight: "bold" as const,
    color: colors.gold,
  },
  specialQuestDesc: {
    fontSize: 12,
    color: colors.slate,
    marginTop: 2,
  },
  specialClearButton: {
    backgroundColor: colors.gold,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
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
  rewardRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginTop: 2,
  },
  questReward: { fontSize: 13, color: colors.amber },
  pendingBadge: {
    fontSize: 10,
    color: colors.slate,
    backgroundColor: colors.grayLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  priceComment: {
    fontSize: 11,
    color: colors.primaryDark,
    marginTop: 2,
  },
  questActions: {
    alignItems: "center" as const,
    gap: 4,
    marginLeft: 8,
  },
  clearButton: {
    backgroundColor: colors.amber,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  clearButtonText: { color: colors.white, fontWeight: "bold" as const, fontSize: 14 },
  priceUpButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  priceUpText: { fontSize: 12 },

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

  // 返信済みメッセージ履歴
  repliedSection: {
    marginBottom: 16,
  },
  repliedTitle: {
    fontSize: 15,
    fontWeight: "bold" as const,
    color: colors.slateDark,
    marginBottom: 8,
  },
  repliedCard: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  repliedTaskName: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.slateDark,
    marginBottom: 4,
  },
  repliedParent: {
    fontSize: 12,
    color: colors.slate,
    marginBottom: 2,
  },
  repliedChild: {
    fontSize: 12,
    color: colors.primaryDark,
  },

  // クエストクリア反応バナー
  questClearBanner: {
    position: "absolute" as const,
    bottom: 40,
    left: 16,
    right: 16,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "#065f46",
    borderRadius: 16,
    padding: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  questClearText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "bold" as const,
    color: "#FFFFFF",
  },

  // リセットボタン
  resetButton: {
    margin: 12,
    marginTop: 24,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed" as const,
    alignItems: "center" as const,
  },
  resetText: {
    fontSize: 12,
    color: colors.gray,
  },
});
