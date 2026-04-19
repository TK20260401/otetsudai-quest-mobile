import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
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
import type { Task, Wallet, Transaction, Badge, FamilySettings, SpendRequest, User, FamilyMessage, FamilyChallenge, Pet } from "../lib/types";
import { getActivePet, processQuestCompletionForPets, hatchEgg, type PetType, type PetQuestResult } from "../lib/pets";
import PetDisplay from "../components/PetDisplay";
import PetManagementModal from "../components/PetManagementModal";
import TrophyCaseModal from "../components/TrophyCaseModal";
import DailyLoginModal from "../components/DailyLoginModal";
import { getDailyLoginStatus } from "../lib/daily-login";
import ShopModal from "../components/ShopModal";
import CoinKunChat from "../components/CoinKunChat";
import { getEquippedTitle, RARITY_COLORS, type ShopItem } from "../lib/shop";
import EggDropAnimation from "../components/EggDropAnimation";
import GameStatusHeader from "../components/GameStatusHeader";
import RpgCard from "../components/RpgCard";
import RpgButton from "../components/RpgButton";
import CharacterSvg from "../components/CharacterSvg";
import { RubyText, RubyStr, AutoRubyText } from "../components/Ruby";
import LevelUpModal from "../components/LevelUpModal";
import PriceRequestModal from "../components/PriceRequestModal";
import ChildReactionModal from "../components/ChildReactionModal";
import FamilyStampSendModal from "../components/FamilyStampSendModal";
import FamilyMessageCard from "../components/FamilyMessageCard";
import FamilyChallengeCard from "../components/FamilyChallengeCard";
import { getChildStampById } from "../lib/child-stamps";
import { useAppAlert } from "../components/AppAlert";
import AnimatedButton from "../components/AnimatedButton";
import BadgeUnlockModal from "../components/BadgeUnlockModal";
import SkillTree from "../components/SkillTree";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useReducedMotion } from "../lib/useReducedMotion";
import { PixelSwordIcon, PixelScrollIcon, PixelChestOpenIcon, PixelShieldIcon, PixelStarIcon, PixelCrossedSwordsIcon, PixelPotionIcon, PixelFlameIcon, PixelLetterIcon, PixelCoinIcon, PixelCartIcon, PixelPiggyIcon, PixelChartIcon, PixelDoorIcon, PixelBarChartIcon, PixelHourglassIcon, PixelCheckIcon, PixelCrossIcon, PixelMapIcon, PixelLightbulbIcon, PixelBookIcon, PixelTargetIcon, PixelChatIcon, PixelRefreshIcon, PixelConfettiIcon, PixelShopIcon, PixelPencilIcon } from "../components/PixelIcons";
import StampSvg from "../components/StampSvg";
import QuestCardFrame from "../components/QuestCardFrame";
import TaskIconSvg from "../components/TaskIconSvg";
import RpgStatusBar from "../components/RpgStatusBar";
import EquipmentView from "../components/EquipmentView";
import { getQuestCardTier, calculateRpgStats } from "../lib/rpg-stats";
import RewardSequence from "../components/RewardSequence";

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
  const [weeklySummary, setWeeklySummary] = useState({ quests: 0, earned: 0, streak: 0 });
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
  const [showRewardSequence, setShowRewardSequence] = useState(false);
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
  // じぶんクエスト提案
  const [proposalVisible, setProposalVisible] = useState(false);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalReason, setProposalReason] = useState("");
  const [proposalReward, setProposalReward] = useState("");
  const [proposalSubmitting, setProposalSubmitting] = useState(false);
  // ファミリースタンプリレー
  const [familyMessages, setFamilyMessages] = useState<FamilyMessage[]>([]);
  const [familyMembers, setFamilyMembers] = useState<User[]>([]);
  // ペット
  const [activePet, setActivePet] = useState<Pet | null>(null);
  const [petManageVisible, setPetManageVisible] = useState(false);
  const [trophyVisible, setTrophyVisible] = useState(false);
  const [dailyLoginVisible, setDailyLoginVisible] = useState(false);
  const [dailyLoginChecked, setDailyLoginChecked] = useState(false);
  const [shopVisible, setShopVisible] = useState(false);
  const [equippedTitle, setEquippedTitle] = useState<ShopItem | null>(null);
  const [eggDrop, setEggDrop] = useState<PetType | null>(null);
  const [stampSendVisible, setStampSendVisible] = useState(false);
  const [sessionFamilyId, setSessionFamilyId] = useState<string | null>(null);
  // 家族チャレンジ
  const [activeChallenge, setActiveChallenge] = useState<FamilyChallenge | null>(null);
  // 提案中のクエスト数
  const pendingProposals = useMemo(() => tasks.filter((t) => t.created_by === childId && t.proposal_status === "pending").length, [tasks, childId]);

  const handleProposalSubmit = useCallback(async () => {
    if (!proposalTitle.trim()) return;
    setProposalSubmitting(true);
    try {
      const session = await getSession();
      if (!session) return;
      await supabase.from("otetsudai_tasks").insert({
        family_id: session.familyId,
        title: proposalTitle.trim(),
        description: proposalReason.trim() || null,
        reward_amount: 0,
        proposed_reward: proposalReward ? parseInt(proposalReward, 10) : null,
        proposal_status: "pending",
        proposal_message: proposalReason.trim() || null,
        recurrence: "once",
        assigned_child_id: childId,
        is_active: false,
        created_by: childId,
        is_special: false,
      });
      setProposalVisible(false);
      setProposalTitle("");
      setProposalReason("");
      setProposalReward("");
      alert("送信しました！", "親がクエストを確認するよ！");
      loadData();
    } catch {
      alert("エラー", "送信に失敗しました");
    }
    setProposalSubmitting(false);
  }, [proposalTitle, proposalReason, proposalReward, childId]);

  const loadData = useCallback(async () => {
    const session = await getSession();
    if (!session) return;

    setChildName(session.name);
    setSessionFamilyId(session.familyId);

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

    // 週次サマリー：今週のクエスト完了数・稼いだ金額
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const { data: weeklyLogs } = await supabase
      .from("otetsudai_task_logs")
      .select("*, task:otetsudai_tasks(reward_amount)")
      .eq("child_id", childId)
      .eq("status", "approved")
      .gte("approved_at", weekStart.toISOString());
    const weeklyQuests = weeklyLogs?.length || 0;
    const weeklyEarned = (weeklyLogs || []).reduce(
      (sum: number, log: any) => sum + (log.task?.reward_amount || 0), 0
    );
    // ストリーク計算（連続でクエストを完了した日数）
    const { data: streakLogs } = await supabase
      .from("otetsudai_task_logs")
      .select("approved_at")
      .eq("child_id", childId)
      .eq("status", "approved")
      .not("approved_at", "is", null)
      .order("approved_at", { ascending: false })
      .limit(90);
    let streak = 0;
    if (streakLogs && streakLogs.length > 0) {
      const days = new Set(
        streakLogs.map((l: any) => new Date(l.approved_at).toDateString())
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      // 今日か昨日から遡る
      let check = new Date(today);
      if (!days.has(check.toDateString())) {
        check.setDate(check.getDate() - 1);
      }
      while (days.has(check.toDateString())) {
        streak++;
        check.setDate(check.getDate() - 1);
      }
    }
    setWeeklySummary({ quests: weeklyQuests, earned: weeklyEarned, streak });

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

    // ファミリースタンプリレー: メンバー一覧 + メッセージ取得
    const [membersRes, fmsgRes] = await Promise.all([
      supabase
        .from("otetsudai_users")
        .select("*")
        .eq("family_id", session.familyId)
        .neq("role", "admin"),
      supabase
        .from("otetsudai_family_messages")
        .select("*, sender:otetsudai_users!sender_id(*), recipient:otetsudai_users!recipient_id(*)")
        .eq("family_id", session.familyId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setFamilyMembers(membersRes.data || []);
    setFamilyMessages(fmsgRes.data || []);

    // アクティブな家族チャレンジ
    const today = new Date().toISOString().slice(0, 10);
    const { data: challengeData } = await supabase
      .from("otetsudai_family_challenges")
      .select("*")
      .eq("family_id", session.familyId)
      .lte("start_date", today)
      .gte("end_date", today)
      .order("created_at", { ascending: false })
      .limit(1);
    setActiveChallenge(challengeData?.[0] || null);

    // アクティブペット
    const pet = await getActivePet(childId);
    setActivePet(pet);

    // 装備中タイトル読み込み
    const title = await getEquippedTitle(childId);
    setEquippedTitle(title);

    setLoading(false);
  }, [childId]);

  // 画面フォーカス時にデータ再読み込み（SpendRequest等から戻った時も更新）
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // 初回のみデイリーログインチェック（wallet取得後）
  useEffect(() => {
    if (dailyLoginChecked) return;
    if (!wallet) return;
    setDailyLoginChecked(true);
    getDailyLoginStatus(childId).then((s) => {
      if (s.canClaimToday) setDailyLoginVisible(true);
    });
  }, [wallet, childId, dailyLoginChecked]);

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
      "すごい！承認を 待ってね！",
      "かっこいい！次も 頑張ろう！",
      "ナイスクリア！きみは 強くなってる！",
      "さすが冒険者！✨",
      "完了！コインが もらえるかも！🪙",
      "その調子！レベルアップが 近いよ！",
      "よくできた！最高だよ！🌟",
    ];
    const msg = clearMessages[Math.floor(Math.random() * clearMessages.length)];
    setQuestClearMsg(msg);
    setTimeout(() => setQuestClearMsg(null), 3000);
    setShowRewardSequence(true);

    const newBadges = await checkAndAwardBadges(childId);
    if (newBadges.length > 0) {
      const def = BADGE_DEFINITIONS[newBadges[0]];
      if (def) {
        setUnlockedBadge({ emoji: def.emoji, label: def.label, description: def.description });
      }
    }

    // ペット処理（卵の孵化進行・餌やり・卵ドロップ）
    const session = await getSession();
    if (session?.familyId) {
      const result: PetQuestResult = await processQuestCompletionForPets(childId, session.familyId);
      if (result.eggDropped) setEggDrop(result.eggDropped);
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
    if (diff <= 0) return "今日まで！";
    if (diff === 1) return "あと1日！";
    return `あと${diff}日`;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <PixelCrossedSwordsIcon size={40} />
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.loadingText}>ぼうけんの じゅんび ちゅう...</Text>
      </View>
    );
  }

  const levelInfo = getLevelProgress(totalEarned);

  return (
    <SafeAreaView style={styles.container} accessibilityLabel="こどもダッシュボード">
      <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
        <GameStatusHeader
          title={childName}
          userName=""
          level={levelInfo.current.level}
          hp={Math.round((weeklySummary.streak / 7) * 100)}
          mp={Math.min(10, weeklySummary.streak)}
          exp={levelInfo.progress}
          gold={totalEarned}
          onBack={handleLogout}
          onLogout={handleLogout}
        />
      </View>
      <Text style={styles.headerDate}>{new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "long" })}</Text>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* キャラクター育成 */}
        <RpgCard
          tier="violet"
          style={{ marginHorizontal: 12, marginTop: 12 }}
          contentStyle={{ flexDirection: "row", alignItems: "flex-start" }}
        >
          <View style={styles.characterColumn}>
            <CharacterSvg level={levelInfo.current.level} mood={mood} size={100} />
            {equippedTitle && (
              <View
                style={[
                  styles.titleBadge,
                  {
                    borderColor: RARITY_COLORS[equippedTitle.rarity].border,
                    backgroundColor: RARITY_COLORS[equippedTitle.rarity].bg,
                  },
                ]}
              >
                <Text style={[styles.titleBadgeText, { color: RARITY_COLORS[equippedTitle.rarity].text }]}>
                  {equippedTitle.emoji} {equippedTitle.label}
                </Text>
              </View>
            )}
            <RubyStr text={levelInfo.current.appearance} style={styles.appearanceText} rubySize={6} />
            <PetDisplay
              pet={activePet}
              onTapEgg={async () => {
                if (activePet) {
                  await hatchEgg(activePet.id);
                  loadData();
                }
              }}
              onManage={() => setPetManageVisible(true)}
            />
            <TouchableOpacity onPress={() => setShopVisible(true)} style={styles.shopBtn}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <PixelShopIcon size={14} />
                <Text style={styles.shopBtnText}>ショップ</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.levelInfo}>
            <View style={styles.rowWrap}>
              <Text style={styles.levelTitle}>Lv.{levelInfo.current.level} </Text>
              <RubyStr text={levelInfo.current.title} style={styles.levelTitle} rubySize={6} />
            </View>
            {/* セリフ吹き出し */}
            <View style={styles.speechBubble}>
              <RubyStr
                text={`「${mood === "active"
                  ? levelInfo.current.greetingActive
                  : mood === "lonely"
                    ? levelInfo.current.greetingLonely
                    : levelInfo.current.greeting}」`}
                style={styles.speechText}
                rubySize={6}
              />
            </View>
            {/* RPGステータスゲージ */}
            <RpgStatusBar
              hp={Math.round((weeklySummary.streak / 7) * 100)}
              mp={Math.min(weeklySummary.streak, 10)}
              exp={levelInfo.progress}
            />
            {/* 装備ステータス */}
            <EquipmentView
              stats={calculateRpgStats({
                level: levelInfo.current.level,
                totalQuests: weeklySummary.quests,
                badgeCount: badges.length,
                streakDays: weeklySummary.streak,
                daysActiveInLast7: Math.min(weeklySummary.streak, 7),
                savingStreakWeeks: Math.min(weeklySummary.streak, 10),
                expProgress: levelInfo.progress,
              })}
              appearance={levelInfo.current.appearance.replace(/\[([^\]|]+)\|[^\]]+\]/g, "$1")}
            />
            {levelInfo.next ? (
              <View style={{ marginTop: 4 }}>
                <AutoRubyText text="次のレベルまで" style={styles.levelNext} rubySize={5} />
                <AutoRubyText text={`あと ${levelInfo.remaining.toLocaleString()}円`} style={styles.levelNext} rubySize={5} />
              </View>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}><AutoRubyText text="最高レベル 達成！" style={[styles.levelNext, { color: palette.accent, fontWeight: "bold" }]} rubySize={6} /><PixelConfettiIcon size={16} /></View>
            )}
          </View>
        </RpgCard>

        {/* Stamp Notifications */}
        {stampNotifs.length > 0 && (
          <RpgCard tier="gold" style={{ marginHorizontal: 12, marginTop: 12 }}>
            <RubyText style={styles.sectionTitle} parts={[["親", "おや"], "からのメッセージ"]} />
            {stampNotifs.map((s) => {
              const stampDef = s.stamp ? getStampById(s.stamp) : null;
              return (
                <View key={s.id} style={styles.stampNotif}>
                  {stampDef && (
                    <View style={styles.stampNotifSvgWrap}>
                      <StampSvg id={stampDef.id} size={32} />
                    </View>
                  )}
                  <View style={styles.flex1}>
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
          </RpgCard>
        )}

        {/* 週次サマリー */}
        {weeklySummary.quests > 0 && (
          <RpgCard tier="silver" style={{ marginHorizontal: 12, marginTop: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelBarChartIcon size={18} /><AutoRubyText text="今週の記録" style={[styles.sectionTitle, { marginBottom: 8 }]} rubySize={6} /></View>
            <View style={styles.rowAround}>
              <View style={styles.colCenter}>
                <Text style={styles.weeklyStatValue}>
                  {weeklySummary.quests}
                </Text>
                <AutoRubyText text="クエスト" style={styles.weeklyStatLabel} rubySize={5} />
              </View>
              <View style={styles.colCenter}>
                <Text style={styles.weeklyStatValue}>
                  ¥{weeklySummary.earned.toLocaleString()}
                </Text>
                <AutoRubyText text="稼いだ" style={styles.weeklyStatLabel} rubySize={5} />
              </View>
              {weeklySummary.streak > 0 && (
                <View style={styles.colCenter}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                    <PixelFlameIcon size={16} />
                    <Text style={styles.weeklyStatValue}>{weeklySummary.streak}</Text>
                  </View>
                  <AutoRubyText text="連続日" style={styles.weeklyStatLabel} rubySize={5} />
                </View>
              )}
            </View>
          </RpgCard>
        )}

        {/* 家族チャレンジ */}
        {activeChallenge && (
          <FamilyChallengeCard
            challenge={activeChallenge}
            children={familyMembers.filter((m) => m.role === "child")}
          />
        )}

        {/* ファミリースタンプリレー */}
        <View>
          <FamilyMessageCard messages={familyMessages} currentUserId={childId} />
          <AnimatedButton
            onPress={() => setStampSendVisible(true)}
            style={styles.stampRelayBtn}
            accessibilityLabel="かぞくに エールを おくる"
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelLetterIcon size={16} /><Text style={styles.stampRelayBtnText}>エールを おくる</Text></View>
          </AnimatedButton>
        </View>

        {/* Wallet */}
        {wallet && (
          <RpgCard tier="gold" style={{ marginHorizontal: 12, marginTop: 12 }}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate("WalletDetail", { childId, walletId: wallet.id })}
            accessibilityLabel="おさいふの くわしい じょうほう"
            accessibilityRole="button"
          >
            <View style={styles.walletTitleRow}>
              <PixelChestOpenIcon size={24} />
              <RubyText style={styles.walletTitle} parts={[["財布", "さいふ"]]} />
            </View>
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
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelCartIcon size={14} /><Text style={styles.spendShortcutText}>つかう</Text></View>
              </AnimatedButton>
              <AnimatedButton
                style={styles.investShortcut}
                onPress={() => navigation.navigate("Invest", { childId, walletId: wallet.id, investBalance: wallet.invest_balance })}
                haptic="light"
                accessibilityLabel="とうしがめん"
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelChartIcon size={14} /><Text style={styles.investShortcutText}>ふやす</Text></View>
              </AnimatedButton>
            </View>
          </TouchableOpacity>
          </RpgCard>
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
                <View style={styles.spendStatusIcon}>
                  {req.status === "pending" ? <PixelHourglassIcon size={18} /> : req.status === "approved" ? <PixelCheckIcon size={18} /> : <PixelCrossIcon size={18} />}
                </View>
                <View style={styles.flex1}>
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
        <TouchableOpacity activeOpacity={0.85} onPress={() => setTrophyVisible(true)}>
          <RpgCard tier="bronze" style={{ marginHorizontal: 12, marginTop: 12 }}>
            <View style={styles.sectionTitleRow}>
              <PixelShieldIcon size={22} />
              <RubyText style={styles.sectionTitle} parts={[["冒険", "ぼうけん"], "スキルツリー ", `(${badges.length}/5)`]} />
            </View>
            <SkillTree badges={badges} palette={palette} />
            {badges.length === 0 && (
              <AutoRubyText text="クエストをクリアしてスキルを解放しよう！" style={styles.emptyHint} rubySize={6} />
            )}
            <Text style={styles.trophyHint}>タップで トロフィーケースを ひらく</Text>
          </RpgCard>
        </TouchableOpacity>

        {/* 画面タイトル — 子供名＋現在画面を明示 */}
        <View style={styles.screenTitleBar} accessibilityRole="header">
          <View style={styles.screenTitleAccent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.screenTitleText} numberOfLines={1}>
              {childName}
              {tab === "quests" ? " のクエスト" : " のりれき"}
            </Text>
            <Text style={styles.screenTitleSub} numberOfLines={1}>
              {tab === "quests"
                ? "いまやるクエストをえらぼう"
                : "これまでクリアしたクエスト"}
            </Text>
          </View>
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
              クエスト
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
              parts={[["履歴", "りれき"]]}
              rubySize={6}
            />
          </TouchableOpacity>
        </View>

        {/* Quest list */}
        {tab === "quests" && (
          <View style={styles.section}>
            {/* ★特別クエスト — 常時表示 */}
            <View style={styles.sectionTitleRow}>
              <PixelStarIcon size={22} />
              <RubyText style={styles.specialSectionTitle} parts={[["特別", "とくべつ"], "クエスト"]} />
            </View>
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
                        <View style={styles.questIcon}>
                          <TaskIconSvg title={task.title} size={28} />
                        </View>
                        <View style={styles.questDetails}>
                          <AutoRubyText text={task.title} style={styles.specialQuestTitle} rubySize={7} />
                          <View style={styles.rewardRow}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                              <PixelCoinIcon size={14} />
                              <AutoRubyText
                                text={`${task.reward_amount}円`}
                                style={styles.specialQuestReward}
                                rubySize={6}
                              />
                            </View>
                            {task.proposal_status === "pending" && (
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                                <PixelHourglassIcon size={11} />
                                <AutoRubyText text="リクエスト中" style={styles.pendingBadge} rubySize={5} />
                              </View>
                            )}
                          </View>
                          {task.description && (
                            <AutoRubyText
                              text={task.description}
                              style={styles.specialQuestDesc}
                              rubySize={6}
                            />
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
                <PixelStarIcon size={32} />
                <AutoRubyText text="今はお休み中" style={[styles.emptyHint, { fontWeight: "bold", fontSize: 13 }]} rubySize={4} />
                <AutoRubyText text="次の特別クエストをお楽しみに！" style={styles.emptyHint} rubySize={4} />
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
                    <QuestCardFrame key={task.id} tier={getQuestCardTier(task)}>
                      <View style={styles.questInfo}>
                        <View style={styles.questIcon}>
                          <TaskIconSvg title={task.title} size={28} />
                        </View>
                        <View style={styles.questDetails}>
                          <AutoRubyText text={task.title} style={styles.questTitle} rubySize={7} />
                          <View style={styles.rewardRow}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                              <PixelCoinIcon size={14} />
                              <AutoRubyText
                                text={`${task.reward_amount}円`}
                                style={styles.questReward}
                                rubySize={6}
                              />
                            </View>
                            {task.proposal_status === "pending" && (
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                                <PixelHourglassIcon size={11} />
                                <AutoRubyText text="リクエスト中" style={styles.pendingBadge} rubySize={5} />
                              </View>
                            )}
                          </View>
                          {task.price_change_comment && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                              <PixelPencilIcon size={11} />
                              <AutoRubyText
                                text={`「${task.price_change_comment}」`}
                                style={styles.priceComment}
                                rubySize={5}
                              />
                            </View>
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
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 1 }}>
                              <PixelCoinIcon size={12} />
                              <Text style={styles.priceUpText}>↑</Text>
                            </View>
                          </AnimatedButton>
                        )}
                      </View>
                    </QuestCardFrame>
                  ))}
              </>
            )}

            {tasks.length === 0 && (
              <View style={styles.emptyCard}>
                <PixelMapIcon size={40} />
                <AutoRubyText text="クエストが まだないよ" style={[styles.emptyText, { paddingVertical: 0, fontWeight: "bold" }]} rubySize={7} />
                <AutoRubyText text="親に たのんで クエストを つくってもらおう！" style={[styles.emptyText, { paddingVertical: 4, fontSize: 12 }]} rubySize={6} />
              </View>
            )}

            {/* じぶんクエスト提案 */}
            <AnimatedButton
              style={styles.proposalButton}
              onPress={() => setProposalVisible(true)}
              accessibilityLabel="じぶんクエストを提案する"
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelLightbulbIcon size={18} /><Text style={styles.proposalButtonText}>じぶんクエストを提案する</Text></View>
              {pendingProposals > 0 && (
                <Text style={styles.proposalPending}>（{pendingProposals}件 返事待ち）</Text>
              )}
            </AnimatedButton>
          </View>
        )}

        {/* History */}
        {tab === "history" && (
          <View style={styles.section}>
            {/* 返信済みメッセージ履歴 */}
            {repliedMessages.length > 0 && (
              <View style={styles.repliedSection}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelChatIcon size={18} /><RubyText style={styles.repliedTitle} parts={[["親", "おや"], "との やりとり"]} /></View>
                {repliedMessages.map((log: any) => {
                  const cStamp = log.child_reaction_stamp
                    ? getChildStampById(log.child_reaction_stamp)
                    : null;
                  const pStamp = log.approval_stamp
                    ? getStampById(log.approval_stamp)
                    : null;
                  return (
                    <View key={log.id} style={styles.repliedCard}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelTargetIcon size={14} /><Text style={styles.repliedTaskName}>{log.task?.title}</Text></View>
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
                <PixelBookIcon size={40} />
                <AutoRubyText text="まだ履歴がないよ" style={[styles.emptyText, { paddingVertical: 0, fontWeight: "bold" }]} rubySize={6} />
                <AutoRubyText text="クエストをクリアすると ここに きろくされるよ！" style={[styles.emptyText, { paddingVertical: 4, fontSize: 12 }]} rubySize={6} />
              </View>
            ) : transactions.length === 0 ? null : (
              transactions.map((tx) => (
                <View key={tx.id} style={styles.historyItem}>
                  <View style={styles.historyType}>
                    {tx.type === "earn" ? <PixelCoinIcon size={20} /> : tx.type === "spend" ? <PixelCartIcon size={20} /> : tx.type === "save" ? <PixelPiggyIcon size={20} /> : <PixelChartIcon size={20} />}
                  </View>
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
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelRefreshIcon size={14} /><Text style={styles.resetText}>データリセット（テスト用）</Text></View>
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* クエストクリア時のキャラ反応（RPGフローティングバナー） */}
      {questClearMsg && (
        <View style={styles.questClearBanner}>
          <View style={styles.questClearInner}>
            <CharacterSvg level={levelInfo.current.level} mood="active" size={48} />
            <View style={styles.questClearBubble}>
              <Text style={styles.questClearText}>{questClearMsg}</Text>
            </View>
          </View>
        </View>
      )}

      {/* RPG報酬シーケンス */}
      <RewardSequence
        show={showRewardSequence}
        level={levelInfo.current.level}
        onComplete={() => setShowRewardSequence(false)}
      />

      {/* ファミリースタンプ送信モーダル */}
      {sessionFamilyId && (
        <FamilyStampSendModal
          visible={stampSendVisible}
          senderId={childId}
          familyId={sessionFamilyId}
          familyMembers={familyMembers}
          onClose={() => setStampSendVisible(false)}
          onSent={() => {
            setStampSendVisible(false);
            loadData();
          }}
        />
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

      {/* 卵ドロップ演出 */}
      {eggDrop && (
        <EggDropAnimation
          show
          petType={eggDrop}
          onComplete={() => { setEggDrop(null); loadData(); }}
        />
      )}

      {/* ペットずかん */}
      <PetManagementModal
        visible={petManageVisible}
        onClose={() => setPetManageVisible(false)}
        childId={childId}
        onChanged={loadData}
      />

      {/* トロフィーケース */}
      <TrophyCaseModal
        visible={trophyVisible}
        onClose={() => setTrophyVisible(false)}
        childId={childId}
      />

      {/* デイリーログインボーナス */}
      <DailyLoginModal
        visible={dailyLoginVisible}
        onClose={() => setDailyLoginVisible(false)}
        childId={childId}
        walletId={wallet?.id ?? null}
        onClaimed={loadData}
      />

      {/* ショップ */}
      <ShopModal
        visible={shopVisible}
        onClose={() => setShopVisible(false)}
        childId={childId}
        walletId={wallet?.id ?? null}
        spendingBalance={wallet?.spending_balance ?? 0}
        onChanged={loadData}
      />

      {/* コインくん AIチャット */}
      <CoinKunChat role="child" />

      {/* じぶんクエスト提案モーダル */}
      <Modal visible={proposalVisible} transparent animationType="slide" onRequestClose={() => setProposalVisible(false)}>
        <KeyboardAvoidingView style={styles.proposalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.proposalCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelLightbulbIcon size={20} /><Text style={styles.proposalModalTitle}>じぶんクエストを提案</Text></View>
            <AutoRubyText text="親に新しいクエストを提案しよう！" style={styles.proposalModalSub} rubySize={5} />

            <Text style={styles.proposalLabel}>クエストの名前</Text>
            <TextInput
              style={styles.proposalInput}
              placeholder="れい: おふろそうじ"
              value={proposalTitle}
              onChangeText={setProposalTitle}
              maxLength={30}
              placeholderTextColor={palette.textPlaceholder}
            />

            <Text style={styles.proposalLabel}>理由（なぜやりたい？）</Text>
            <TextInput
              style={[styles.proposalInput, { minHeight: 60 }]}
              placeholder="れい: きれいにしたいから"
              value={proposalReason}
              onChangeText={setProposalReason}
              multiline
              maxLength={100}
              placeholderTextColor={palette.textPlaceholder}
            />

            <Text style={styles.proposalLabel}>希望のごほうび（円）</Text>
            <TextInput
              style={styles.proposalInput}
              placeholder="れい: 30"
              value={proposalReward}
              onChangeText={setProposalReward}
              keyboardType="number-pad"
              maxLength={5}
              placeholderTextColor={palette.textPlaceholder}
            />

            <View style={styles.proposalActions}>
              <TouchableOpacity style={styles.proposalCancel} onPress={() => setProposalVisible(false)}>
                <Text style={styles.proposalCancelText}>やめる</Text>
              </TouchableOpacity>
              <AnimatedButton
                style={[styles.proposalSubmit, !proposalTitle.trim() && { opacity: 0.5 }]}
                onPress={handleProposalSubmit}
                disabled={!proposalTitle.trim() || proposalSubmitting}
              >
                <Text style={styles.proposalSubmitText}>{proposalSubmitting ? "送信中..." : "提案する！"}</Text>
              </AnimatedButton>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    backgroundColor: `${p.surface}b3`,
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
  progressRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  progressBarWrap: {
    flex: 1,
  },
  progressBar: {
    height: 10,
    backgroundColor: p.surfaceMuted,
    borderRadius: 5,
    overflow: "hidden" as const,
    borderWidth: 1,
    borderColor: p.border,
  },
  progressFill: {
    height: 8,
    backgroundColor: p.primary,
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 9,
    color: p.textMuted,
    marginTop: 1,
    fontWeight: "bold" as const,
    letterSpacing: 1,
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
  walletTitleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginBottom: 4,
  },
  walletTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: p.textMuted,
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
  investShortcut: {
    backgroundColor: p.walletInvest,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    minHeight: 36,
  },
  investShortcutText: {
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
  spendStatusIcon: { width: 24, alignItems: "center" as const, justifyContent: "center" as const },
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

  // Weekly summary
  weeklyCard: {
    margin: 12,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
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
  stampNotifSvgWrap: {
    width: 38,
    height: 38,
    marginRight: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
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
  sectionTitleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: p.textStrong,
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
  tabActive: { backgroundColor: p.primary },
  tabText: { fontSize: 14, color: p.textMuted },
  tabTextActive: { color: p.black, fontWeight: "bold" },

  // Screen title bar — 子供名＋現在画面を明示
  screenTitleBar: {
    marginHorizontal: 12,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: p.surface,
    borderWidth: 1,
    borderColor: `${p.primary}66`,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  screenTitleAccent: {
    width: 4,
    height: 20,
    backgroundColor: p.primary,
    borderRadius: 2,
  },
  screenTitleText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800" as const,
    color: p.textStrong,
    letterSpacing: 0.5,
  },
  screenTitleSub: {
    fontSize: 11,
    color: p.textMuted,
  },

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
    paddingTop: 4,
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
    paddingTop: 10,
    paddingBottom: 4,
    borderRadius: 6,
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
  questIcon: { width: 32, marginRight: 10, alignItems: "center" as const, justifyContent: "center" as const },
  questDetails: { flex: 1 },
  questTitle: { fontSize: 15, fontWeight: "bold", color: p.textStrong, lineHeight: 24 },
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
  historyType: { marginRight: 10, width: 28, alignItems: "center" as const, justifyContent: "center" as const },
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
  trophyHint: {
    textAlign: "center",
    color: p.textMuted,
    fontSize: 10,
    marginTop: 8,
    fontStyle: "italic",
  },
  titleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  titleBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
  },
  shopBtn: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: p.primary,
    backgroundColor: p.primaryLight,
  },
  shopBtnText: {
    fontSize: 10,
    color: p.primary,
    fontWeight: "bold",
  },
  emptySpecialCard: {
    backgroundColor: p.accentLight,
    borderRadius: 12,
    padding: 24,
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
    fontWeight: "bold" as const,
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
    shadowColor: p.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  questClearInner: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 12,
    gap: 10,
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  questClearBubble: {
    flex: 1,
    backgroundColor: "rgba(255,215,0,0.15)",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  questClearText: {
    fontSize: 14,
    fontWeight: "bold" as const,
    color: "#FFD700",
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

  // 共通ユーティリティ
  flex1: { flex: 1 },
  rowWrap: { flexDirection: "row", alignItems: "flex-end", flexWrap: "wrap" } as const,
  rowAround: { flexDirection: "row", justifyContent: "space-around" } as const,
  colCenter: { alignItems: "center" } as const,
  loadingEmoji: { fontSize: 48, marginBottom: 12 },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  loadingText: { color: p.textMuted, marginTop: 12, fontSize: 14 },
  headerDate: { fontSize: rf(10), color: p.textMuted, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 } as const,
  weeklyStatValue: { fontSize: rf(24), fontWeight: "bold", color: p.accent } as const,
  weeklyStatLabel: { fontSize: rf(11), color: p.textMuted },
  bottomSpacer: { height: 40 },

  // じぶんクエスト提案
  proposalButton: {
    margin: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: p.primaryLight,
    borderWidth: 1,
    borderColor: p.primary,
    alignItems: "center" as const,
    minHeight: 48,
    justifyContent: "center" as const,
  },
  proposalButtonText: { fontSize: 15, fontWeight: "bold" as const, color: p.primaryDark },
  proposalPending: { fontSize: 11, color: p.textMuted, marginTop: 2 },
  proposalOverlay: {
    flex: 1,
    backgroundColor: p.overlay,
    justifyContent: "center" as const,
    padding: 20,
  },
  proposalCard: {
    backgroundColor: p.white,
    borderRadius: 16,
    padding: 20,
  },
  proposalModalTitle: { fontSize: rf(18), fontWeight: "bold" as const, color: p.textStrong, marginBottom: 4 },
  proposalModalSub: { fontSize: 12, color: p.textMuted, marginBottom: 16 },
  proposalLabel: { fontSize: 13, fontWeight: "bold" as const, color: p.textStrong, marginTop: 8, marginBottom: 4 },
  proposalInput: {
    borderWidth: 1,
    borderColor: p.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    backgroundColor: p.surfaceMuted,
  },
  proposalActions: { flexDirection: "row" as const, gap: 10, marginTop: 16 },
  proposalCancel: {
    flex: 1,
    padding: 14,
    minHeight: 48,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: p.surfaceMuted,
  },
  proposalCancelText: { fontSize: 16, fontWeight: "bold" as const, color: p.textMuted },
  proposalSubmit: {
    flex: 2,
    padding: 14,
    minHeight: 48,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: p.primary,
  },
  proposalSubmitText: { fontSize: 16, fontWeight: "bold" as const, color: p.white },
  stampRelayBtn: {
    backgroundColor: p.primaryLight,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center" as const,
    marginTop: 10,
    borderWidth: 2,
    borderColor: p.primary,
    minHeight: 52,
    justifyContent: "center" as const,
  },
  stampRelayBtnText: {
    fontSize: 16,
    fontWeight: "bold" as const,
    color: p.primaryDark,
  },
  });
}
