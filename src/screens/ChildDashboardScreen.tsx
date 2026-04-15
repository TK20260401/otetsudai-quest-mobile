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
import { getSession, clearSession } from "../lib/session";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import { getTaskIcon } from "../lib/task-icons";
import { getLevelProgress, getCurrentLevel } from "../lib/levels";
import type { Level } from "../lib/levels";
import { checkAndAwardBadges, BADGE_DEFINITIONS } from "../lib/badges";
import { getStampById } from "../lib/stamps";
import type { Task, Wallet, Transaction, Badge, FamilySettings, SpendRequest } from "../lib/types";
import CharacterSvg from "../components/CharacterSvg";
import { RubyText, RubyStr, AutoRubyText } from "../components/Ruby";
import LevelUpModal from "../components/LevelUpModal";
import PriceRequestModal from "../components/PriceRequestModal";
import ChildReactionModal from "../components/ChildReactionModal";
import { getChildStampById } from "../lib/child-stamps";
import { useAppAlert } from "../components/AppAlert";
import AnimatedButton from "../components/AnimatedButton";
import BadgeUnlockModal from "../components/BadgeUnlockModal";
import * as Haptics from "expo-haptics";
import { useReducedMotion } from "../lib/useReducedMotion";

export default function ChildDashboardScreen({
  route,
  navigation,
}: {
  route: any;
  navigation: any;
}) {
  const { childId } = route.params;
  const { alert } = useAppAlert();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const reducedMotion = useReducedMotion();
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
  // 特別クエスト設定
  const [familySettings, setFamilySettings] = useState<FamilySettings | null>(null);
  // つかうリクエスト状況
  const [recentSpendRequests, setRecentSpendRequests] = useState<SpendRequest[]>([]);
  // バッジ獲得演出
  const [unlockedBadge, setUnlockedBadge] = useState<{ emoji: string; label: string; description: string } | null>(null);

  const loadData = useCallback(async () => {
    const session = await getSession();
    if (!session) return;

    setChildName(session.name);

    const [taskRes, walletRes, txRes, badgeRes, stampRes, spendRes] = await Promise.all([
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
      // つかうリクエスト状況
      supabase
        .from("otetsudai_spend_requests")
        .select("*")
        .eq("child_id", childId)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    setTasks(taskRes.data || []);
    setWallet(walletRes.data);
    setTransactions(txRes.data || []);
    setBadges(badgeRes.data || []);
    setRecentSpendRequests(spendRes.data || []);

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

    // 特別クエスト設定を読み込み
    const { data: settingsData } = await supabase
      .from("otetsudai_family_settings")
      .select("*")
      .eq("family_id", session.familyId)
      .single();
    if (settingsData) setFamilySettings(settingsData);

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

  function confirmAndComplete(task: Task) {
    alert(
      `🎯 『${task.title}』`,
      "クリアする？",
      [
        { text: "やめる", style: "cancel" },
        { text: "クリア！", onPress: () => handleComplete(task) },
      ]
    );
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

    // 成功の触覚フィードバック
    if (!reducedMotion) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

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

    const newBadges = await checkAndAwardBadges(childId);
    if (newBadges.length > 0) {
      const def = BADGE_DEFINITIONS[newBadges[0]];
      if (def) {
        setUnlockedBadge({ emoji: def.emoji, label: def.label, description: def.description });
      }
    }
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
    alert(
      "🔄 データリセット",
      "おさいふ・クエストログ・バッジを ぜんぶ リセットします。もとに もどせません。",
      [
        { text: "やめる", style: "cancel" },
        {
          text: "リセットする",
          style: "destructive",
          onPress: async () => {
            const session = await getSession();
            if (!session) return;

            await supabase
              .from("otetsudai_wallets")
              .update({
                spending_balance: 0,
                saving_balance: 0,
                invest_balance: 0,
              })
              .eq("child_id", childId);

            await supabase
              .from("otetsudai_task_logs")
              .delete()
              .eq("child_id", childId);

            await supabase
              .from("otetsudai_badges")
              .delete()
              .eq("child_id", childId);

            if (wallet) {
              await supabase
                .from("otetsudai_transactions")
                .delete()
                .eq("wallet_id", wallet.id);
            }

            alert("✅ リセットかんりょう", "データを リセットしました");
            await loadData();
          },
        },
      ]
    );
  }

  // ★特別クエスト: 期間内かどうか＋設定を加味した判定
  function isSpecialActive(task: Task): boolean {
    if (!task.is_special) return false;
    // 設定によるフィルタ
    if (familySettings) {
      if (!familySettings.special_quest_enabled) return false;
      if (task.special_difficulty === 1 && !familySettings.special_quest_star1_enabled) return false;
      if (task.special_difficulty === 2 && !familySettings.special_quest_star2_enabled) return false;
      if (task.special_difficulty === 3 && !familySettings.special_quest_star3_enabled) return false;
    }
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
    if (diff === 1) return "あと1日！";
    return `あと${diff}日`;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>⚔️</Text>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={{ color: palette.textMuted, marginTop: 12, fontSize: 14 }}>ぼうけんの じゅんび ちゅう...</Text>
      </View>
    );
  }

  const levelInfo = getLevelProgress(totalEarned);

  return (
    <SafeAreaView style={styles.container} accessibilityLabel="こどもダッシュボード">
      {/* Header */}
      <View style={styles.header} accessibilityRole="header">
        <Text style={styles.headerTitle} numberOfLines={1} accessibilityRole="header">
          🧒 {childName}
        </Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} accessibilityLabel="ログインがめんに もどる" accessibilityRole="button">
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
        <View
          style={[
            styles.levelCard,
            mood === "active" ? styles.levelCardActive :
            mood === "lonely" ? styles.levelCardLonely :
            styles.levelCardNormal,
          ]}
          accessibilityLabel={`レベル${levelInfo.current.level} ${levelInfo.next ? `つぎのレベルまで あと${levelInfo.remaining}えん` : "さいこうレベル たっせい"}`}
          accessibilityRole="summary"
        >
          <View style={styles.characterColumn}>
            <CharacterSvg level={levelInfo.current.level} mood={mood} size={100} />
            <RubyStr text={levelInfo.current.appearance} style={styles.appearanceText} rubySize={6} />
          </View>
          <View style={styles.levelInfo}>
            <View style={{ flexDirection: "row", alignItems: "flex-end", flexWrap: "wrap" }}>
              <Text style={styles.levelTitle}>Lv.{levelInfo.current.level} </Text>
              <RubyStr text={levelInfo.current.title} style={styles.levelTitle} rubySize={6} />
            </View>
            {/* セリフ吹き出し */}
            <View style={styles.speechBubble}>
              <View style={{ flexDirection: "row", alignItems: "flex-end", flexWrap: "wrap" }}>
                <Text style={styles.speechText}>「</Text>
                <RubyStr
                  text={mood === "active"
                    ? levelInfo.current.greetingActive
                    : mood === "lonely"
                      ? levelInfo.current.greetingLonely
                      : levelInfo.current.greeting}
                  style={styles.speechText}
                  rubySize={6}
                />
                <Text style={styles.speechText}>」</Text>
              </View>
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
              <AutoRubyText text={`次のレベルまで あと ${levelInfo.remaining.toLocaleString()}円`} style={styles.levelNext} rubySize={6} />
            ) : (
              <AutoRubyText text="最高レベル 達成！ 🎊" style={[styles.levelNext, { color: palette.accent, fontWeight: "bold" }]} rubySize={6} />
            )}
          </View>
        </View>

        {/* Stamp Notifications */}
        {stampNotifs.length > 0 && (
          <View style={styles.stampCard}>
            <RubyText style={styles.sectionTitle} parts={[["親", "おや"], "からのメッセージ"]} />
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
          <TouchableOpacity
            style={styles.walletCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("WalletDetail", { childId, walletId: wallet.id })}
            accessibilityLabel="おさいふの くわしい じょうほう"
            accessibilityRole="button"
          >
            <RubyText style={styles.walletTitle} parts={["💰 ", ["財布", "さいふ"]]} />
            <Text
              style={styles.walletTotal}
              adjustsFontSizeToFit
              numberOfLines={1}
              accessibilityLabel={`ごうけい ${((wallet.spending_balance ?? 0) + (wallet.saving_balance ?? 0) + (wallet.invest_balance ?? 0)).toLocaleString()}えん`}
            >
              {(
                (wallet.spending_balance ?? 0) +
                (wallet.saving_balance ?? 0) +
                (wallet.invest_balance ?? 0)
              ).toLocaleString()}
              円
            </Text>
            <View style={styles.walletRow}>
              <View style={[styles.walletItem, { borderColor: palette.walletSpend }]}>
                <RubyText style={styles.walletLabel} parts={[["使", "つか"], "う"]} />
                <Text style={[styles.walletAmount, { color: palette.walletSpend }]}>
                  {(wallet.spending_balance ?? 0).toLocaleString()}
                </Text>
              </View>
              <View style={[styles.walletItem, { borderColor: palette.walletSave }]}>
                <RubyText style={styles.walletLabel} parts={[["貯", "た"], "める"]} />
                <Text style={[styles.walletAmount, { color: palette.walletSave }]}>
                  {(wallet.saving_balance ?? 0).toLocaleString()}
                </Text>
              </View>
              <View
                style={[styles.walletItem, { borderColor: palette.walletInvest }]}
              >
                <RubyText style={styles.walletLabel} parts={[["増", "ふ"], "やす"]} />
                <Text style={[styles.walletAmount, { color: palette.walletInvest }]}>
                  {(wallet.invest_balance ?? 0).toLocaleString()}
                </Text>
              </View>
            </View>
            <View style={styles.walletFooter}>
              <AnimatedButton
                style={styles.spendShortcut}
                onPress={() => navigation.navigate("SpendRequest", { childId, walletId: wallet.id, spendingBalance: wallet.spending_balance })}
                haptic="light"
                accessibilityLabel="つかうリクエスト"
              >
                <Text style={styles.spendShortcutText}>💸 つかう</Text>
              </AnimatedButton>
              <Text style={styles.walletHint}>くわしく →</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* つかうリクエスト状況 */}
        {recentSpendRequests.length > 0 && (
          <View style={styles.spendStatusSection}>
            {recentSpendRequests.map((req) => (
              <View
                key={req.id}
                style={[
                  styles.spendStatusCard,
                  req.status === "pending" && { backgroundColor: palette.accentLight },
                  req.status === "approved" && { backgroundColor: palette.greenLight },
                  req.status === "rejected" && { backgroundColor: palette.redLight },
                ]}
              >
                <Text style={styles.spendStatusIcon}>
                  {req.status === "pending" ? "⏳" : req.status === "approved" ? "✅" : "❌"}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.spendStatusText} numberOfLines={1}>
                    {req.purpose} — {req.amount}円
                  </Text>
                  <Text style={styles.spendStatusLabel}>
                    {req.status === "pending"
                      ? "申請中"
                      : req.status === "approved" && req.payment_status === "pending_payment"
                      ? "承認済み お金をまってね"
                      : req.status === "approved" && req.payment_status === "paid"
                      ? "お金 もらったよ！"
                      : "許可されませんでした"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* そうび（バッジ → 装備として表示） */}
        <View style={styles.badgeCard}>
          <RubyText style={styles.sectionTitle} parts={["⚔️ ", ["装備", "そうび"], ` (${badges.length}/5)`]} />
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
          {badges.length === 0 && (
            <AutoRubyText text="クエストをクリアして 装備を集めよう！" style={styles.emptyHint} rubySize={6} />
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow} accessibilityRole="tabbar">
          <TouchableOpacity
            style={[styles.tabButton, tab === "quests" && styles.tabActive]}
            onPress={() => setTab("quests")}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === "quests" }}
            accessibilityLabel="クエストタブ"
          >
            <Text
              style={[
                styles.tabText,
                tab === "quests" && styles.tabTextActive,
              ]}
            >
              ⚔️ クエスト
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, tab === "history" && styles.tabActive]}
            onPress={() => setTab("history")}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === "history" }}
            accessibilityLabel="りれきタブ"
          >
            <RubyText
              style={tab === "history" ? styles.tabTextActive : styles.tabText}
              parts={["📖 ", ["履歴", "りれき"]]}
              rubySize={6}
            />
          </TouchableOpacity>
        </View>

        {/* Quest list */}
        {tab === "quests" && (
          <View style={styles.section}>
            {/* ★特別クエスト — 常時表示 */}
            <RubyText style={styles.specialSectionTitle} parts={["★ ", ["特別", "とくべつ"], "クエスト"]} />
            {tasks.filter((t) => t.is_special && isSpecialActive(t)).length > 0 ? (
              <>
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
                          <AutoRubyText
                            text={getCountdownText(task.end_date)}
                            style={styles.specialCountdown}
                            rubySize={6}
                          />
                        )}
                      </View>
                      <View style={styles.questInfo}>
                        <Text style={styles.questIcon}>
                          {getTaskIcon(task.title)}
                        </Text>
                        <View style={styles.questDetails}>
                          <AutoRubyText text={task.title} style={styles.specialQuestTitle} rubySize={7} />
                          <View style={styles.rewardRow}>
                            <Text style={styles.specialQuestReward}>
                              💰 {task.reward_amount}円
                            </Text>
                            {task.proposal_status === "pending" && (
                              <Text style={styles.pendingBadge}>⏳ リクエスト中</Text>
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
                        <AnimatedButton
                          style={styles.specialClearButton}
                          onPress={() => confirmAndComplete(task)}
                          disabled={submitting === task.id}
                          accessibilityLabel={`とくべつクエスト${task.title}をクリア`}
                        >
                          <Text style={styles.clearButtonText}>
                            {submitting === task.id ? "..." : "★ クリア！"}
                          </Text>
                        </AnimatedButton>
                      </View>
                    </View>
                  ))}
              </>
            ) : (
              <View style={styles.emptySpecialCard}>
                <Text style={styles.emptySpecialIcon}>🌟</Text>
                <Text style={[styles.emptyHint, { fontWeight: "bold", fontSize: 13 }]}>いまは おやすみちゅう</Text>
                <Text style={styles.emptyHint}>つぎの とくべつクエストを おたのしみに！</Text>
              </View>
            )}

            {/* 通常クエスト */}
            {tasks.filter((t) => !t.is_special).length > 0 && (
              <>
                {tasks.filter((t) => t.is_special && isSpecialActive(t)).length > 0 && (
                  <AutoRubyText text="クエスト" style={[styles.sectionTitle, { marginTop: 16 }]} rubySize={7} />
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
                          <AutoRubyText text={task.title} style={styles.questTitle} rubySize={7} />
                          <View style={styles.rewardRow}>
                            <Text style={styles.questReward}>
                              💰 {task.reward_amount}円
                            </Text>
                            {task.proposal_status === "pending" && (
                              <Text style={styles.pendingBadge}>⏳ リクエスト中</Text>
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
                        <AnimatedButton
                          style={styles.clearButton}
                          onPress={() => confirmAndComplete(task)}
                          disabled={submitting === task.id}
                          accessibilityLabel={`${task.title}をクリア`}
                        >
                          <Text style={styles.clearButtonText}>
                            {submitting === task.id ? "..." : "クリア！"}
                          </Text>
                        </AnimatedButton>
                        {task.proposal_status !== "pending" && (
                          <AnimatedButton
                            style={styles.priceUpButton}
                            onPress={() => setPriceRequestTask(task)}
                            accessibilityLabel={`${task.title}のねあげリクエスト`}
                          >
                            <Text style={styles.priceUpText}>💰↑</Text>
                          </AnimatedButton>
                        )}
                      </View>
                    </View>
                  ))}
              </>
            )}

            {tasks.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 48, marginBottom: 8 }}>🗺️</Text>
                <AutoRubyText text="クエストが まだないよ" style={[styles.emptyText, { paddingVertical: 0, fontWeight: "bold" }]} rubySize={7} />
                <AutoRubyText text="親に たのんで クエストを つくってもらおう！" style={[styles.emptyText, { paddingVertical: 4, fontSize: 12 }]} rubySize={6} />
              </View>
            )}
          </View>
        )}

        {/* History */}
        {tab === "history" && (
          <View style={styles.section}>
            {/* 返信済みメッセージ履歴 */}
            {repliedMessages.length > 0 && (
              <View style={styles.repliedSection}>
                <RubyText style={styles.repliedTitle} parts={["💬 ", ["親", "おや"], "との やりとり"]} />
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
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 48, marginBottom: 8 }}>📖</Text>
                <AutoRubyText text="まだ履歴がないよ" style={[styles.emptyText, { paddingVertical: 0, fontWeight: "bold" }]} rubySize={6} />
                <AutoRubyText text="クエストをクリアすると ここに きろくされるよ！" style={[styles.emptyText, { paddingVertical: 4, fontSize: 12 }]} rubySize={6} />
              </View>
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
                          tx.type === "earn" ? palette.primary : palette.walletSpend,
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
        {__DEV__ && (
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetText}>🔄 データリセット（テスト用）</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* クエストクリア時のキャラ反応（フローティング） */}
      {questClearMsg && (
        <View style={styles.questClearBanner}>
          <CharacterSvg level={levelInfo.current.level} mood="active" size={48} />
          <Text style={styles.questClearText}>{questClearMsg}</Text>
        </View>
      )}

      {/* 子ども返信モーダル */}
      {unreadLogs.length > 0 && (
        <ChildReactionModal
          logs={unreadLogs}
          onAllDone={() => {
            setUnreadLogs([]);
            loadData();
          }}
          onSkip={() => setUnreadLogs([])}
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

      {/* バッジ獲得演出モーダル */}
      {unlockedBadge && (
        <BadgeUnlockModal
          visible={!!unlockedBadge}
          emoji={unlockedBadge.emoji}
          label={unlockedBadge.label}
          description={unlockedBadge.description}
          onClose={() => setUnlockedBadge(null)}
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
  headerTitle: {
    fontSize: rf(18),
    fontWeight: "bold",
    color: p.primaryDark,
    flex: 1,
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: p.surfaceMuted,
    minHeight: 44,
    justifyContent: "center" as const,
  },
  logoutText: { fontSize: 14, color: p.textMuted },
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
    shadowColor: p.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  levelCardActive: {
    backgroundColor: p.primaryLight,
    borderColor: p.borderStrong,
  },
  levelCardNormal: {
    backgroundColor: p.accentLight,
    borderColor: p.goldBorder,
  },
  levelCardLonely: {
    backgroundColor: p.walletSaveBg,
    borderColor: p.walletSaveBorder,
  },
  characterColumn: {
    alignItems: "center" as const,
    marginRight: 8,
    width: 90,
  },
  appearanceText: {
    fontSize: 9,
    color: p.textMuted,
    marginTop: 2,
    textAlign: "center" as const,
    lineHeight: 14,
  },
  levelInfo: { flex: 1, overflow: "hidden" as const },
  levelTitle: { fontSize: rf(14), fontWeight: "bold" as const, color: p.textStrong },
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
    color: p.textStrong,
    lineHeight: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: p.surfaceMuted,
    borderRadius: 4,
    overflow: "hidden" as const,
  },
  progressFill: {
    height: 8,
    backgroundColor: p.primary,
    borderRadius: 4,
  },
  levelNext: { fontSize: 11, color: p.textMuted, marginTop: 4, lineHeight: 18 },

  // Wallet
  walletCard: {
    backgroundColor: p.white,
    margin: 12,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: p.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  walletTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: p.textMuted,
    marginBottom: 4,
  },
  walletTotal: {
    fontSize: rf(28),
    fontWeight: "bold",
    color: p.textStrong,
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
  walletLabel: { fontSize: 12, color: p.textMuted, marginBottom: 2, lineHeight: 20 },
  walletAmount: { fontSize: 16, fontWeight: "bold" },
  walletFooter: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginTop: 10,
  },
  spendShortcut: {
    backgroundColor: p.walletSpend,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    minHeight: 36,
    justifyContent: "center" as const,
  },
  spendShortcutText: {
    color: p.white,
    fontSize: 13,
    fontWeight: "bold" as const,
  },
  walletHint: {
    fontSize: 12,
    color: p.textMuted,
  },

  // Spend request status
  spendStatusSection: {
    marginHorizontal: 12,
    marginBottom: 8,
    gap: 6,
  },
  spendStatusCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  spendStatusIcon: { fontSize: 18 },
  spendStatusText: {
    fontSize: 13,
    fontWeight: "bold",
    color: p.textStrong,
  },
  spendStatusLabel: {
    fontSize: 11,
    color: p.textMuted,
    marginTop: 1,
  },

  // Badges
  // Stamp notifications
  stampCard: {
    backgroundColor: p.accentLight,
    margin: 12,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: p.accent,
  },
  stampNotif: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: p.white,
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  stampNotifEmoji: { fontSize: 32, marginRight: 10 },
  stampNotifTask: { fontSize: 13, color: p.textMuted },
  stampNotifLabel: { fontSize: 15, fontWeight: "bold", color: p.textStrong },
  stampNotifMsg: { fontSize: 13, color: p.primaryDark, marginTop: 2 },

  badgeCard: {
    backgroundColor: p.white,
    margin: 12,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: p.textStrong,
    marginBottom: 8,
  },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badgeEmoji: { fontSize: 24 },
  badgeLabel: { fontSize: 9, color: p.textMuted, textAlign: "center" as const },
  equipItem: { alignItems: "center" as const, width: 60 },
  equipIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: p.goldLight,
    borderWidth: 2,
    borderColor: p.accent,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 4,
  },
  equipIconEmpty: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: p.surfaceMuted,
    borderWidth: 2,
    borderColor: p.border,
    borderStyle: "dashed" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 4,
  },
  equipEmptyText: {
    fontSize: 18,
    color: p.textMuted,
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    margin: 12,
    marginBottom: 0,
    backgroundColor: p.surfaceMuted,
    borderRadius: 10,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  tabActive: { backgroundColor: p.white },
  tabText: { fontSize: 14, color: p.textMuted },
  tabTextActive: { color: p.textStrong, fontWeight: "bold" },

  // Quests
  section: { margin: 12, marginBottom: 0 },
  // ★特別クエスト
  specialSectionTitle: {
    fontSize: 17,
    fontWeight: "bold" as const,
    color: p.gold,
    marginBottom: 8,
  },
  specialQuestCard: {
    backgroundColor: p.goldLight,
    borderWidth: 2,
    borderColor: p.goldBorder,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: p.gold,
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
    color: p.gold,
    letterSpacing: 2,
  },
  specialCountdown: {
    fontSize: 12,
    fontWeight: "bold" as const,
    color: p.red,
    backgroundColor: p.redLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden" as const,
  },
  specialQuestTitle: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: p.textStrong,
    lineHeight: 26,
  },
  specialQuestReward: {
    fontSize: 14,
    fontWeight: "bold" as const,
    color: p.gold,
  },
  specialQuestDesc: {
    fontSize: 12,
    color: p.textMuted,
    marginTop: 2,
  },
  specialClearButton: {
    backgroundColor: p.gold,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: "center" as const,
  },
  questCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: p.white,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  questInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  questIcon: { fontSize: 28, marginRight: 10 },
  questDetails: { flex: 1 },
  questTitle: { fontSize: 15, fontWeight: "600", color: p.textStrong, lineHeight: 24 },
  rewardRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginTop: 2,
  },
  questReward: { fontSize: 13, color: p.accent },
  pendingBadge: {
    fontSize: 10,
    color: p.textMuted,
    backgroundColor: p.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  priceComment: {
    fontSize: 11,
    color: p.primaryDark,
    marginTop: 2,
  },
  questActions: {
    alignItems: "center" as const,
    gap: 4,
    marginLeft: 8,
  },
  clearButton: {
    backgroundColor: p.accent,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: "center" as const,
  },
  clearButtonText: { color: p.white, fontWeight: "bold" as const, fontSize: 15 },
  priceUpButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: p.primaryLight,
    borderWidth: 1,
    borderColor: p.primary,
    minHeight: 40,
    justifyContent: "center" as const,
  },
  priceUpText: { fontSize: 14 },

  // History
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: p.white,
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  historyType: { fontSize: 22, marginRight: 10 },
  historyInfo: { flex: 1 },
  historyDesc: { fontSize: 14, color: p.textStrong },
  historyDate: { fontSize: 11, color: p.textMuted, marginTop: 2 },
  historyAmount: { fontSize: 16, fontWeight: "bold" },

  emptyText: {
    textAlign: "center",
    color: p.textMuted,
    fontSize: 14,
    paddingVertical: 24,
  },
  emptyCard: {
    alignItems: "center" as const,
    backgroundColor: p.white,
    borderRadius: 12,
    padding: 24,
    marginBottom: 8,
  },
  emptyHint: {
    textAlign: "center",
    color: p.textMuted,
    fontSize: 12,
    marginTop: 8,
  },
  emptySpecialCard: {
    backgroundColor: p.accentLight,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: p.goldBorder,
    marginBottom: 12,
  },
  emptySpecialIcon: {
    fontSize: 32,
    marginBottom: 4,
  },

  // 返信済みメッセージ履歴
  repliedSection: {
    marginBottom: 16,
  },
  repliedTitle: {
    fontSize: 15,
    fontWeight: "bold" as const,
    color: p.textStrong,
    marginBottom: 8,
  },
  repliedCard: {
    backgroundColor: p.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: p.primary,
  },
  repliedTaskName: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: p.textStrong,
    marginBottom: 4,
  },
  repliedParent: {
    fontSize: 12,
    color: p.textMuted,
    marginBottom: 2,
  },
  repliedChild: {
    fontSize: 12,
    color: p.primaryDark,
  },

  // クエストクリア反応バナー
  questClearBanner: {
    position: "absolute" as const,
    bottom: 40,
    left: 16,
    right: 16,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: p.primaryDark,
    borderRadius: 16,
    padding: 12,
    gap: 10,
    shadowColor: p.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  questClearText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "bold" as const,
    color: p.white,
  },

  // リセットボタン
  resetButton: {
    margin: 12,
    marginTop: 24,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: p.border,
    borderStyle: "dashed" as const,
    alignItems: "center" as const,
  },
  resetText: {
    fontSize: 12,
    color: p.textMuted,
  },
  });
}
