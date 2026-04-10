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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { getSession, clearSession } from "../lib/session";
import { colors } from "../lib/colors";
import { getTaskIcon } from "../lib/task-icons";
import { STAMPS } from "../lib/stamps";
import type { Task, TaskLog, User, Wallet, SpendRequest } from "../lib/types";

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
    reward_amount: "100",
    recurrence: "once" as "once" | "daily" | "weekly",
    assigned_child_id: "",
  });

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
    setTasks(taskRes.data || []);
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
      "🔄 やりなおし",
      "もうすこし ていねいに",
      "さいごまで やろう",
      "じかんを かけてね",
    ];
    Alert.alert("やりなおし", "りゆうをえらんでね", [
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
      Alert.alert("エラー", "ざんだかがたりません");
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
  function openTaskForm(task?: Task) {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title,
        description: task.description || "",
        reward_amount: String(task.reward_amount),
        recurrence: task.recurrence,
        assigned_child_id: task.assigned_child_id || "",
      });
    } else {
      setEditingTask(null);
      setTaskForm({
        title: "",
        description: "",
        reward_amount: "100",
        recurrence: "once",
        assigned_child_id: "",
      });
    }
    setTaskFormVisible(true);
  }

  async function handleSaveTask() {
    if (!taskForm.title) {
      Alert.alert("エラー", "クエストめいをいれてください");
      return;
    }
    const payload = {
      family_id: familyId,
      title: taskForm.title,
      description: taskForm.description || null,
      reward_amount: parseInt(taskForm.reward_amount) || 100,
      recurrence: taskForm.recurrence,
      assigned_child_id: taskForm.assigned_child_id || null,
      is_active: true,
      created_by: userId,
    };

    if (editingTask) {
      await supabase
        .from("otetsudai_tasks")
        .update(payload)
        .eq("id", editingTask.id);
    } else {
      await supabase.from("otetsudai_tasks").insert(payload);
    }
    setTaskFormVisible(false);
    await loadData();
  }

  async function handleDeleteTask(taskId: string) {
    Alert.alert("さくじょ", "このクエストをさくじょしますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "さくじょ",
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
          👨‍👩‍👧‍👦 おや
        </Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>← もどる</Text>
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
            しょうにん{pendingCount > 0 ? ` (${pendingCount})` : ""}
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
            こども
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
                  ⏳ クエスト かんりょう ({pendingLogs.length})
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
                          {log.task?.reward_amount}えん
                        </Text>
                      </View>
                    </View>
                    <View style={styles.approvalActions}>
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => setApprovalTarget(log)}
                      >
                        <Text style={styles.approveText}>しょうにん</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleReject(log.id)}
                      >
                        <Text style={styles.rejectText}>やりなおし</Text>
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
                  🛒 つかいたい リクエスト ({pendingSpends.length})
                </Text>
                {pendingSpends.map((req) => (
                  <View key={req.id} style={styles.approvalCard}>
                    <View style={styles.approvalInfo}>
                      <Text style={styles.approvalIcon}>🛒</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.approvalTitle}>{req.purpose}</Text>
                        <Text style={styles.approvalSub}>
                          🧒 {(req.child as any)?.name} ・ {req.amount}えん
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

            {pendingCount === 0 && (
              <Text style={styles.emptyText}>
                しょうにんまちはありません
              </Text>
            )}
          </View>
        )}

        {/* === Tasks Tab === */}
        {tab === "tasks" && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => openTaskForm()}
            >
              <Text style={styles.addButtonText}>+ あたらしいクエスト</Text>
            </TouchableOpacity>
            {tasks.map((task) => (
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
                      💰 {task.reward_amount}えん ・{" "}
                      {task.recurrence === "daily"
                        ? "まいにち"
                        : task.recurrence === "weekly"
                          ? "まいしゅう"
                          : "1かい"}
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
                    {total.toLocaleString()}えん
                  </Text>
                  {w && (
                    <View style={styles.walletRow}>
                      <View
                        style={[
                          styles.walletItem,
                          { borderColor: colors.spend },
                        ]}
                      >
                        <Text style={styles.walletLabel}>つかう</Text>
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
                        <Text style={styles.walletLabel}>ためる</Text>
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
                        <Text style={styles.walletLabel}>ふやす</Text>
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
                      わりあい: つかう{" "}
                      {100 - (w.save_ratio ?? 0) - (w.invest_ratio ?? 0)}% /
                      ためる {w.save_ratio ?? 0}% / ふやす{" "}
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
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.modalOverlay}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>しょうにん</Text>
              <Text style={styles.modalSub}>
                {(approvalTarget?.child as any)?.name} -{" "}
                {approvalTarget?.task?.title}
              </Text>
              <Text style={styles.modalReward}>
                💰 {approvalTarget?.task?.reward_amount}えん
              </Text>

              {/* Stamps */}
              <Text style={styles.stampLabel}>スタンプをえらんでね</Text>
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
                placeholder="ひとこと メッセージ（なくてもOK）"
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
                  <Text style={styles.modalApproveText}>✓ しょうにん</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* === Task Form Modal === */}
      <Modal
        visible={taskFormVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTaskFormVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={styles.modalOverlay}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingTask ? "クエストへんしゅう" : "あたらしいクエスト"}
              </Text>

              <Text style={styles.formLabel}>クエストめい</Text>
              <TextInput
                style={styles.formInput}
                value={taskForm.title}
                onChangeText={(t) => setTaskForm({ ...taskForm, title: t })}
                placeholder="おふろそうじ、しゅくだい など"
              />

              <Text style={styles.formLabel}>せつめい（なくてもOK）</Text>
              <TextInput
                style={styles.formInput}
                value={taskForm.description}
                onChangeText={(t) =>
                  setTaskForm({ ...taskForm, description: t })
                }
                placeholder="くわしいやりかた"
              />

              <Text style={styles.formLabel}>ほうしゅう（えん）</Text>
              <TextInput
                style={styles.formInput}
                value={taskForm.reward_amount}
                onChangeText={(t) =>
                  setTaskForm({ ...taskForm, reward_amount: t })
                }
                keyboardType="number-pad"
              />

              <Text style={styles.formLabel}>くりかえし</Text>
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
                        ? "1かい"
                        : r === "daily"
                          ? "まいにち"
                          : "まいしゅう"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>だれに？</Text>
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
                    みんな
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
                    {editingTask ? "ほぞん" : "つくる"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 20,
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
    fontSize: 14,
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
