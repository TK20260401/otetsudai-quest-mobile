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
  TextInput,
  Modal,
  Platform,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "../lib/supabase";
import { getSession, clearSession } from "../lib/session";
import { colors } from "../lib/colors";
import { rf } from "../lib/responsive";
import { getTaskIcon } from "../lib/task-icons";
import { STAMPS } from "../lib/stamps";
import { getChildStampById } from "../lib/child-stamps";
import { useKeyboardHeight } from "../lib/useKeyboardHeight";
import type { Task, TaskLog, User, Wallet, SpendRequest, FamilySettings } from "../lib/types";

type PendingLog = TaskLog & { task: Task; child: User };

export default function ParentDashboardScreen({
  navigation,
}: {
  navigation: any;
}) {
  const [familyId, setFamilyId] = useState("");
  const [userId, setUserId] = useState("");
  const [children, setChildren] = useState<User[]>([]);
  const [wallets, setWallets] = useState<Record<string, Wallet>>({});
  const [pendingLogs, setPendingLogs] = useState<PendingLog[]>([]);
  const [pendingSpends, setPendingSpends] = useState<SpendRequest[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [priceRequests, setPriceRequests] = useState<Task[]>([]);
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

  // Date picker
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // 特別クエスト設定
  const [familySettings, setFamilySettings] = useState<FamilySettings | null>(null);

  const loadData = useCallback(async () => {
    const session = await getSession();
    if (!session) {
      setLoading(false);
      return;
    }
    setUserId(session.userId);
    const isAdmin = session.role === "admin";

    // Admin: get all children. Parent: get children in own family.
    let childQuery = supabase
      .from("otetsudai_users")
      .select("*")
      .eq("role", "child");
    if (!isAdmin && session.familyId) {
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
    if (familyIds.length > 0) setFamilyId(familyIds[0]);

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
    setPriceRequests(allTasks.filter((t: Task) => t.proposal_status === "pending" && t.proposed_reward));

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

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      "もう少し丁寧に",
      "最後までやろう",
      "時間をかけてね",
    ];
    Alert.alert("やり直し", "理由を選んでね", [
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
      Alert.alert("エラー", "残高が足りません");
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
      Alert.alert("エラー", "クエスト名を入れてください");
      return;
    }
    const newAmount = parseInt(taskForm.reward_amount) || 10;
    if (taskForm.is_special && newAmount < 50) {
      Alert.alert("エラー", "★特別クエストの報酬は50円以上にしてください");
      return;
    }

    // 値下げ時はコメント必須
    if (editingTask && newAmount < editingTask.reward_amount && !taskForm.price_change_comment.trim()) {
      Alert.alert("⚠️ コメント必須", "報酬を下げるときは、理由を入れてください");
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
        Alert.alert("エラー", `更新失敗: ${error.message}`);
        return;
      }
    } else {
      const { error } = await supabase.from("otetsudai_tasks").insert(payload);
      if (error) {
        Alert.alert("エラー", `作成失敗: ${error.message}`);
        return;
      }
    }
    setTaskFormVisible(false);
    await loadData();
  }

  async function handleDeleteTask(taskId: string) {
    Alert.alert("削除", "このクエストを削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
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
    Alert.alert("✅ 承認", `${task.title}の報酬を${task.proposed_reward}円にしました`);
    await loadData();
  }

  async function handleRejectPriceRequest(task: Task) {
    Alert.prompt(
      "❌ 却下",
      "理由を入れてください",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "却下",
          style: "destructive",
          onPress: async (reason?: string) => {
            await supabase
              .from("otetsudai_tasks")
              .update({
                proposal_status: "rejected",
                proposed_reward: null,
                price_change_comment: reason || "今の金額で頑張ろう！",
              })
              .eq("id", task.id);
            await loadData();
          },
        },
      ],
      "plain-text",
      "",
      "default"
    );
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

  const pendingCount = pendingLogs.length + pendingSpends.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          👨‍👩‍👧‍👦 親
        </Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>← 戻る</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabButton, tab === "approve" && styles.tabActive]}
          onPress={() => setTab("approve")}
        >
          <Text
            style={[styles.tabText, tab === "approve" && styles.tabTextActive]}
          >
            承認{pendingCount > 0 ? ` (${pendingCount})` : ""}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === "tasks" && styles.tabActive]}
          onPress={() => setTab("tasks")}
        >
          <Text
            style={[styles.tabText, tab === "tasks" && styles.tabTextActive]}
          >
            クエスト
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, tab === "children" && styles.tabActive]}
          onPress={() => setTab("children")}
        >
          <Text
            style={[
              styles.tabText,
              tab === "children" && styles.tabTextActive,
            ]}
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
        {/* === Approve Tab === */}
        {tab === "approve" && (
          <View style={styles.section}>
            {/* Quest completions */}
            {pendingLogs.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  ⏳ クエスト完了 ({pendingLogs.length})
                </Text>
                {pendingLogs.map((log) => (
                  <View key={log.id} style={styles.approvalCard}>
                    <View style={styles.approvalInfo}>
                      <Text style={styles.approvalIcon}>
                        {getTaskIcon(log.task?.title || "")}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.approvalTitle}>
                          {log.task?.title}
                        </Text>
                        <Text style={styles.approvalSub}>
                          🧒 {(log.child as any)?.name} ・ 💰{" "}
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
                  </View>
                ))}
              </>
            )}

            {/* Spend requests */}
            {pendingSpends.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                  🛒 使いたいリクエスト ({pendingSpends.length})
                </Text>
                {pendingSpends.map((req) => (
                  <View key={req.id} style={styles.approvalCard}>
                    <View style={styles.approvalInfo}>
                      <Text style={styles.approvalIcon}>🛒</Text>
                      <View style={{ flex: 1 }}>
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
                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
                  💰 値上げリクエスト ({priceRequests.length})
                </Text>
                {priceRequests.map((task) => (
                  <View key={task.id} style={styles.approvalCard}>
                    <View style={styles.approvalInfo}>
                      <Text style={styles.approvalIcon}>
                        {getTaskIcon(task.title)}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.approvalTitle}>{task.title}</Text>
                        <Text style={styles.approvalSub}>
                          {task.reward_amount}円 → {task.proposed_reward}円
                        </Text>
                        {task.proposal_message && (
                          <Text style={{ fontSize: 12, color: "#047857", marginTop: 2 }}>
                            💬 「{task.proposal_message}」
                          </Text>
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
                  </View>
                ))}
              </>
            )}

            {pendingCount === 0 && priceRequests.length === 0 && (
              <Text style={styles.emptyText}>
                承認待ちはありません
              </Text>
            )}

            {/* 最近の承認（子ども返信表示） */}
            {recentApproved.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
                  ✅ 最近の承認
                </Text>
                {recentApproved.map((log: any) => {
                  const childStamp = log.child_reaction_stamp
                    ? getChildStampById(log.child_reaction_stamp)
                    : null;
                  const hasReaction = !!log.child_reaction_at;
                  return (
                    <View key={log.id} style={[styles.approvalCard, { opacity: 1 }]}>
                      <View style={styles.approvalInfo}>
                        <Text style={styles.approvalIcon}>
                          {hasReaction ? "✅" : "⏳"}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.approvalTitle}>
                            {log.task?.title}
                          </Text>
                          <Text style={styles.approvalSub}>
                            🧒 {log.child?.name} ・ 💰 {log.task?.reward_amount}円
                          </Text>
                          {childStamp && (
                            <Text style={{ fontSize: 13, marginTop: 4 }}>
                              {childStamp.emoji} {childStamp.label}
                            </Text>
                          )}
                          {log.child_reaction_message && (
                            <Text style={{ fontSize: 12, color: colors.primaryDark, marginTop: 2 }}>
                              💬 「{log.child_reaction_message}」
                            </Text>
                          )}
                          {!hasReaction && (
                            <Text style={{ fontSize: 11, color: colors.gray, marginTop: 2 }}>
                              ⏳ 子どもの返事待ち
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
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
                    trackColor={{ false: "#d1d5db", true: "#6ee7b7" }}
                    thumbColor={familySettings.special_quest_enabled ? colors.primary : "#f4f3f4"}
                  />
                </View>
                <View style={[styles.settingsRow, !familySettings.special_quest_enabled && { opacity: 0.4 }]}>
                  <Text style={styles.settingsLabel}>★ 簡単</Text>
                  <Switch
                    value={familySettings.special_quest_star1_enabled}
                    onValueChange={(v) => updateFamilySettings({ special_quest_star1_enabled: v })}
                    disabled={!familySettings.special_quest_enabled}
                    trackColor={{ false: "#d1d5db", true: "#6ee7b7" }}
                    thumbColor={familySettings.special_quest_star1_enabled ? colors.primary : "#f4f3f4"}
                  />
                </View>
                <View style={[styles.settingsRow, !familySettings.special_quest_enabled && { opacity: 0.4 }]}>
                  <Text style={styles.settingsLabel}>★★ 普通</Text>
                  <Switch
                    value={familySettings.special_quest_star2_enabled}
                    onValueChange={(v) => updateFamilySettings({ special_quest_star2_enabled: v })}
                    disabled={!familySettings.special_quest_enabled}
                    trackColor={{ false: "#d1d5db", true: "#6ee7b7" }}
                    thumbColor={familySettings.special_quest_star2_enabled ? colors.primary : "#f4f3f4"}
                  />
                </View>
                <View style={[styles.settingsRow, !familySettings.special_quest_enabled && { opacity: 0.4 }]}>
                  <Text style={styles.settingsLabel}>★★★ 難しい</Text>
                  <Switch
                    value={familySettings.special_quest_star3_enabled}
                    onValueChange={(v) => updateFamilySettings({ special_quest_star3_enabled: v })}
                    disabled={!familySettings.special_quest_enabled}
                    trackColor={{ false: "#d1d5db", true: "#6ee7b7" }}
                    thumbColor={familySettings.special_quest_star3_enabled ? colors.primary : "#f4f3f4"}
                  />
                </View>
              </View>
            )}

            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              <TouchableOpacity
                style={[styles.addButton, { flex: 1, marginBottom: 0 }]}
                onPress={() => openTaskForm()}
              >
                <Text style={styles.addButtonText}>+ クエスト</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addButton, { flex: 1, marginBottom: 0, backgroundColor: "#d97706" }]}
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
                      style={[
                        styles.taskCard,
                        styles.specialTaskCard,
                        (!task.is_active || starDisabled) && styles.taskInactive,
                      ]}
                    >
                      <View style={styles.taskInfo}>
                        <Text style={styles.taskIcon}>
                          {getTaskIcon(task.title)}
                        </Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.taskTitle, { color: "#92400e" }]}>
                            {"★".repeat(task.special_difficulty || 1)} {task.title}
                          </Text>
                          <Text style={styles.taskSub}>
                            💰 {task.reward_amount}円
                            {task.end_date ? ` ・ 〜${new Date(task.end_date).toLocaleDateString("ja-JP")}` : ""}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.taskActions}>
                        <TouchableOpacity
                          style={styles.taskActionBtn}
                          onPress={() => openTaskForm(task)}
                        >
                          <Text>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.taskActionBtn}
                          onPress={() => handleToggleTask(task)}
                        >
                          <Text>{task.is_active ? "⏸️" : "▶️"}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.taskActionBtn}
                          onPress={() => handleDeleteTask(task.id)}
                        >
                          <Text>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </>
            )}

            {/* 通常クエスト */}
            {tasks.filter((t) => !t.is_special).map((task) => (
              <View
                key={task.id}
                style={[
                  styles.taskCard,
                  !task.is_active && styles.taskInactive,
                ]}
              >
                <View style={styles.taskInfo}>
                  <Text style={styles.taskIcon}>
                    {getTaskIcon(task.title)}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskSub}>
                      💰 {task.reward_amount}円 ・{" "}
                      {task.recurrence === "daily"
                        ? "毎日"
                        : task.recurrence === "weekly"
                          ? "毎週"
                          : "1回"}
                    </Text>
                  </View>
                </View>
                <View style={styles.taskActions}>
                  <TouchableOpacity
                    style={styles.taskActionBtn}
                    onPress={() => openTaskForm(task)}
                  >
                    <Text>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.taskActionBtn}
                    onPress={() => handleToggleTask(task)}
                  >
                    <Text>{task.is_active ? "⏸️" : "▶️"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.taskActionBtn}
                    onPress={() => handleDeleteTask(task.id)}
                  >
                    <Text>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* === Children Tab === */}
        {tab === "children" && (
          <View style={styles.section}>
            {children.map((child) => {
              const w = wallets[child.id];
              const total = w
                ? w.spending_balance + w.saving_balance + w.invest_balance
                : 0;
              return (
                <View key={child.id} style={styles.childCard}>
                  <Text style={styles.childName}>🧒 {child.name}</Text>
                  <Text style={styles.childTotal}>
                    {total.toLocaleString()}円
                  </Text>
                  {w && (
                    <View style={styles.walletRow}>
                      <View
                        style={[
                          styles.walletItem,
                          { borderColor: colors.spend },
                        ]}
                      >
                        <Text style={styles.walletLabel}>使う</Text>
                        <Text
                          style={[
                            styles.walletAmount,
                            { color: colors.spend },
                          ]}
                        >
                          {w.spending_balance.toLocaleString()}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.walletItem,
                          { borderColor: colors.save },
                        ]}
                      >
                        <Text style={styles.walletLabel}>貯める</Text>
                        <Text
                          style={[
                            styles.walletAmount,
                            { color: colors.save },
                          ]}
                        >
                          {w.saving_balance.toLocaleString()}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.walletItem,
                          { borderColor: colors.invest },
                        ]}
                      >
                        <Text style={styles.walletLabel}>増やす</Text>
                        <Text
                          style={[
                            styles.walletAmount,
                            { color: colors.invest },
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
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* === Approval Modal === */}
      <Modal
        visible={!!approvalTarget}
        animationType="slide"
        transparent
        onRequestClose={() => setApprovalTarget(null)}
      >
        <View style={{ flex: 1 }}>
          <ScrollView
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
                💰 {approvalTarget?.task?.reward_amount}円
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
                  <Text style={styles.modalApproveText}>✓ 承認</Text>
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
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}>
          <ScrollView
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

              <Text style={styles.formLabel}>クエスト名</Text>
              <TextInput
                style={styles.formInput}
                value={taskForm.title}
                onChangeText={(t) => setTaskForm({ ...taskForm, title: t })}
                placeholder="おふろそうじ、しゅくだい など"
              />

              <Text style={styles.formLabel}>説明（なくてもOK）</Text>
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
                  <Text style={styles.formLabel}>難易度</Text>
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

                  <Text style={styles.formLabel}>期間（開始）</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Text style={styles.datePickerText}>
                      {taskForm.start_date
                        ? `📅 ${taskForm.start_date}`
                        : "📅 タップして選ぶ（今日からなら なしでOK）"}
                    </Text>
                    {taskForm.start_date ? (
                      <TouchableOpacity
                        onPress={() => setTaskForm({ ...taskForm, start_date: "" })}
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
                      display={Platform.OS === "ios" ? "inline" : "default"}
                      locale="ja-JP"
                      onChange={(_event, selectedDate) => {
                        setShowStartDatePicker(Platform.OS === "ios");
                        if (selectedDate) {
                          const dateStr = selectedDate.toISOString().split("T")[0];
                          setTaskForm({ ...taskForm, start_date: dateStr });
                        }
                      }}
                    />
                  )}

                  <Text style={styles.formLabel}>期間（終わり）</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text style={styles.datePickerText}>
                      {taskForm.end_date
                        ? `📅 ${taskForm.end_date}`
                        : "📅 タップして選ぶ（期限なしなら なしでOK）"}
                    </Text>
                    {taskForm.end_date ? (
                      <TouchableOpacity
                        onPress={() => setTaskForm({ ...taskForm, end_date: "" })}
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
                      display={Platform.OS === "ios" ? "inline" : "default"}
                      locale="ja-JP"
                      minimumDate={taskForm.start_date ? new Date(taskForm.start_date) : undefined}
                      onChange={(_event, selectedDate) => {
                        setShowEndDatePicker(Platform.OS === "ios");
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
                報酬（円）{taskForm.is_special ? " ※50円〜" : ""}
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
                  <Text style={styles.formLabel}>
                    {parseInt(taskForm.reward_amount) < editingTask.reward_amount
                      ? "⚠️ 値下げの理由（必須）"
                      : "💬 金額変更のコメント"}
                  </Text>
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
                  <Text style={styles.formLabel}>繰り返し</Text>
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

              <Text style={styles.formLabel}>誰に？</Text>
              <View style={styles.recurrenceRow}>
                <TouchableOpacity
                  style={[
                    styles.recurrenceBtn,
                    taskForm.assigned_child_id === "" &&
                      styles.recurrenceActive,
                  ]}
                  onPress={() =>
                    setTaskForm({ ...taskForm, assigned_child_id: "" })
                  }
                >
                  <Text
                    style={[
                      styles.recurrenceText,
                      taskForm.assigned_child_id === "" &&
                        styles.recurrenceTextActive,
                    ]}
                  >
                    全員
                  </Text>
                </TouchableOpacity>
                {children.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.recurrenceBtn,
                      taskForm.assigned_child_id === c.id &&
                        styles.recurrenceActive,
                    ]}
                    onPress={() =>
                      setTaskForm({ ...taskForm, assigned_child_id: c.id })
                    }
                  >
                    <Text
                      style={[
                        styles.recurrenceText,
                        taskForm.assigned_child_id === c.id &&
                          styles.recurrenceTextActive,
                      ]}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

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
  container: { flex: 1, backgroundColor: colors.slateLight },
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
  headerTitle: { fontSize: 18, fontWeight: "bold", color: colors.primaryDark, flex: 1 },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.grayLight,
  },
  logoutText: { fontSize: 14, color: colors.slate },
  scroll: { flex: 1 },
  section: { padding: 12 },

  // Tabs
  tabRow: {
    flexDirection: "row",
    backgroundColor: colors.grayLight,
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
  tabActive: { backgroundColor: colors.white },
  tabText: { fontSize: 13, color: colors.slate },
  tabTextActive: { color: colors.slateDark, fontWeight: "bold" },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.slateDark,
    marginBottom: 8,
  },

  // Approval cards
  approvalCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  approvalInfo: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  approvalIcon: { fontSize: 28, marginRight: 10 },
  approvalTitle: { fontSize: 15, fontWeight: "600", color: colors.slateDark },
  approvalSub: { fontSize: 13, color: colors.slate, marginTop: 2 },
  approvalActions: { flexDirection: "row", gap: 8 },
  approveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  approveText: { color: colors.white, fontWeight: "bold", fontSize: 14 },
  rejectButton: {
    flex: 1,
    backgroundColor: colors.grayLight,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  rejectText: { color: colors.slate, fontWeight: "bold", fontSize: 14 },

  // Special quest
  // 特別クエスト設定パネル
  settingsPanel: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  settingsPanelTitle: {
    fontSize: rf(15),
    fontWeight: "bold",
    color: "#92400e",
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
    color: colors.slateDark,
  },
  specialLabel: {
    fontSize: 15,
    fontWeight: "bold" as const,
    color: "#d97706",
    marginBottom: 6,
    marginTop: 4,
  },
  specialTaskCard: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  specialToggle: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed" as const,
    alignItems: "center" as const,
    marginBottom: 4,
  },
  specialToggleActive: {
    backgroundColor: "#fef3c7",
    borderColor: "#f59e0b",
    borderStyle: "solid" as const,
  },
  specialToggleText: {
    fontSize: 14,
    color: colors.slate,
    fontWeight: "600" as const,
  },
  specialToggleTextActive: {
    color: "#92400e",
  },
  difficultyBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.grayLight,
  },
  difficultyActive: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  difficultyText: {
    fontSize: 16,
    color: colors.gray,
  },
  difficultyTextActive: {
    color: "#d97706",
  },

  // Task cards
  addButton: {
    backgroundColor: colors.amber,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  addButtonText: { color: colors.white, fontWeight: "bold", fontSize: 16 },
  taskCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  taskInactive: { opacity: 0.5 },
  taskInfo: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  taskIcon: { fontSize: 28, marginRight: 10 },
  taskTitle: { fontSize: 15, fontWeight: "600", color: colors.slateDark },
  taskSub: { fontSize: 13, color: colors.slate, marginTop: 2 },
  taskActions: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
  taskActionBtn: { padding: 6 },

  // Children cards
  childCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  childName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.slateDark,
    marginBottom: 4,
  },
  childTotal: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primaryDark,
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
  walletLabel: { fontSize: 12, color: colors.slate, marginBottom: 2 },
  walletAmount: { fontSize: 16, fontWeight: "bold" },
  ratioText: {
    fontSize: 12,
    color: colors.gray,
    marginTop: 10,
    textAlign: "center",
  },

  emptyText: {
    textAlign: "center",
    color: colors.slate,
    fontSize: 14,
    paddingVertical: 40,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  taskFormScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: rf(18),
    fontWeight: "bold",
    color: colors.slateDark,
    textAlign: "center",
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 14,
    color: colors.slate,
    textAlign: "center",
    marginBottom: 4,
  },
  modalReward: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.amber,
    textAlign: "center",
    marginBottom: 16,
  },
  stampLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.slateDark,
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
    backgroundColor: colors.grayLight,
  },
  stampSelected: {
    backgroundColor: colors.amberLight,
    borderWidth: 2,
    borderColor: colors.amber,
  },
  stampEmoji: { fontSize: 28 },
  stampText: { fontSize: 9, color: colors.slate, marginTop: 2 },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.grayLight,
    alignItems: "center",
  },
  modalCancelText: { color: colors.slate, fontWeight: "bold" },
  modalApprove: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  modalApproveText: { color: colors.white, fontWeight: "bold" },

  // Task form
  formLabel: {
    fontSize: rf(14),
    fontWeight: "600",
    color: colors.slateDark,
    marginTop: 12,
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    backgroundColor: colors.grayLight,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.grayLight,
  },
  datePickerText: {
    fontSize: 14,
    color: colors.slateDark,
    flex: 1,
  },
  dateClearText: {
    fontSize: 16,
    color: colors.slate,
    paddingLeft: 8,
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
    backgroundColor: colors.grayLight,
  },
  recurrenceActive: {
    backgroundColor: colors.primary,
  },
  recurrenceText: { fontSize: 13, color: colors.slate },
  recurrenceTextActive: { color: colors.white, fontWeight: "bold" },
});
