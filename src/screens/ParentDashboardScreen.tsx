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
  Platform,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "../lib/supabase";
import { getSession, clearSession } from "../lib/session";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import { getTaskIcon } from "../lib/task-icons";
import { STAMPS } from "../lib/stamps";
import { getChildStampById } from "../lib/child-stamps";
import { useKeyboardHeight } from "../lib/useKeyboardHeight";
import type { Task, TaskLog, User, Wallet, SpendRequest, FamilySettings, FamilyMessage, FamilyChallenge } from "../lib/types";
import { useAppAlert } from "../components/AppAlert";
import FamilyStampSendModal from "../components/FamilyStampSendModal";
import FamilyMessageCard from "../components/FamilyMessageCard";
import MonthlyReport from "../components/MonthlyReport";
import FamilyAdventureMap from "../components/FamilyAdventureMap";
import FamilyChallengeCard from "../components/FamilyChallengeCard";
import { PixelCrossedSwordsIcon, PixelScrollIcon, PixelShieldIcon, PixelHourglassIcon, PixelCartIcon, PixelCoinIcon, PixelCheckIcon, PixelCrownIcon, PixelLetterIcon, PixelFlameIcon, PixelDoorIcon, PixelBarChartIcon, PixelTargetIcon, PixelLightbulbIcon, PixelChatIcon, PixelPencilIcon, PixelTrashIcon, PixelPauseIcon, PixelPlayIcon, PixelRefreshIcon, PixelStarIcon, PixelCalendarIcon, PixelPersonIcon, PixelWarningIcon, PixelConfettiIcon, PixelGiftIcon } from "../components/PixelIcons";
import GameStatusHeader from "../components/GameStatusHeader";
import RpgCard from "../components/RpgCard";
import RpgButton from "../components/RpgButton";
import QuestCardFrame from "../components/QuestCardFrame";
import TaskIconSvg from "../components/TaskIconSvg";
import { getQuestCardTier } from "../lib/rpg-stats";

type PendingLog = TaskLog & { task: Task; child: User };

