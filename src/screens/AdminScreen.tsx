import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase, supabaseAnonKey } from "../lib/supabase";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import { loginAsUser } from "../services/auth";
import { PixelShieldIcon, PixelDoorIcon, PixelCrossIcon } from "../components/PixelIcons";
import RpgButton from "../components/RpgButton";

type Family = {
  id: string;
  name: string;
  has_parent: boolean;
  created_at: string;
};

type User = {
  id: string;
  family_id: string;
  name: string;
  role: string;
  icon: string;
  auth_id: string | null;
  is_anonymous: boolean | null;
};

type Props = {
  onLoginAs: (userId: string, familyId: string, role: string, name: string) => void;
  onLogout: () => void;
};

export default function AdminScreen({ onLoginAs, onLogout }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [families, setFamilies] = useState<Family[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [famRes, userRes] = await Promise.all([
      supabase.from("otetsudai_families").select("*").order("created_at", { ascending: false }),
      supabase.from("otetsudai_users").select("*").order("created_at", { ascending: false }),
    ]);
    setFamilies(famRes.data || []);
    setUsers(userRes.data || []);
    setLoading(false);
  }

  const familyUsers = useMemo(
    () => users.filter((u) => u.family_id === selectedFamily),
    [users, selectedFamily]
  );

  const handleLoginAs = useCallback(
    async (user: User) => {
      Alert.alert(
        `${user.name} としてログイン`,
        `ロール: ${user.role}\n家族ID: ${user.family_id}`,
        [
          { text: "やめる", style: "cancel" },
          {
            text: "ログイン",
            onPress: async () => {
              await loginAsUser(
                { id: user.id, role: user.role as any, name: user.name },
                user.family_id,
                user.auth_id || undefined
              );
              onLoginAs(user.id, user.family_id, user.role, user.name);
            },
          },
        ]
      );
    },
    [onLoginAs]
  );

  const handleDeleteUser = useCallback(
    (user: User) => {
      Alert.alert(
        `${user.name} を削除`,
        "この操作は取り消せません。関連データ（ウォレット・取引等）も削除されます。",
        [
          { text: "やめる", style: "cancel" },
          {
            text: "削除する",
            style: "destructive",
            onPress: async () => {
              // ウォレット・トランザクション等を先に削除
              await supabase.from("otetsudai_wallets").delete().eq("child_id", user.id);
              await supabase.from("otetsudai_badges").delete().eq("child_id", user.id);
              await supabase.from("otetsudai_task_logs").delete().eq("child_id", user.id);
              await supabase.from("otetsudai_users").delete().eq("id", user.id);
              // auth.users も削除（service_role必要 → Edge Functionが必要だが簡易的にスキップ）
              Alert.alert("削除しました", `${user.name} を削除しました`);
              loadData();
            },
          },
        ]
      );
    },
    []
  );

  const handleDeleteFamily = useCallback(
    (family: Family) => {
      const memberCount = users.filter((u) => u.family_id === family.id).length;
      Alert.alert(
        `${family.name} を削除`,
        `メンバー ${memberCount} 人と関連データが全て削除されます。`,
        [
          { text: "やめる", style: "cancel" },
          {
            text: "削除する",
            style: "destructive",
            onPress: async () => {
              const memberIds = users.filter((u) => u.family_id === family.id).map((u) => u.id);
              for (const id of memberIds) {
                await supabase.from("otetsudai_wallets").delete().eq("child_id", id);
                await supabase.from("otetsudai_badges").delete().eq("child_id", id);
                await supabase.from("otetsudai_task_logs").delete().eq("child_id", id);
              }
              await supabase.from("otetsudai_users").delete().eq("family_id", family.id);
              await supabase.from("otetsudai_family_settings").delete().eq("family_id", family.id);
              await supabase.from("otetsudai_tasks").delete().eq("family_id", family.id);
              await supabase.from("otetsudai_families").delete().eq("id", family.id);
              Alert.alert("削除しました", `${family.name} を削除しました`);
              setSelectedFamily(null);
              loadData();
            },
          },
        ]
      );
    },
    [users]
  );

  const handleResetWallet = useCallback(
    (user: User) => {
      Alert.alert(
        `${user.name} のウォレットをリセット`,
        "残高を全て0にします。",
        [
          { text: "やめる", style: "cancel" },
          {
            text: "リセット",
            style: "destructive",
            onPress: async () => {
              await supabase
                .from("otetsudai_wallets")
                .update({
                  spending_balance: 0,
                  saving_balance: 0,
                  invest_balance: 0,
                })
                .eq("child_id", user.id);
              Alert.alert("リセットしました");
            },
          },
        ]
      );
    },
    []
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={palette.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onLogout} style={styles.backBtn}>
          <PixelDoorIcon size={14} />
          <Text style={styles.backText}>ログアウト</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <PixelShieldIcon size={18} />
          <Text style={styles.headerTitle}>Admin</Text>
        </View>
        <TouchableOpacity onPress={loadData} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>更新</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>
          家族一覧（{families.length}件）
        </Text>

        {families.map((fam) => (
          <View key={fam.id}>
            <TouchableOpacity
              style={[
                styles.familyCard,
                selectedFamily === fam.id && styles.familyCardSelected,
              ]}
              onPress={() =>
                setSelectedFamily(selectedFamily === fam.id ? null : fam.id)
              }
            >
              <View style={styles.familyInfo}>
                <Text style={styles.familyName}>{fam.name}</Text>
                <Text style={styles.familyMeta}>
                  {fam.has_parent ? "親あり" : "親なし"} ・{" "}
                  {users.filter((u) => u.family_id === fam.id).length}人 ・{" "}
                  {new Date(fam.created_at).toLocaleDateString("ja-JP")}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteFamily(fam)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <PixelCrossIcon size={16} />
              </TouchableOpacity>
            </TouchableOpacity>

            {selectedFamily === fam.id && (
              <View style={styles.usersSection}>
                {familyUsers.length === 0 ? (
                  <Text style={styles.emptyText}>メンバーなし</Text>
                ) : (
                  familyUsers.map((user) => (
                    <View key={user.id} style={styles.userCard}>
                      <View style={styles.userInfo}>
                        <Text style={styles.userIcon}>{user.icon}</Text>
                        <View>
                          <Text style={styles.userName}>{user.name}</Text>
                          <Text style={styles.userMeta}>
                            {user.role} ・ {user.is_anonymous ? "匿名" : "登録済"}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.userActions}>
                        {user.role === "child" && (
                          <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => handleLoginAs(user)}
                          >
                            <Text style={styles.actionBtnText}>ログイン</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => handleResetWallet(user)}
                        >
                          <Text style={styles.actionBtnText}>リセット</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.actionBtnDanger]}
                          onPress={() => handleDeleteUser(user)}
                        >
                          <Text style={[styles.actionBtnText, styles.actionBtnDangerText]}>
                            削除
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        ))}

        {families.length === 0 && (
          <Text style={styles.emptyText}>家族データがありません{"\n"}（RLSで制限されている可能性があります）</Text>
        )}

        <View style={{ marginTop: 24, gap: 12 }}>
          <Text style={styles.sectionTitle}>テストログイン</Text>
          <RpgButton tier="gold" size="md" fullWidth onPress={() => onLoginAs("", "", "parent", "Admin")}>
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#2A1800" }}>親ダッシュボードを開く</Text>
          </RpgButton>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: p.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
    },
    backBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: p.primary,
    },
    backText: { fontSize: 14, fontWeight: "bold", color: p.textMuted },
    headerCenter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    headerTitle: { fontSize: rf(18), fontWeight: "bold", color: p.primaryDark },
    refreshBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: p.border,
    },
    refreshText: { fontSize: 12, color: p.textMuted, fontWeight: "600" },
    scrollContent: { padding: 16, paddingBottom: 40 },
    sectionTitle: {
      fontSize: rf(14),
      fontWeight: "bold",
      color: p.textStrong,
      marginBottom: 12,
    },
    familyCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 14,
      borderRadius: 12,
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.border,
      marginBottom: 8,
    },
    familyCardSelected: {
      borderColor: p.primary,
      borderWidth: 2,
    },
    familyInfo: { flex: 1 },
    familyName: { fontSize: rf(14), fontWeight: "bold", color: p.textStrong },
    familyMeta: { fontSize: 11, color: p.textMuted, marginTop: 2 },
    usersSection: {
      marginLeft: 16,
      marginBottom: 12,
      borderLeftWidth: 2,
      borderLeftColor: p.primary,
      paddingLeft: 12,
    },
    userCard: {
      padding: 12,
      borderRadius: 10,
      backgroundColor: p.surface,
      borderWidth: 1,
      borderColor: p.border,
      marginBottom: 6,
    },
    userInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 8,
    },
    userIcon: { fontSize: 24 },
    userName: { fontSize: rf(13), fontWeight: "bold", color: p.textStrong },
    userMeta: { fontSize: 10, color: p.textMuted, marginTop: 1 },
    userActions: {
      flexDirection: "row",
      gap: 6,
    },
    actionBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: p.surfaceMuted,
      borderWidth: 1,
      borderColor: p.border,
      minHeight: 32,
      justifyContent: "center",
    },
    actionBtnText: { fontSize: 11, fontWeight: "600", color: p.textStrong },
    actionBtnDanger: {
      borderColor: "#E74C3C",
      backgroundColor: "rgba(231,76,60,0.1)",
    },
    actionBtnDangerText: { color: "#E74C3C" },
    emptyText: {
      fontSize: 13,
      color: p.textMuted,
      textAlign: "center",
      paddingVertical: 16,
    },
  });
}