export default function ParentDashboardScreen({
  navigation,
}: {
  navigation: any;
}) {
  const { alert } = useAppAlert();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [familyId, setFamilyId] = useState("");
  const [userId, setUserId] = useState("");
  const [children, setChildren] = useState<User[]>([]);
  const [wallets, setWallets] = useState<Record<string, Wallet>>({});
  const [pendingLogs, setPendingLogs] = useState<PendingLog[]>([]);
  const [pendingSpends, setPendingSpends] = useState<SpendRequest[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [priceRequests, setPriceRequests] = useState<Task[]>([]);
  const [questProposals, setQuestProposals] = useState<Task[]>([]);
  const [recentApproved, setRecentApproved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const keyboardHeight = useKeyboardHeight();
  const [tab, setTab] = useState<"approve" | "tasks" | "children">("approve");

  // Approval dialog
  const [approvalTarget, setApprovalTarget] = useState<PendingLog | null>(null);
  const [selectedStamp, setSelectedStamp] = useState<string | null>(null);
  const [approvalMessage, setApprovalMessage] = useState("");

  // Task form
  const [taskFormVisible, setTaskFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    reward_amount: "10",
    recurrence: "once" as "once" | "daily" | "weekly",
    assigned_child_id: "",
    price_change_comment: "",
    is_special: false,
    special_difficulty: 1,
    start_date: "",
    end_date: "",
  });

  // ScrollView refs for keyboard handling
  const approvalScrollRef = useRef<ScrollView>(null);
  const taskFormScrollRef = useRef<ScrollView>(null);

  // Date picker
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // 特別クエスト設定
  const [familySettings, setFamilySettings] = useState<FamilySettings | null>(null);
  // 週次サマリー
  const [weeklySummary, setWeeklySummary] = useState({ quests: 0, earned: 0 });
  // ファミリースタンプリレー
  const [familyMessages, setFamilyMessages] = useState<FamilyMessage[]>([]);
  const [allMembers, setAllMembers] = useState<User[]>([]);
  const [stampSendVisible, setStampSendVisible] = useState(false);
  // 家族名
  const [familyName, setFamilyName] = useState("");
  // 家族チャレンジ
  const [activeChallenge, setActiveChallenge] = useState<FamilyChallenge | null>(null);
  const [challengeCreating, setChallengeCreating] = useState(false);

  const loadData = useCallback(async () => {
    const session = await getSession();
    if (!session) {
      setLoading(false);
      return;
    }
    setUserId(session.userId);

    // セッションのfamilyIdで子供を取得
    let childQuery = supabase
      .from("otetsudai_users")
      .select("*")
      .eq("role", "child");
    if (session.familyId) {
      childQuery = childQuery.eq("family_id", session.familyId);
      setFamilyId(session.familyId);
    }
    const { data: childData } = await childQuery;
    const kids = childData || [];
    setChildren(kids);
    const childIds = kids.map((c) => c.id);

    // Get familyIds for tasks query
    const familyIds = [...new Set(kids.map((c) => c.family_id))];
    if (session.familyId && !familyIds.includes(session.familyId)) {
      familyIds.push(session.familyId);
    }
    if (familyIds.length > 0) {
      setFamilyId(familyIds[0]);
      const { data: famData } = await supabase
        .from("otetsudai_families")
        .select("name")
        .eq("id", familyIds[0])
        .single();
      if (famData) setFamilyName(famData.name);
    }

    if (childIds.length === 0) {
      // Still load tasks even if no children
      if (familyIds.length > 0) {
        const { data: taskData } = await supabase
          .from("otetsudai_tasks")
          .select("*")
          .in("family_id", familyIds)
          .order("created_at", { ascending: false });
        setTasks(taskData || []);
      }
      setLoading(false);
      return;
    }

    const [walletRes, logsRes, spendRes, taskRes] = await Promise.all([
      supabase.from("otetsudai_wallets").select("*").in("child_id", childIds),
      supabase
        .from("otetsudai_task_logs")
        .select("*, task:otetsudai_tasks(*), child:child_id(id, name, role)")
        .in("child_id", childIds)
        .eq("status", "pending")
        .order("completed_at", { ascending: false }),
      supabase
        .from("otetsudai_spend_requests")
        .select("*, child:child_id(id, name, role)")
        .in("child_id", childIds)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      familyIds.length > 0
        ? supabase
            .from("otetsudai_tasks")
            .select("*")
            .in("family_id", familyIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);

    const walletMap: Record<string, Wallet> = {};
    (walletRes.data || []).forEach((w: Wallet) => {
      walletMap[w.child_id] = w;
    });
    setWallets(walletMap);
    setPendingLogs((logsRes.data as PendingLog[]) || []);
    setPendingSpends((spendRes.data as SpendRequest[]) || []);
    const allTasks = taskRes.data || [];
    setTasks(allTasks);
    setPriceRequests(allTasks.filter((t: Task) => t.proposal_status === "pending" && t.proposed_reward && t.is_active));
    setQuestProposals(allTasks.filter((t: Task) => !t.is_active && t.proposal_status === "pending" && t.created_by !== session?.userId));

    // 最近の承認済みログ（子ども返信確認用）
    if (childIds.length > 0) {
      const { data: approvedData } = await supabase
        .from("otetsudai_task_logs")
        .select("*, task:otetsudai_tasks(title, reward_amount), child:child_id(name)")
        .in("child_id", childIds)
        .eq("status", "approved")
        .order("approved_at", { ascending: false })
        .limit(10);
      setRecentApproved(approvedData || []);
    }

    // 特別クエスト設定を読み込み
    if (familyIds.length > 0) {
      const fid = familyIds[0];
      const { data: settingsData } = await supabase
        .from("otetsudai_family_settings")
        .select("*")
        .eq("family_id", fid)
        .single();

      if (settingsData) {
        setFamilySettings(settingsData);
      } else {
        // レコードがなければデフォルトで作成
        const { data: newSettings } = await supabase
          .from("otetsudai_family_settings")
          .insert({ family_id: fid })
          .select()
          .single();
        if (newSettings) setFamilySettings(newSettings);
      }
    }

    // 週次サマリー
    if (familyIds.length > 0) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const { data: weeklyLogs } = await supabase
        .from("otetsudai_task_logs")
        .select("*, task:otetsudai_tasks(reward_amount, family_id)")
        .eq("status", "approved")
        .gte("approved_at", weekStart.toISOString());
      const familyWeeklyLogs = (weeklyLogs || []).filter(
        (log: any) => log.task?.family_id && familyIds.includes(log.task.family_id)
      );
      setWeeklySummary({
        quests: familyWeeklyLogs.length,
        earned: familyWeeklyLogs.reduce(
          (sum: number, log: any) => sum + (log.task?.reward_amount || 0), 0
        ),
      });
    }

    // ファミリースタンプリレー: メンバー一覧 + メッセージ取得
    if (familyIds.length > 0) {
      const fid = familyIds[0];
      const [membersRes, fmsgRes] = await Promise.all([
        supabase
          .from("otetsudai_users")
          .select("*")
          .eq("family_id", fid)
          .neq("role", "admin"),
        supabase
          .from("otetsudai_family_messages")
          .select("*, sender:otetsudai_users!sender_id(*), recipient:otetsudai_users!recipient_id(*)")
          .eq("family_id", fid)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      setAllMembers(membersRes.data || []);
      setFamilyMessages(fmsgRes.data || []);

      // アクティブな家族チャレンジ
      const today = new Date().toISOString().slice(0, 10);
      const { data: challengeData } = await supabase
        .from("otetsudai_family_challenges")
        .select("*")
        .eq("family_id", fid)
        .lte("start_date", today)
        .gte("end_date", today)
        .order("created_at", { ascending: false })
        .limit(1);
      setActiveChallenge(challengeData?.[0] || null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateChallenge() {
    if (!familyId || challengeCreating) return;
    setChallengeCreating(true);
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 6);
    const titles = [
      "みんなで 20クエスト クリアしよう！",
      "かぞくで ちからを あわせよう！",
      "こんしゅうも がんばろう！",
      "めざせ クエストマスター！",
    ];
    const title = titles[Math.floor(Math.random() * titles.length)];
    await supabase.from("otetsudai_family_challenges").insert({
      family_id: familyId,
      title,
      target_quests: 20,
      bonus_amount: 50,
      start_date: today.toISOString().slice(0, 10),
      end_date: endDate.toISOString().slice(0, 10),
    });
    setChallengeCreating(false);
    loadData();
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  // --- Approval ---
  async function handleApprove() {
    if (!approvalTarget) return;
    const log = approvalTarget;

    await supabase
      .from("otetsudai_task_logs")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: userId,
        approval_stamp: selectedStamp,
        approval_message: approvalMessage || null,
      })
      .eq("id", log.id);

    const childWallet = wallets[log.child_id];
    if (childWallet && log.task) {
      const reward = log.task.reward_amount;
      const saveRatio = childWallet.save_ratio ?? 0;
      const investRatio = childWallet.invest_ratio ?? 0;
      const savingPortion = Math.floor((reward * saveRatio) / 100);
      const investPortion = Math.floor((reward * investRatio) / 100);
      const spendingPortion = reward - savingPortion - investPortion;

      await supabase
        .from("otetsudai_wallets")
        .update({
          spending_balance: childWallet.spending_balance + spendingPortion,
          saving_balance: childWallet.saving_balance + savingPortion,
          invest_balance: childWallet.invest_balance + investPortion,
        })
        .eq("id", childWallet.id);

      await supabase.from("otetsudai_transactions").insert({
        wallet_id: childWallet.id,
        type: "earn",
        amount: reward,
        description: `${log.task.title} 承認`,
        task_log_id: log.id,
      });
    }

    setApprovalTarget(null);
    setSelectedStamp(null);
    setApprovalMessage("");
    await loadData();
  }

  async function handleReject(logId: string) {
    const reasons = [
      "🔄 やり直し",
      "もう少し 丁寧に",
      "最後まで やろう",
      "時間を かけてね",
    ];
    alert("やり直し", "理由を 選んでね", [
      ...reasons.map((r) => ({
        text: r,
        onPress: async () => {
          await supabase
            .from("otetsudai_task_logs")
            .update({ status: "rejected", reject_reason: r })
            .eq("id", logId);
          await loadData();
        },
      })),
      { text: "キャンセル", style: "cancel" },
    ]);
  }

  // --- Spend Request ---
  async function handleApproveSpend(req: SpendRequest) {
    const childWallet = wallets[req.child_id];
    if (!childWallet || childWallet.spending_balance < req.amount) {
      alert("エラー", "残高が たりません");
      return;
    }

    await supabase
      .from("otetsudai_spend_requests")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: userId,
        payment_status: "pending_payment",
      })
      .eq("id", req.id);

    await supabase
      .from("otetsudai_wallets")
      .update({
        spending_balance: childWallet.spending_balance - req.amount,
      })
      .eq("id", childWallet.id);

    await supabase.from("otetsudai_transactions").insert({
      wallet_id: childWallet.id,
      type: "spend",
      amount: req.amount,
      description: req.purpose,
    });

    await loadData();
  }

  async function handleRejectSpend(reqId: string) {
    await supabase
      .from("otetsudai_spend_requests")
      .update({ status: "rejected", reject_reason: "きょかされませんでした" })
      .eq("id", reqId);
    alert("❌", "リクエストを きょかしませんでした");
    await loadData();
  }

  // --- Task CRUD ---
  async function updateFamilySettings(updates: Partial<FamilySettings>) {
    if (!familySettings) return;
    const newSettings = { ...familySettings, ...updates };
    setFamilySettings(newSettings);
    await supabase
      .from("otetsudai_family_settings")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", familySettings.id);
  }

  function openTaskForm(task?: Task) {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title,
        description: task.description || "",
        reward_amount: String(task.reward_amount),
        recurrence: task.recurrence,
        assigned_child_id: task.assigned_child_id || "",
        price_change_comment: "",
        is_special: task.is_special || false,
        special_difficulty: task.special_difficulty || 1,
        start_date: task.start_date || "",
        end_date: task.end_date || "",
      });
    } else {
      setEditingTask(null);
      setTaskForm({
        title: "",
        description: "",
        reward_amount: "10",
        recurrence: "once",
        assigned_child_id: "",
        price_change_comment: "",
        is_special: false,
        special_difficulty: 1,
        start_date: "",
        end_date: "",
      });
    }
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
    setTaskFormVisible(true);
  }

  async function handleSaveTask() {
    if (!taskForm.title) {
      alert("エラー", "クエスト名を 入れてください");
      return;
    }
    const newAmount = parseInt(taskForm.reward_amount) || 10;
    if (taskForm.is_special && newAmount < 50) {
      alert("エラー", "★特別クエストの 報酬は 50円以上に してください");
      return;
    }

    if (editingTask && newAmount < editingTask.reward_amount && !taskForm.price_change_comment.trim()) {
      alert("⚠️ コメント必須", "報酬を 下げるときは、理由を 入れてください");
      return;
    }

    const payload: Record<string, unknown> = {
      family_id: familyId,
      title: taskForm.title,
      description: taskForm.description || null,
      reward_amount: newAmount,
      recurrence: taskForm.is_special ? "once" : taskForm.recurrence,
      assigned_child_id: taskForm.assigned_child_id || null,
      is_active: true,
      created_by: userId,
      is_special: taskForm.is_special,
      special_difficulty: taskForm.is_special ? taskForm.special_difficulty : null,
      start_date: taskForm.is_special && taskForm.start_date ? taskForm.start_date : null,
      end_date: taskForm.is_special && taskForm.end_date ? taskForm.end_date : null,
    };

    // 金額変更時のコメント
    if (editingTask && newAmount !== editingTask.reward_amount && taskForm.price_change_comment.trim()) {
      payload.price_change_comment = taskForm.price_change_comment.trim();
    }

    if (editingTask) {
      const { error } = await supabase
        .from("otetsudai_tasks")
        .update(payload)
        .eq("id", editingTask.id);
      if (error) {
        alert("エラー", `更新失敗: ${error.message}`);
        return;
      }
    } else {
      const { error } = await supabase.from("otetsudai_tasks").insert(payload);
      if (error) {
        alert("エラー", `作成失敗: ${error.message}`);
        return;
      }
    }
    setTaskFormVisible(false);
    await loadData();
  }

  async function handleDeleteTask(taskId: string) {
    alert("削除", "この クエストを 削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除する",
        style: "destructive",
        onPress: async () => {
          await supabase.from("otetsudai_tasks").delete().eq("id", taskId);
          await loadData();
        },
      },
    ]);
  }

  async function handleToggleTask(task: Task) {
    await supabase
      .from("otetsudai_tasks")
      .update({ is_active: !task.is_active })
      .eq("id", task.id);
    await loadData();
  }

  async function handleApprovePriceRequest(task: Task) {
    await supabase
      .from("otetsudai_tasks")
      .update({
        reward_amount: task.proposed_reward,
        proposal_status: "approved",
        price_change_comment: `報酬 ${task.reward_amount}→${task.proposed_reward}円にアップ！`,
      })
      .eq("id", task.id);
    alert("✅ 承認", `${task.title}の 報酬を ${task.proposed_reward}円に しました`);
    await loadData();
  }

  async function handleRejectPriceRequest(task: Task) {
    alert("❌ 却下", `${task.title}の ねあげリクエストを 却下しますか？`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "却下する",
        style: "destructive",
        onPress: async () => {
          await supabase
            .from("otetsudai_tasks")
            .update({
              proposal_status: "rejected",
              proposed_reward: null,
              price_change_comment: "いまの きんがくで がんばろう！",
            })
            .eq("id", task.id);
          await loadData();
        },
      },
    ]);
  }

  async function handleApproveProposal(task: Task) {
    const reward = task.proposed_reward || 10;
    await supabase
      .from("otetsudai_tasks")
      .update({
        is_active: true,
        reward_amount: reward,
        proposal_status: "approved",
      })
      .eq("id", task.id);
    await loadData();
  }

  async function handleRejectProposal(task: Task) {
    await supabase
      .from("otetsudai_tasks")
      .update({ proposal_status: "rejected" })
      .eq("id", task.id);
    await loadData();
  }

  function handleLogout() {
    clearSession().then(() => {
      navigation.reset({ index: 0, routes: [{ name: "Landing" }] });
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingEmoji}>👨‍👩‍👧‍👦</Text>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.loadingText}>よみこみちゅう...</Text>
      </View>
    );
  }

  const pendingCount = pendingLogs.length + pendingSpends.length + questProposals.length;

  return (
    <SafeAreaView style={styles.container} accessibilityLabel="おやダッシュボード">
      <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
        <GameStatusHeader
          title="👨‍👩‍👧‍👦 クエストマスター"
          level={Math.max(1, children.length)}
          hp={Math.min(100, pendingCount === 0 && children.length > 0 ? 100 : Math.max(30, 100 - pendingCount * 10))}
          mp={Math.min(10, children.length * 2)}
          exp={0}
          pendingCount={pendingCount}
          onBack={handleLogout}
          onLogout={handleLogout}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow} accessibilityRole="tabbar">
        <TouchableOpacity
          style={[styles.tabButton, tab === "approve" && styles.tabActive]}
          onPress={() => setTab("approve")}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === "approve" }}
          accessibilityLabel={`しょうにんタブ${pendingCount > 0 ? ` みしょうにん${pendingCount}けん` : ""}`}
        >
          <View style={styles.headerBadgeRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}><PixelCheckIcon size={14} /><Text style={tab === "approve" ? styles.tabTextActive : styles.tabText} numberOfLines={1}>承認</Text></View>
            {pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === "tasks" && styles.tabActive]}
          onPress={() => setTab("tasks")}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === "tasks" }}
          accessibilityLabel="クエストタブ"
        >
          <Text
            style={[styles.tabText, tab === "tasks" && styles.tabTextActive]}
            numberOfLines={1}
          >
            クエスト
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === "children" && styles.tabActive]}
          onPress={() => setTab("children")}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === "children" }}
          accessibilityLabel="こどもタブ"
        >
          <Text
            style={[
              styles.tabText,
              tab === "children" && styles.tabTextActive,
            ]}
            numberOfLines={1}
          >
            子ども
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 週次サマリー */}
        {tab === "approve" && weeklySummary.quests > 0 && (
          <RpgCard tier="silver" style={{ marginHorizontal: 12, marginTop: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelBarChartIcon size={16} /><Text style={styles.weeklySummaryTitle}>今週の家族記録</Text></View>
            <View style={styles.rowAround}>
              <View style={styles.colCenter}>
                <Text style={styles.weeklyStatValue}>{weeklySummary.quests}</Text>
                <Text style={styles.weeklyStatLabel}>クエスト</Text>
              </View>
              <View style={styles.colCenter}>
                <Text style={styles.weeklyStatValue}>¥{weeklySummary.earned.toLocaleString()}</Text>
                <Text style={styles.weeklyStatLabel}>支払い</Text>
              </View>
            </View>
          </RpgCard>
        )}

        {/* 家族チャレンジ（承認タブ内） */}
        {tab === "approve" && (
          <View style={styles.section}>
            {activeChallenge ? (
              <FamilyChallengeCard
                challenge={activeChallenge}
                children={children}
                isParent
              />
            ) : (
              <TouchableOpacity
                style={[styles.stampRelayBtn, { backgroundColor: palette.accentLight, borderColor: palette.accent }]}
                onPress={handleCreateChallenge}
                disabled={challengeCreating}
                accessibilityLabel="今週の家族チャレンジを作る"
                accessibilityRole="button"
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  {!challengeCreating && <PixelTargetIcon size={16} />}
                  <Text style={[styles.stampRelayBtnText, { color: palette.accentDark }]}>
                    {challengeCreating ? "作成中..." : "今週のチャレンジを作る"}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ファミリースタンプリレー（承認タブ内） */}
        {tab === "approve" && (
          <View style={styles.section}>
            <FamilyMessageCard messages={familyMessages} currentUserId={userId} />
            <TouchableOpacity
              style={[styles.stampRelayBtn, { backgroundColor: palette.primaryLight, borderColor: palette.primary }]}
              onPress={() => setStampSendVisible(true)}
              accessibilityLabel="家族にエールを送る"
              accessibilityRole="button"
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <PixelLetterIcon size={16} />
                <Text style={[styles.stampRelayBtnText, { color: palette.primaryDark }]}>
                  エールを送る
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* === Approve Tab === */}
        {tab === "approve" && (
          <View style={styles.section}>
            {/* Quest completions */}
            {pendingLogs.length > 0 && (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><PixelHourglassIcon size={18} /><Text style={styles.sectionTitle}>{`クエスト完了 (${pendingLogs.length})`}</Text></View>
                {pendingLogs.map((log) => (
                  <QuestCardFrame key={log.id} tier={getQuestCardTier(log.task || { recurrence: "once" })}>
                    <View style={styles.approvalInfo}>
                      <View style={styles.approvalIcon}>
                        <TaskIconSvg title={log.task?.title || ""} size={28} />
                      </View>
                      <View style={styles.flex1}>
                        <Text style={styles.approvalTitle}>
                          {log.task?.title}
                        </Text>
                        <Text style={styles.approvalSub}>
                          🧒 {(log.child as any)?.name} ・ 🪙{" "}
                          {log.task?.reward_amount}円
                        </Text>
                      </View>
                    </View>
                    <View style={styles.approvalActions}>
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => setApprovalTarget(log)}
                      >
                        <Text style={styles.approveText}>承認</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleReject(log.id)}
                      >
                        <Text style={styles.rejectText}>やり直し</Text>
                      </TouchableOpacity>
                    </View>
                  </QuestCardFrame>
                ))}
              </>
            )}

            {/* Spend requests */}
            {pendingSpends.length > 0 && (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16 }}><PixelCartIcon size={18} /><Text style={styles.sectionTitle}>{`使いたいリクエスト (${pendingSpends.length})`}</Text></View>
                {pendingSpends.map((req) => (
                  <View key={req.id} style={styles.approvalCard}>
                    <View style={styles.approvalInfo}>
                      <View style={styles.approvalIcon}><PixelCartIcon size={24} /></View>
                      <View style={styles.flex1}>
                        <Text style={styles.approvalTitle}>{req.purpose}</Text>
                        <Text style={styles.approvalSub}>
                          🧒 {(req.child as any)?.name} ・ {req.amount}円
                        </Text>
                      </View>
                    </View>
                    <View style={styles.approvalActions}>
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => handleApproveSpend(req)}
                      >
                        <Text style={styles.approveText}>OK</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleRejectSpend(req.id)}
                      >
                        <Text style={styles.rejectText}>NG</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Price requests */}
            {priceRequests.length > 0 && (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16 }}><PixelCoinIcon size={18} /><Text style={styles.sectionTitle}>{`値上げリクエスト (${priceRequests.length})`}</Text></View>
                {priceRequests.map((task) => (
                  <QuestCardFrame key={task.id} tier={getQuestCardTier(task)}>
                    <View style={styles.approvalInfo}>
                      <View style={styles.approvalIcon}>
                        <TaskIconSvg title={task.title} size={28} />
                      </View>
                      <View style={styles.flex1}>
                        <Text style={styles.approvalTitle}>{task.title}</Text>
                        <Text style={styles.approvalSub}>
                          {task.reward_amount}円 → {task.proposed_reward}円
                        </Text>
                        {task.proposal_message && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelChatIcon size={14} /><Text style={styles.subText}>「{task.proposal_message}」</Text></View>
                        )}
                      </View>
                    </View>
                    <View style={styles.approvalActions}>
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => handleApprovePriceRequest(task)}
                      >
                        <Text style={styles.approveText}>OK</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleRejectPriceRequest(task)}
                      >
                        <Text style={styles.rejectText}>NG</Text>
                      </TouchableOpacity>
                    </View>
                  </QuestCardFrame>
                ))}
              </>
            )}

            {/* じぶんクエスト提案 */}
            {questProposals.length > 0 && (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16 }}><PixelScrollIcon size={18} /><Text style={styles.sectionTitle}>{`じぶんクエスト提案 (${questProposals.length})`}</Text></View>
                {questProposals.map((task) => {
                  const child = children.find((c) => c.id === task.assigned_child_id);
                  return (
                    <QuestCardFrame key={task.id} tier={getQuestCardTier(task)}>
                      <View style={styles.approvalInfo}>
                        <View style={styles.approvalIcon}><PixelLightbulbIcon size={24} /></View>
                        <View style={styles.flex1}>
                          <Text style={styles.approvalTitle}>{task.title}</Text>
                          <Text style={styles.approvalSub}>
                            🧒 {child?.name || "?"} ・ 希望 {task.proposed_reward || "?"}円
                          </Text>
                          {task.proposal_message && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelChatIcon size={14} /><Text style={styles.subText}>「{task.proposal_message}」</Text></View>
                          )}
                        </View>
                      </View>
                      <View style={styles.approvalActions}>
                        <TouchableOpacity
                          style={styles.approveButton}
                          onPress={() => handleApproveProposal(task)}
                        >
                          <Text style={styles.approveText}>承認</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectButton}
                          onPress={() => handleRejectProposal(task)}
                        >
                          <Text style={styles.rejectText}>NG</Text>
                        </TouchableOpacity>
                      </View>
                    </QuestCardFrame>
                  );
                })}
              </>
            )}

            {pendingCount === 0 && priceRequests.length === 0 && questProposals.length === 0 && (
              <View style={styles.emptyCard}>
                <PixelStarIcon size={32} />
                <Text style={styles.emptyCardText}>承認待ちはありません</Text>
                <Text style={styles.emptyCardSub}>全て処理済みです！</Text>
              </View>
            )}

            {/* 最近の承認（子ども返信表示） */}
            {recentApproved.length > 0 && (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 20 }}><PixelCheckIcon size={18} /><Text style={styles.sectionTitle}>最近の承認</Text></View>
                {recentApproved.map((log: any) => {
                  const childStamp = log.child_reaction_stamp
                    ? getChildStampById(log.child_reaction_stamp)
                    : null;
                  const hasReaction = !!log.child_reaction_at;
                  return (
                    <QuestCardFrame key={log.id} tier={getQuestCardTier(log.task || { recurrence: "once" })}>
                      <View style={styles.approvalInfo}>
                        <View style={styles.approvalIcon}>{hasReaction ? <PixelCheckIcon size={24} /> : <PixelHourglassIcon size={24} />}</View>
                        <View style={styles.flex1}>
                          <Text style={styles.approvalTitle}>
                            {log.task?.title}
                          </Text>
                          <Text style={styles.approvalSub}>
                            🧒 {log.child?.name} ・ 🪙 {log.task?.reward_amount}円
                          </Text>
                          {childStamp && (
                            <Text style={styles.recentAmount}>
                              {childStamp.emoji} {childStamp.label}
                            </Text>
                          )}
                          {log.child_reaction_message && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelChatIcon size={14} /><Text style={styles.subText}>「{log.child_reaction_message}」</Text></View>
                          )}
                          {!hasReaction && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelHourglassIcon size={12} /><Text style={styles.pendingText}>子どもの返事待ち</Text></View>
                          )}
                        </View>
                      </View>
                    </QuestCardFrame>
                  );
                })}
              </>
            )}
          </View>
        )}

        {/* === Tasks Tab === */}
        {tab === "tasks" && (
          <View style={styles.section}>
            {/* ★特別クエスト設定パネル */}
            {familySettings && (
              <View style={styles.settingsPanel}>
                <Text style={styles.settingsPanelTitle}>★ 特別クエスト設定</Text>
                <View style={styles.settingsRow}>
                  <Text style={styles.settingsLabel}>特別クエスト全体</Text>
                  <Switch
                    value={familySettings.special_quest_enabled}
                    onValueChange={(v) => updateFamilySettings({ special_quest_enabled: v })}
                    trackColor={{ false: palette.switchTrackOff, true: palette.switchTrackOn }}
                    thumbColor={familySettings.special_quest_enabled ? palette.primary : palette.switchThumbOff}
                  />
                </View>
                <View style={[styles.settingsRow, !familySettings.special_quest_enabled && { opacity: 0.4 }]}>
                  <Text style={styles.settingsLabel}>★ 簡単</Text>
                  <Switch
                    value={familySettings.special_quest_star1_enabled}
                    onValueChange={(v) => updateFamilySettings({ special_quest_star1_enabled: v })}
                    disabled={!familySettings.special_quest_enabled}
                    trackColor={{ false: palette.switchTrackOff, true: palette.switchTrackOn }}
                    thumbColor={familySettings.special_quest_star1_enabled ? palette.primary : palette.switchThumbOff}
                  />
                </View>
                <View style={[styles.settingsRow, !familySettings.special_quest_enabled && { opacity: 0.4 }]}>
                  <Text style={styles.settingsLabel}>★★ 普通</Text>
                  <Switch
                    value={familySettings.special_quest_star2_enabled}
                    onValueChange={(v) => updateFamilySettings({ special_quest_star2_enabled: v })}
                    disabled={!familySettings.special_quest_enabled}
                    trackColor={{ false: palette.switchTrackOff, true: palette.switchTrackOn }}
                    thumbColor={familySettings.special_quest_star2_enabled ? palette.primary : palette.switchThumbOff}
                  />
                </View>
                <View style={[styles.settingsRow, !familySettings.special_quest_enabled && { opacity: 0.4 }]}>
                  <Text style={styles.settingsLabel}>★★★ 難しい</Text>
                  <Switch
                    value={familySettings.special_quest_star3_enabled}
                    onValueChange={(v) => updateFamilySettings({ special_quest_star3_enabled: v })}
                    disabled={!familySettings.special_quest_enabled}
                    trackColor={{ false: palette.switchTrackOff, true: palette.switchTrackOn }}
                    thumbColor={familySettings.special_quest_star3_enabled ? palette.primary : palette.switchThumbOff}
                  />
                </View>
              </View>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.addButton, { flex: 1, marginBottom: 0 }]}
                onPress={() => openTaskForm()}
              >
                <Text style={styles.addButtonText}>+ クエスト</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, { flex: 1, marginBottom: 0, backgroundColor: palette.gold }]}
                onPress={() => {
                  openTaskForm();
                  setTimeout(() => {
                    setTaskForm((prev) => ({
                      ...prev,
                      is_special: true,
                      reward_amount: "50",
                      special_difficulty: 1,
                    }));
                  }, 0);
                }}
              >
                <Text style={styles.addButtonText}>+ ★特別</Text>
              </TouchableOpacity>
            </View>
            {/* ★特別クエスト */}
            {tasks.filter((t) => t.is_special).length > 0 && (
              <>
                <Text style={styles.specialLabel}>★ 特別クエスト</Text>
                {tasks.filter((t) => t.is_special).map((task) => {
                  const starDisabled = familySettings && (
                    !familySettings.special_quest_enabled ||
                    (task.special_difficulty === 1 && !familySettings.special_quest_star1_enabled) ||
                    (task.special_difficulty === 2 && !familySettings.special_quest_star2_enabled) ||
                    (task.special_difficulty === 3 && !familySettings.special_quest_star3_enabled)
                  );
                  return (
                    <View
                      key={task.id}
                      style={[(!task.is_active || starDisabled) && styles.taskInactive]}
                    >
                      <QuestCardFrame tier="gold">
                        <View style={styles.taskInfo}>
                          <View style={styles.taskIcon}>
                            <TaskIconSvg title={task.title} size={28} />
                          </View>
                          <View style={styles.flex1}>
                            <Text style={[styles.taskTitle, { color: palette.goldText }]}>
                              {"★".repeat(task.special_difficulty || 1)} {task.title}
                            </Text>
                            <Text style={styles.taskSub}>
                              🪙 {task.reward_amount}円
                              {task.end_date ? ` ・ 〜${new Date(task.end_date).toLocaleDateString("ja-JP")}` : ""}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.taskActions}>
                          <TouchableOpacity
                            style={styles.taskActionBtn}
                            onPress={() => openTaskForm(task)}
                          >
                            <PixelPencilIcon size={18} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.taskActionBtn}
                            onPress={() => handleToggleTask(task)}
                          >
                            {task.is_active ? <PixelPauseIcon size={18} /> : <PixelPlayIcon size={18} />}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.taskActionBtn}
                            onPress={() => handleDeleteTask(task.id)}
                          >
                            <PixelTrashIcon size={18} />
                          </TouchableOpacity>
                        </View>
                      </QuestCardFrame>
                    </View>
                  );
                })}
              </>
            )}

            {/* 通常クエスト */}
            {tasks.filter((t) => !t.is_special).map((task) => (
              <View
                key={task.id}
                style={[!task.is_active && styles.taskInactive]}
              >
                <QuestCardFrame tier={getQuestCardTier(task)}>
                  <View style={styles.taskInfo}>
                    <View style={styles.taskIcon}>
                      <TaskIconSvg title={task.title} size={28} />
                    </View>
                    <View style={styles.flex1}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <View style={styles.taskSubRow}>
                        <TouchableOpacity
                          onPress={() => openTaskForm(task)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.taskRewardTap}>🪙 {task.reward_amount}円 ✏️</Text>
                        </TouchableOpacity>
                        <Text style={styles.taskSub}>
                          {task.recurrence === "daily"
                            ? "毎日"
                            : task.recurrence === "weekly"
                              ? "毎週"
                              : "1回"}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.taskActions}>
                    <TouchableOpacity
                      style={styles.taskActionBtn}
                      onPress={() => openTaskForm(task)}
                    >
                      <PixelPencilIcon size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.taskActionBtn}
                      onPress={() => handleToggleTask(task)}
                    >
                      {task.is_active ? <PixelPauseIcon size={18} /> : <PixelPlayIcon size={18} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.taskActionBtn}
                      onPress={() => handleDeleteTask(task.id)}
                    >
                      <PixelTrashIcon size={18} />
                    </TouchableOpacity>
                  </View>
                </QuestCardFrame>
              </View>
            ))}
          </View>
        )}

        {/* === Children Tab === */}
        {tab === "children" && (
          <View style={styles.section}>
            {/* 冒険の地図 */}
            {children.length > 0 && (
              <FamilyAdventureMap
                familyName={familyName || "かぞく"}
                children={children}
                wallets={wallets}
              />
            )}
            {children.map((child) => {
              const w = wallets[child.id];
              const total = w
                ? w.spending_balance + w.saving_balance + w.invest_balance
                : 0;
              return (
                <RpgCard key={child.id} tier="gold" style={{ marginBottom: 10 }}>
                  <Text style={styles.childName}>🧒 {child.name}</Text>
                  <Text style={styles.childTotal}>
                    {total.toLocaleString()}円
                  </Text>
                  {w && (
                    <View style={styles.walletRow}>
                      <View
                        style={[
                          styles.walletItem,
                          { borderColor: palette.walletSpendBorder },
                        ]}
                      >
                        <Text style={styles.walletLabel}>使う</Text>
                        <Text
                          style={[
                            styles.walletAmount,
                            { color: palette.walletSpendText },
                          ]}
                        >
                          {w.spending_balance.toLocaleString()}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.walletItem,
                          { borderColor: palette.walletSaveBorder },
                        ]}
                      >
                        <Text style={styles.walletLabel}>貯める</Text>
                        <Text
                          style={[
                            styles.walletAmount,
                            { color: palette.walletSaveText },
                          ]}
                        >
                          {w.saving_balance.toLocaleString()}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.walletItem,
                          { borderColor: palette.walletInvestBorder },
                        ]}
                      >
                        <Text style={styles.walletLabel}>増やす</Text>
                        <Text
                          style={[
                            styles.walletAmount,
                            { color: palette.walletInvestText },
                          ]}
                        >
                          {w.invest_balance.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  )}
                  {w && (
                    <Text style={styles.ratioText}>
                      割合: 使う{" "}
                      {100 - (w.save_ratio ?? 0) - (w.invest_ratio ?? 0)}% /
                      貯める {w.save_ratio ?? 0}% / 増やす{" "}
                      {w.invest_ratio ?? 0}%
                    </Text>
                  )}
                  {/* 月次レポート */}
                  <MonthlyReport child={child} wallet={w || null} />
                </RpgCard>
              );
            })}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* === Approval Modal === */}
      <Modal
        visible={!!approvalTarget}
        animationType="slide"
        transparent
        onRequestClose={() => setApprovalTarget(null)}
      >
        <View style={styles.flex1}>
          <ScrollView
            ref={approvalScrollRef}
            contentContainerStyle={[
              styles.modalOverlay,
              keyboardHeight > 0 && { paddingBottom: keyboardHeight },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle} adjustsFontSizeToFit numberOfLines={1}>承認</Text>
              <Text style={styles.modalSub}>
                {(approvalTarget?.child as any)?.name} -{" "}
                {approvalTarget?.task?.title}
              </Text>
              <Text style={styles.modalReward}>
                🪙 {approvalTarget?.task?.reward_amount}円
              </Text>

              {/* Stamps */}
              <Text style={styles.stampLabel}>スタンプを選んでね</Text>
              <View style={styles.stampGrid}>
                {STAMPS.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.stampItem,
                      selectedStamp === s.id && styles.stampSelected,
                    ]}
                    onPress={() =>
                      setSelectedStamp(selectedStamp === s.id ? null : s.id)
                    }
                  >
                    <Text style={styles.stampEmoji}>{s.emoji}</Text>
                    <Text style={styles.stampText}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Message */}
              <TextInput
                style={styles.messageInput}
                placeholder="一言メッセージ（なくてもOK）"
                value={approvalMessage}
                onChangeText={setApprovalMessage}
                maxLength={100}
                onFocus={() => {
                  setTimeout(() => approvalScrollRef.current?.scrollToEnd({ animated: true }), 200);
                }}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => {
                    setApprovalTarget(null);
                    setSelectedStamp(null);
                    setApprovalMessage("");
                  }}
                >
                  <Text style={styles.modalCancelText}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalApprove}
                  onPress={handleApprove}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelCheckIcon size={14} /><Text style={styles.modalApproveText}>承認</Text></View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* === Task Form Modal === */}
      <Modal
        visible={taskFormVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTaskFormVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: palette.overlay }}>
          <ScrollView
            ref={taskFormScrollRef}
            contentContainerStyle={[
              styles.taskFormScrollContent,
              keyboardHeight > 0 && { paddingBottom: keyboardHeight },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle} adjustsFontSizeToFit numberOfLines={1}>
                {editingTask ? "クエスト編集" : "新しいクエスト"}
              </Text>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelCrossedSwordsIcon size={16} /><Text style={styles.formLabel}>クエスト名</Text></View>
              <TextInput
                style={styles.formInput}
                value={taskForm.title}
                onChangeText={(t) => setTaskForm({ ...taskForm, title: t })}
                placeholder="おふろそうじ、しゅくだい など"
              />

              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelScrollIcon size={16} /><Text style={styles.formLabel}>説明（なくてもOK）</Text></View>
              <TextInput
                style={styles.formInput}
                value={taskForm.description}
                onChangeText={(t) =>
                  setTaskForm({ ...taskForm, description: t })
                }
                placeholder="くわしいやりかた"
              />

              {/* ★とくべつクエスト トグル */}
              <TouchableOpacity
                style={[
                  styles.specialToggle,
                  taskForm.is_special && styles.specialToggleActive,
                ]}
                onPress={() => {
                  const next = !taskForm.is_special;
                  setTaskForm({
                    ...taskForm,
                    is_special: next,
                    reward_amount: next && parseInt(taskForm.reward_amount) < 50
                      ? "50"
                      : taskForm.reward_amount,
                  });
                }}
              >
                <Text style={[
                  styles.specialToggleText,
                  taskForm.is_special && styles.specialToggleTextActive,
                ]}>
                  {taskForm.is_special ? "★ 特別クエスト ON" : "★ 特別クエストにする"}
                </Text>
              </TouchableOpacity>

              {/* 特別クエスト: 難易度 */}
              {taskForm.is_special && (
                <>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelStarIcon size={16} /><Text style={styles.formLabel}>難易度</Text></View>
                  <View style={styles.recurrenceRow}>
                    {[1, 2, 3].map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[
                          styles.difficultyBtn,
                          taskForm.special_difficulty === d && styles.difficultyActive,
                        ]}
                        onPress={() => setTaskForm({ ...taskForm, special_difficulty: d })}
                      >
                        <Text style={[
                          styles.difficultyText,
                          taskForm.special_difficulty === d && styles.difficultyTextActive,
                        ]}>
                          {"★".repeat(d)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.dateRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelCalendarIcon size={16} /><Text style={styles.formLabel}>期間（開始）</Text></View>
                    <Text style={styles.dateHint}>なしでOK</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowStartDatePicker(!showStartDatePicker)}
                  >
                    <Text style={styles.datePickerText}>
                      {taskForm.start_date
                        ? taskForm.start_date
                        : "タップして選ぶ"}
                    </Text>
                    {taskForm.start_date ? (
                      <TouchableOpacity
                        onPress={() => { setTaskForm({ ...taskForm, start_date: "" }); setShowStartDatePicker(false); }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.dateClearText}>✕</Text>
                      </TouchableOpacity>
                    ) : null}
                  </TouchableOpacity>
                  {showStartDatePicker && (
                    <DateTimePicker
                      value={taskForm.start_date ? new Date(taskForm.start_date) : new Date()}
                      mode="date"
                      display="spinner"
                      locale="ja-JP"
                      onChange={(_event, selectedDate) => {
                        if (Platform.OS !== "ios") setShowStartDatePicker(false);
                        if (selectedDate) {
                          const dateStr = selectedDate.toISOString().split("T")[0];
                          setTaskForm({ ...taskForm, start_date: dateStr });
                        }
                      }}
                    />
                  )}

                  <View style={styles.dateRow}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelCalendarIcon size={16} /><Text style={styles.formLabel}>期間（終わり）</Text></View>
                    <Text style={styles.dateHint}>期限なしならなしでOK</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowEndDatePicker(!showEndDatePicker)}
                  >
                    <Text style={styles.datePickerText}>
                      {taskForm.end_date
                        ? taskForm.end_date
                        : "タップして選ぶ"}
                    </Text>
                    {taskForm.end_date ? (
                      <TouchableOpacity
                        onPress={() => { setTaskForm({ ...taskForm, end_date: "" }); setShowEndDatePicker(false); }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.dateClearText}>✕</Text>
                      </TouchableOpacity>
                    ) : null}
                  </TouchableOpacity>
                  {showEndDatePicker && (
                    <DateTimePicker
                      value={taskForm.end_date ? new Date(taskForm.end_date) : new Date()}
                      mode="date"
                      display="spinner"
                      locale="ja-JP"
                      minimumDate={taskForm.start_date ? new Date(taskForm.start_date) : undefined}
                      onChange={(_event, selectedDate) => {
                        if (Platform.OS !== "ios") setShowEndDatePicker(false);
                        if (selectedDate) {
                          const dateStr = selectedDate.toISOString().split("T")[0];
                          setTaskForm({ ...taskForm, end_date: dateStr });
                        }
                      }}
                    />
                  )}
                </>
              )}

              <Text style={styles.formLabel} adjustsFontSizeToFit numberOfLines={1}>
                🪙 報酬（円）{taskForm.is_special ? " ※50円〜" : ""}
              </Text>
              <TextInput
                style={styles.formInput}
                value={taskForm.reward_amount}
                onChangeText={(t) =>
                  setTaskForm({ ...taskForm, reward_amount: t })
                }
                keyboardType="number-pad"
              />

              {editingTask && parseInt(taskForm.reward_amount) !== editingTask.reward_amount && (
                <>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    {parseInt(taskForm.reward_amount) < editingTask.reward_amount
                      ? <PixelWarningIcon size={16} />
                      : <PixelChatIcon size={16} />}
                    <Text style={styles.formLabel}>
                      {parseInt(taskForm.reward_amount) < editingTask.reward_amount
                        ? "値下げの理由（必須）"
                        : "金額変更のコメント"}
                    </Text>
                  </View>
                  <TextInput
                    style={styles.formInput}
                    value={taskForm.price_change_comment}
                    onChangeText={(t) =>
                      setTaskForm({ ...taskForm, price_change_comment: t })
                    }
                    placeholder="子どもに伝えるメッセージ"
                    multiline
                  />
                </>
              )}

              {!taskForm.is_special && (
                <>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelRefreshIcon size={16} /><Text style={styles.formLabel}>繰り返し</Text></View>
                  <View style={styles.recurrenceRow}>
                    {(["once", "daily", "weekly"] as const).map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[
                          styles.recurrenceBtn,
                          taskForm.recurrence === r && styles.recurrenceActive,
                        ]}
                        onPress={() => setTaskForm({ ...taskForm, recurrence: r })}
                      >
                        <Text
                          style={[
                            styles.recurrenceText,
                            taskForm.recurrence === r &&
                              styles.recurrenceTextActive,
                          ]}
                        >
                          {r === "once"
                            ? "1回"
                            : r === "daily"
                              ? "毎日"
                              : "毎週"}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelPersonIcon size={16} /><Text style={styles.formLabel}>誰に？</Text></View>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  const options = [
                    { text: "全員", onPress: () => setTaskForm({ ...taskForm, assigned_child_id: "" }) },
                    ...children.map((c) => ({
                      text: c.name,
                      onPress: () => setTaskForm({ ...taskForm, assigned_child_id: c.id }),
                    })),
                  ];
                  alert("誰に？", "クエストの対象を選んでください", [
                    ...options,
                    { text: "キャンセル", style: "cancel" as const },
                  ]);
                }}
              >
                <Text style={styles.dropdownText}>
                  {taskForm.assigned_child_id
                    ? children.find((c) => c.id === taskForm.assigned_child_id)?.name || "?"
                    : "全員"}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancel}
                  onPress={() => setTaskFormVisible(false)}
                >
                  <Text style={styles.modalCancelText}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalApprove}
                  onPress={handleSaveTask}
                >
                  <Text style={styles.modalApproveText}>
                    {editingTask ? "保存" : "作成"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
      {/* ファミリースタンプ送信モーダル */}
      {familyId && (
        <FamilyStampSendModal
          visible={stampSendVisible}
          senderId={userId}
          familyId={familyId}
          familyMembers={allMembers}
          onClose={() => setStampSendVisible(false)}
          onSent={() => {
            setStampSendVisible(false);
            loadData();
          }}
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
  container: { flex: 1, backgroundColor: p.surfaceMuted },
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
  headerTitle: { fontSize: 18, fontWeight: "bold", color: p.primaryDark, flex: 1 },
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
  section: { padding: 12 },

  // Tabs
  tabRow: {
    flexDirection: "row",
    backgroundColor: p.surfaceMuted,
    margin: 12,
    marginBottom: 0,
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
  tabText: { fontSize: 12, color: p.textMuted },
  tabTextActive: { color: p.textStrong, fontWeight: "bold" },
  badge: {
    backgroundColor: p.red,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 5,
  },
  badgeText: {
    color: p.white,
    fontSize: 11,
    fontWeight: "bold" as const,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: p.textStrong,
    marginBottom: 8,
  },

  // Approval cards
  approvalCard: {
    backgroundColor: p.surface,
    borderWidth: 1,
    borderColor: p.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: p.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  approvalInfo: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  approvalIcon: { marginRight: 10, width: 32, alignItems: "center" as const, justifyContent: "center" as const },
  approvalTitle: { fontSize: 15, fontWeight: "bold", color: p.textStrong },
  approvalSub: { fontSize: 13, color: p.textMuted, marginTop: 2 },
  approvalActions: { flexDirection: "row", gap: 8 },
  approveButton: {
    flex: 1,
    backgroundColor: p.primary,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  approveText: { color: p.white, fontWeight: "bold", fontSize: 14 },
  rejectButton: {
    flex: 1,
    backgroundColor: p.surfaceMuted,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  rejectText: { color: p.textMuted, fontWeight: "bold", fontSize: 14 },

  // Special quest
  // 特別クエスト設定パネル
  settingsPanel: {
    backgroundColor: p.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: p.goldBorder,
  },
  settingsPanelTitle: {
    fontSize: rf(15),
    fontWeight: "bold",
    color: p.goldText,
    marginBottom: 12,
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  settingsLabel: {
    fontSize: rf(14),
    color: p.textStrong,
  },
  specialLabel: {
    fontSize: 15,
    fontWeight: "bold" as const,
    color: p.gold,
    marginBottom: 6,
    marginTop: 4,
  },
  specialTaskCard: {
    backgroundColor: p.goldLight,
    borderWidth: 1,
    borderColor: p.goldBorder,
  },
  specialToggle: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: p.border,
    borderStyle: "dashed" as const,
    alignItems: "center" as const,
    marginBottom: 4,
  },
  specialToggleActive: {
    backgroundColor: p.goldLight,
    borderColor: p.goldBorder,
    borderStyle: "solid" as const,
  },
  specialToggleText: {
    fontSize: 14,
    color: p.textMuted,
    fontWeight: "bold" as const,
  },
  specialToggleTextActive: {
    color: p.goldText,
  },
  difficultyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: p.surfaceMuted,
  },
  difficultyActive: {
    backgroundColor: p.goldLight,
    borderWidth: 1,
    borderColor: p.goldBorder,
  },
  difficultyText: {
    fontSize: 16,
    color: p.textMuted,
  },
  difficultyTextActive: {
    color: p.gold,
  },

  // Task cards
  addButton: {
    backgroundColor: p.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
    minHeight: 48,
    justifyContent: "center" as const,
  },
  addButtonText: { color: p.white, fontWeight: "bold", fontSize: 16 },
  taskCard: {
    backgroundColor: p.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: p.border,
  },
  taskInactive: { opacity: 0.5 },
  taskInfo: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  taskIcon: { width: 32, marginRight: 10, alignItems: "center" as const, justifyContent: "center" as const },
  taskTitle: { fontSize: 15, fontWeight: "bold", color: p.textStrong },
  taskSubRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 } as const,
  taskRewardTap: { fontSize: 13, color: p.primary, fontWeight: "600" },
  taskSub: { fontSize: 13, color: p.textMuted },
  taskActions: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
  taskActionBtn: { padding: 10, minWidth: 44, minHeight: 44, alignItems: "center" as const, justifyContent: "center" as const },

  // Children cards
  childCard: {
    backgroundColor: p.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: p.borderStrong,
    shadowColor: p.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  childName: {
    fontSize: 18,
    fontWeight: "bold",
    color: p.textStrong,
    marginBottom: 4,
  },
  childTotal: {
    fontSize: 24,
    fontWeight: "bold",
    color: p.primaryDark,
    marginBottom: 12,
  },
  walletRow: { flexDirection: "row", gap: 8 },
  walletItem: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  walletLabel: { fontSize: 12, color: p.textMuted, marginBottom: 2 },
  walletAmount: { fontSize: 16, fontWeight: "bold" },
  ratioText: {
    fontSize: 12,
    color: p.textMuted,
    marginTop: 10,
    textAlign: "center",
  },

  emptyText: {
    textAlign: "center",
    color: p.textMuted,
    fontSize: 14,
    paddingVertical: 40,
  },
  emptyCard: {
    alignItems: "center" as const,
    backgroundColor: p.surface,
    borderRadius: 12,
    padding: 32,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: p.border,
    shadowColor: p.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyCardText: {
    textAlign: "center" as const,
    color: p.textStrong,
    fontSize: 15,
    fontWeight: "bold" as const,
  },
  emptyCardSub: {
    textAlign: "center" as const,
    color: p.textMuted,
    fontSize: 12,
    marginTop: 4,
  },

  // Modal
  modalOverlay: {
    flexGrow: 1,
    backgroundColor: p.overlay,
    justifyContent: "center",
    padding: 20,
  },
  taskFormScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: p.white,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: rf(18),
    fontWeight: "bold",
    color: p.textStrong,
    textAlign: "center",
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 14,
    color: p.textMuted,
    textAlign: "center",
    marginBottom: 4,
  },
  modalReward: {
    fontSize: 18,
    fontWeight: "bold",
    color: p.accent,
    textAlign: "center",
    marginBottom: 16,
  },
  stampLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: p.textStrong,
    marginBottom: 8,
  },
  stampGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  stampItem: {
    width: "22%",
    alignItems: "center",
    padding: 8,
    borderRadius: 10,
    backgroundColor: p.surfaceMuted,
  },
  stampSelected: {
    backgroundColor: p.accentLight,
    borderWidth: 2,
    borderColor: p.accent,
  },
  stampEmoji: { fontSize: 28 },
  stampText: { fontSize: 9, color: p.textMuted, marginTop: 2 },
  messageInput: {
    borderWidth: 1,
    borderColor: p.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
    backgroundColor: p.surfaceMuted,
  },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: p.surfaceMuted,
    alignItems: "center",
  },
  modalCancelText: { color: p.textMuted, fontWeight: "bold" },
  modalApprove: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: p.primary,
    alignItems: "center",
  },
  modalApproveText: { color: p.white, fontWeight: "bold" },

  // Task form
  formLabel: {
    fontSize: rf(14),
    fontWeight: "bold",
    color: p.textStrong,
    marginTop: 12,
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1,
    borderColor: p.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    backgroundColor: p.surfaceMuted,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: p.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: p.surfaceMuted,
  },
  datePickerText: {
    fontSize: 14,
    color: p.textStrong,
    flex: 1,
  },
  dateClearText: {
    fontSize: 16,
    color: p.textMuted,
    paddingLeft: 8,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: p.border,
    borderRadius: 10,
    padding: 14,
    backgroundColor: p.surfaceMuted,
    marginBottom: 12,
  } as const,
  dropdownText: { fontSize: 15, color: p.textStrong, fontWeight: "600" },
  dropdownArrow: { fontSize: 12, color: p.textMuted },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  } as const,
  dateHint: {
    fontSize: 11,
    color: p.textMuted,
  },
  recurrenceRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 4,
  },
  recurrenceBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: p.surfaceMuted,
  },
  recurrenceActive: {
    backgroundColor: p.primary,
  },
  recurrenceText: { fontSize: 13, color: p.textMuted },
  recurrenceTextActive: { color: p.white, fontWeight: "bold" },

  // 共通ユーティリティ
  flex1: { flex: 1 },
  rowAround: { flexDirection: "row", justifyContent: "space-around" } as const,
  colCenter: { alignItems: "center" } as const,
  loadingEmoji: { fontSize: 48, marginBottom: 12 },
  emptyEmoji: { fontSize: 48, marginBottom: 8 },
  loadingText: { color: p.textMuted, marginTop: 12, fontSize: 14 },
  headerRow: { flexDirection: "row", alignItems: "flex-end", flex: 1 } as const,
  headerEmoji: { fontSize: 18 },
  headerBadgeRow: { flexDirection: "row", alignItems: "center", gap: 4 } as const,
  weeklySummaryTitle: { fontSize: rf(13), fontWeight: "bold", color: p.textStrong, marginBottom: 8 } as const,
  weeklyStatValue: { fontSize: rf(22), fontWeight: "bold", color: p.accent } as const,
  weeklyStatLabel: { fontSize: rf(11), color: p.textMuted },
  subText: { fontSize: 12, color: p.primaryDark, marginTop: 2 },
  pendingText: { fontSize: 11, color: p.textMuted, marginTop: 2 },
  recentAmount: { fontSize: 13, marginTop: 4 },
  actionRow: { flexDirection: "row", gap: 8, marginBottom: 12 } as const,
  bottomSpacer: { height: 40 },
  stampRelayBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center" as const,
    marginTop: 10,
    borderWidth: 2,
    minHeight: 52,
    justifyContent: "center" as const,
  },
  stampRelayBtnText: {
    fontSize: 16,
    fontWeight: "bold" as const,
  },
  });
}
