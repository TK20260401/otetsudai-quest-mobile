import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "../lib/supabase";
import type { Family, User } from "../lib/types";
import { verifyPin, loginAsUser, signIn, signUp } from "../services/auth";
import { setSession } from "../lib/session";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import { AutoRubyText, RubyText } from "../components/Ruby";
import { useAppAlert } from "../components/AppAlert";
import PixelHeroSvg from "../components/PixelHeroSvg";
import { PixelKeyIcon, PixelScrollIcon, PixelHouseIcon, PixelTrashIcon, PixelPencilIcon, PixelDoorIcon, PixelCheckIcon, PixelPersonIcon, PixelFamilyIcon } from "../components/PixelIcons";
import ChildCharacterSvg, { resolveChildGender, type ChildGender } from "../components/ChildCharacterSvg";
import RpgButton from "../components/RpgButton";
import LegalModal from "../components/LegalModal";
import { TERMS, PRIVACY } from "../lib/legal-texts";

type LoginStep = "mode" | "family" | "member" | "pin" | "admin";

type Props = {
  onLoginSuccess: () => void;
};

export default function LoginScreen({ onLoginSuccess }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const { alert } = useAppAlert();
  const [step, setStep] = useState<LoginStep>("mode");
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [legalModal, setLegalModal] = useState<"terms" | "privacy" | null>(null);

  // Admin login
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // false=ログイン, true=新規登録
  const [showPassword, setShowPassword] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState("");
  const [loggedInAuthId, setLoggedInAuthId] = useState("");

  // Family add
  const [newFamilyName, setNewFamilyName] = useState("");
  const [addingFamily, setAddingFamily] = useState(false);
  // 家族メンバー管理
  const [managingFamily, setManagingFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<User[]>([]);
  const [newChildName, setNewChildName] = useState("");
  const [newChildIcon, setNewChildIcon] = useState<ChildGender>("boy");
  const [newChildPin, setNewChildPin] = useState("");
  const [addingChild, setAddingChild] = useState(false);
  // メンバー編集
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState<ChildGender>("boy");
  const [editPin, setEditPin] = useState("");
  const [savingMember, setSavingMember] = useState(false);
  const adminScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadFamilies();
  }, []);

  async function loadFamilies() {
    const { data } = await supabase
      .from("otetsudai_families")
      .select("*");
    setFamilies(data || []);
    setLoading(false);
  }

  async function loadMyFamilies(authId: string) {
    // 自分が所有する家族 + 山田家（見本）
    const { data } = await supabase
      .from("otetsudai_families")
      .select("*")
      .or(`owner_auth_id.eq.${authId},name.eq.${SAMPLE_FAMILY_NAME}`);
    setFamilies(data || []);
  }

  async function handleFamilySelect(family: Family) {
    setSelectedFamily(family);
    setError("");
    const { data } = await supabase
      .from("otetsudai_users")
      .select("*")
      .eq("family_id", family.id)
      .eq("role", "child");
    setMembers(data || []);
    setStep("member");
  }

  function handleUserSelect(user: User) {
    setSelectedUser(user);
    setPin("");
    setError("");
    // pin_hash があれば PIN 入力を求める
    const hasPinHash = (user as any).pin_hash;
    if (user.pin || hasPinHash) {
      setStep("pin");
    } else {
      // PIN not set - login directly
      handleDirectLogin(user);
    }
  }

  async function handleDirectLogin(user: User) {
    await loginAsUser(user, selectedFamily!.id);
    onLoginSuccess();
  }

  async function handlePinLogin() {
    if (!selectedUser || !selectedFamily) return;
    const valid = await verifyPin(selectedUser.id, pin);
    if (!valid) {
      setError("PINが ちがいます");
      return;
    }
    await loginAsUser(selectedUser, selectedFamily.id);
    onLoginSuccess();
  }

  async function handleAdminLogin() {
    setError("");
    setAdminLoading(true);
    try {
      const { data: authData, error: authError } = await signIn(
        adminEmail,
        adminPassword
      );
      if (authError || !authData.user) {
        setError("メールアドレス または パスワードが ただしくありません");
        setAdminLoading(false);
        return;
      }
      let { data: authUser } = await supabase
        .from("otetsudai_users")
        .select("*")
        .eq("auth_id", authData.user.id)
        .in("role", ["admin", "parent"])
        .limit(1)
        .single();
      if (!authUser) {
        // レコードが未作成の場合、自動でadminとして登録
        const { data: newUser } = await supabase.from("otetsudai_users").insert({
          auth_id: authData.user.id,
          role: "admin",
          name: adminEmail.split("@")[0],
          icon: "👨‍👩‍👧‍👦",
          display_order: 0,
        }).select().single();
        authUser = newUser;
      }
      if (!authUser) {
        await supabase.auth.signOut();
        setError("このアカウントでは ログインできません");
        setAdminLoading(false);
        return;
      }
      // admin の family_id が null なら最新の自分の家族を探す
      let familyId = authUser.family_id;
      if (!familyId) {
        const { data: myFamilies } = await supabase
          .from("otetsudai_families")
          .select("id, name")
          .neq("name", SAMPLE_FAMILY_NAME)
          .order("created_at", { ascending: false })
          .limit(1);
        if (myFamilies && myFamilies.length > 0) {
          familyId = myFamilies[0].id;
          // DB側も更新
          await supabase.from("otetsudai_users").update({ family_id: familyId }).eq("id", authUser.id);
        }
      }
      // セッション保存
      await setSession({
        userId: authUser.id,
        familyId,
        role: authUser.role as "admin" | "parent",
        name: authUser.name,
        authId: authData.user.id,
      });
      // 常に家族管理画面へ（ダッシュボードへはボタンで遷移）
      setLoggedInUserId(authUser.id);
      setLoggedInAuthId(authData.user.id);
      setAdminLoggedIn(true);
      await loadMyFamilies(authData.user.id);
    } catch {
      setError("ログインに 失敗しました");
    }
    setAdminLoading(false);
  }

  async function handleAdminSignUp() {
    setError("");
    if (adminPassword.length < 6) {
      setError("パスワードは6文字以上にしてください");
      return;
    }
    setAdminLoading(true);
    try {
      const { data: authData, error: authError } = await signUp(
        adminEmail,
        adminPassword
      );
      if (authError) {
        setError(authError.message);
        setAdminLoading(false);
        return;
      }
      if (authData.user) {
        // adminユーザーをDBに登録
        await supabase.from("otetsudai_users").insert({
          auth_id: authData.user.id,
          role: "admin",
          name: adminEmail.split("@")[0],
          icon: "👨‍👩‍👧‍👦",
          display_order: 0,
        });
        // 登録後に自動ログイン + セッション保存
        const { data: newAdminUser } = await supabase
          .from("otetsudai_users")
          .select("*")
          .eq("auth_id", authData.user.id)
          .single();
        if (newAdminUser) {
          await setSession({
            userId: newAdminUser.id,
            familyId: newAdminUser.family_id,
            role: "admin",
            name: newAdminUser.name,
            authId: authData.user.id,
          });
        }
        // 新規登録 → 家族管理画面へ
        if (newAdminUser) setLoggedInUserId(newAdminUser.id);
        if (authData.user) setLoggedInAuthId(authData.user.id);
        setAdminLoggedIn(true);
        await loadMyFamilies(authData.user?.id || "");
        alert("🎉 登録完了", "家族を追加してはじめましょう！");
      }
    } catch {
      setError("登録に失敗しました");
    }
    setAdminLoading(false);
  }

  const SAMPLE_FAMILY_NAME = "山田家";

  function handleDeleteFamily(family: Family) {
    alert("家族を削除", `「${family.name}」を削除しますか？\n関連するデータも全て削除されます。`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除する",
        style: "destructive",
        onPress: async () => {
          // 関連データを先に削除（FK制約）
          const fid = family.id;
          // 子テーブルから順に削除
          const { data: users } = await supabase.from("otetsudai_users").select("id").eq("family_id", fid);
          const userIds = (users || []).map((u: { id: string }) => u.id);
          if (userIds.length > 0) {
            const { data: wallets } = await supabase.from("otetsudai_wallets").select("id").in("child_id", userIds);
            const walletIds = (wallets || []).map((w: { id: string }) => w.id);
            if (walletIds.length > 0) {
              await supabase.from("otetsudai_transactions").delete().in("wallet_id", walletIds);
              await supabase.from("otetsudai_spend_requests").delete().in("wallet_id", walletIds);
              await supabase.from("otetsudai_invest_orders").delete().in("wallet_id", walletIds);
              await supabase.from("otetsudai_wallets").delete().in("id", walletIds);
            }
            await supabase.from("otetsudai_task_logs").delete().in("child_id", userIds);
            await supabase.from("otetsudai_badges").delete().in("child_id", userIds);
            await supabase.from("otetsudai_saving_goals").delete().in("child_id", userIds);
          }
          await supabase.from("otetsudai_family_messages").delete().eq("family_id", fid);
          await supabase.from("otetsudai_family_challenges").delete().eq("family_id", fid);
          await supabase.from("otetsudai_family_settings").delete().eq("family_id", fid);
          await supabase.from("otetsudai_tasks").delete().eq("family_id", fid);
          await supabase.from("otetsudai_users").delete().eq("family_id", fid);
          await supabase.from("otetsudai_families").delete().eq("id", fid);
          await loadFamilies();
          alert("削除しました", `${family.name} を削除しました`);
        },
      },
    ]);
  }

  async function handleAddFamily() {
    if (!newFamilyName.trim()) return;
    setAddingFamily(true);
    try {
      const { data: familyData } = await supabase
        .from("otetsudai_families")
        .insert({ name: newFamilyName.trim(), owner_auth_id: loggedInAuthId || null })
        .select()
        .single();
      if (familyData) {
        await supabase.from("otetsudai_family_settings").insert({
          family_id: familyData.id,
          special_quest_enabled: true,
          special_quest_star1_enabled: true,
          special_quest_star2_enabled: true,
          special_quest_star3_enabled: true,
        });
      }
      setNewFamilyName("");
      alert("追加しました", `${newFamilyName.trim()} を追加しました`);
      if (loggedInAuthId) {
        await loadMyFamilies(loggedInAuthId);
      } else {
        await loadFamilies();
      }
    } catch {
      alert("エラー", "家族の追加に失敗しました");
    }
    setAddingFamily(false);
  }

  const CHILD_GENDERS: { key: ChildGender; label: string }[] = [
    { key: "boy", label: "男の子" },
    { key: "girl", label: "女の子" },
    { key: "other", label: "どちらでもない" },
  ];

  async function openFamilyMembers(family: Family) {
    setManagingFamily(family);
    const { data } = await supabase
      .from("otetsudai_users")
      .select("*")
      .eq("family_id", family.id)
      .order("display_order");
    setFamilyMembers(data || []);
  }

  async function handleAddChild() {
    if (!newChildName.trim() || !managingFamily) return;
    setAddingChild(true);
    const memberCount = familyMembers.length;
    const { data: insertedUser } = await supabase.from("otetsudai_users").insert({
      family_id: managingFamily.id,
      role: "child",
      name: newChildName.trim(),
      icon: newChildIcon,
      display_order: memberCount + 1,
    }).select("id").single();
    if (insertedUser) {
      // PINをbcryptハッシュで保存
      if (newChildPin) {
        await supabase.rpc("set_pin_hash", { p_user_id: insertedUser.id, p_pin: newChildPin });
      }
      // ウォレット自動作成
      await supabase.from("otetsudai_wallets").insert({
        child_id: insertedUser.id,
        spending_balance: 0,
        saving_balance: 0,
        invest_balance: 0,
        save_ratio: 30,
        invest_ratio: 0,
        split_ratio: 30,
      });
    }
    setNewChildName("");
    setNewChildPin("");
    setNewChildIcon("boy");
    setAddingChild(false);
    await openFamilyMembers(managingFamily);
  }

  function startEditMember(member: User) {
    setEditingMember(member);
    setEditName(member.name);
    setEditIcon(resolveChildGender(member.icon));
    setEditPin(member.pin || "");
  }

  async function handleSaveMember() {
    if (!editingMember || !editName.trim()) return;
    setSavingMember(true);
    await supabase.from("otetsudai_users").update({
      name: editName.trim(),
      icon: editIcon,
    }).eq("id", editingMember.id);
    // PINが変更されていたらbcryptハッシュで更新
    if (editPin && editPin !== (editingMember.pin || "")) {
      await supabase.rpc("set_pin_hash", { p_user_id: editingMember.id, p_pin: editPin });
    }
    setSavingMember(false);
    setEditingMember(null);
    if (managingFamily) await openFamilyMembers(managingFamily);
  }

  async function handleDeleteMember(member: User) {
    if (!managingFamily) return;
    alert("メンバーを削除", `「${member.name}」を削除しますか？`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除する",
        style: "destructive",
        onPress: async () => {
          // 関連データ削除
          const { data: wallets } = await supabase.from("otetsudai_wallets").select("id").eq("child_id", member.id);
          const walletIds = (wallets || []).map((w: { id: string }) => w.id);
          if (walletIds.length > 0) {
            await supabase.from("otetsudai_transactions").delete().in("wallet_id", walletIds);
            await supabase.from("otetsudai_spend_requests").delete().in("wallet_id", walletIds);
            await supabase.from("otetsudai_invest_orders").delete().in("wallet_id", walletIds);
            await supabase.from("otetsudai_wallets").delete().in("id", walletIds);
          }
          await supabase.from("otetsudai_task_logs").delete().eq("child_id", member.id);
          await supabase.from("otetsudai_badges").delete().eq("child_id", member.id);
          await supabase.from("otetsudai_saving_goals").delete().eq("child_id", member.id);
          await supabase.from("otetsudai_family_messages").delete().eq("sender_id", member.id);
          await supabase.from("otetsudai_family_messages").delete().eq("recipient_id", member.id);
          await supabase.from("otetsudai_users").delete().eq("id", member.id);
          setEditingMember(null);
          await openFamilyMembers(managingFamily);
        },
      },
    ]);
  }

  function goBack() {
    setError("");
    if (step === "pin") {
      setSelectedUser(null);
      setStep("member");
    } else if (step === "member") {
      setSelectedFamily(null);
      setMembers([]);
      setStep("family");
    } else if (step === "family") {
      setStep("mode");
    } else if (step === "admin") {
      setStep("mode");
      setAdminEmail("");
      setAdminPassword("");
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <PixelKeyIcon size={40} />
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.loadingText}>よみこみちゅう...</Text>
      </View>
    );
  }

  // Admin login / family management
  if (step === "admin") {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
      <ScrollView
        ref={adminScrollRef}
        contentContainerStyle={[styles.container, { flexGrow: 1 }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator
        alwaysBounceVertical
      >
        <View style={styles.card}>
          {!adminLoggedIn ? (
            <>
              {isSignUp ? <PixelScrollIcon size={40} /> : <PixelKeyIcon size={40} />}
              <Text style={styles.titleAdmin} adjustsFontSizeToFit numberOfLines={1}>
                {isSignUp ? "アカウント作成" : "ログイン"}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="メールアドレス"
                placeholderTextColor={palette.textPlaceholder}
                value={adminEmail}
                onChangeText={setAdminEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={{ position: "relative" }}>
                <TextInput
                  style={styles.input}
                  placeholder={isSignUp ? "パスワード（6文字以上）" : "パスワード"}
                  placeholderTextColor={palette.textPlaceholder}
                  value={adminPassword}
                  onChangeText={setAdminPassword}
                  secureTextEntry={!showPassword}
                  onSubmitEditing={isSignUp ? handleAdminSignUp : handleAdminLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 14, top: 14 }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={{ fontSize: 18 }}>{showPassword ? "🙈" : "👁️"}</Text>
                </TouchableOpacity>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <RpgButton
                tier="violet"
                size="lg"
                fullWidth
                onPress={isSignUp ? handleAdminSignUp : handleAdminLogin}
                disabled={adminLoading || !adminEmail || !adminPassword}
              >
                {adminLoading
                  ? (isSignUp ? "登録中..." : "ログイン中...")
                  : (isSignUp ? "アカウント作成" : "ログイン")}
              </RpgButton>

              <TouchableOpacity
                style={styles.switchAuthLink}
                onPress={() => { setIsSignUp(!isSignUp); setError(""); setAdminEmail(""); setAdminPassword(""); }}
              >
                <Text style={styles.switchAuthText}>
                  {isSignUp ? "ログインに戻る" : "アカウント作成"}
                </Text>
              </TouchableOpacity>

              {!isSignUp && (
                <TouchableOpacity
                  style={styles.switchAuthLink}
                  onPress={async () => {
                    if (!adminEmail.trim()) {
                      setError("メールアドレスを入力してください");
                      return;
                    }
                    setAdminLoading(true);
                    setError("");
                    const { error: resetError } = await supabase.auth.resetPasswordForEmail(adminEmail.trim());
                    setAdminLoading(false);
                    if (resetError) {
                      setError("送信に失敗しました");
                    } else {
                      alert("📧 メール送信", `${adminEmail.trim()} にパスワードリセット用のメールを送信しました。メール内のリンクから再設定してください。`);
                    }
                  }}
                >
                  <Text style={styles.switchAuthText}>パスワードを忘れた</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <PixelHouseIcon size={40} />
              <Text style={styles.titleAdmin}>家族管理</Text>

              {/* 家族一覧 */}
              {managingFamily ? (
                <>
                  {/* 家族メンバー管理画面 */}
                  <TouchableOpacity onPress={() => { setManagingFamily(null); setFamilyMembers([]); }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelDoorIcon size={14} /><Text style={styles.backText}>家族一覧に戻る</Text></View>
                  </TouchableOpacity>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8, marginBottom: 12 }}>
                    <PixelHouseIcon size={18} />
                    <Text style={[styles.titleAdmin, { fontSize: rf(18), marginBottom: 0 }]}>{managingFamily.name}</Text>
                  </View>

                  {/* 既存メンバー */}
                  {familyMembers.map((m) => (
                    <View key={m.id}>
                      {editingMember?.id === m.id ? (
                        /* 編集モード */
                        <View style={[styles.familyRow, { flexDirection: "column", alignItems: "stretch", padding: 12, backgroundColor: palette.primaryLight }]}>
                          {/* キャラクター選択 */}
                          <View style={{ flexDirection: "row", gap: 8, marginBottom: 8, justifyContent: "space-around" }}>
                            {CHILD_GENDERS.map((g) => (
                              <TouchableOpacity
                                key={g.key}
                                onPress={() => setEditIcon(g.key)}
                                style={{
                                  flex: 1,
                                  paddingVertical: 8,
                                  borderRadius: 10,
                                  borderWidth: 2,
                                  borderColor: editIcon === g.key ? palette.primary : palette.border,
                                  backgroundColor: editIcon === g.key ? palette.primaryLight : palette.surfaceMuted,
                                  alignItems: "center",
                                }}
                                accessibilityLabel={g.label}
                                accessibilityState={{ selected: editIcon === g.key }}
                              >
                                <ChildCharacterSvg gender={g.key} size={36} />
                                <Text style={{ fontSize: 10, marginTop: 2, fontWeight: "bold", color: editIcon === g.key ? palette.primary : palette.textMuted }}>
                                  {g.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                          <TextInput
                            style={styles.input}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="なまえ"
                            placeholderTextColor={palette.textPlaceholder}
                            onFocus={() => setTimeout(() => adminScrollRef.current?.scrollToEnd({ animated: true }), 200)}
                          />
                          <TextInput
                            style={styles.input}
                            value={editPin}
                            onChangeText={setEditPin}
                            placeholder="あんしょうばんごう（なくてもOK）"
                            placeholderTextColor={palette.textPlaceholder}
                            keyboardType="number-pad"
                            maxLength={6}
                            onFocus={() => setTimeout(() => adminScrollRef.current?.scrollToEnd({ animated: true }), 200)}
                          />
                          <View style={{ flexDirection: "row", gap: 8 }}>
                            <TouchableOpacity
                              style={[styles.button, styles.buttonPrimary, { flex: 1 }]}
                              onPress={handleSaveMember}
                              disabled={savingMember || !editName.trim()}
                            >
                              <Text style={styles.buttonText}>
                                {savingMember ? "ほぞんちゅう..." : "ほぞん"}
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.button, { flex: 1, backgroundColor: palette.surfaceMuted }]}
                              onPress={() => setEditingMember(null)}
                            >
                              <Text style={[styles.buttonText, { color: palette.textBase }]}>キャンセル</Text>
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity
                            style={{ marginTop: 8, alignItems: "center" }}
                            onPress={() => handleDeleteMember(m)}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelTrashIcon size={14} /><Text style={{ color: palette.red, fontSize: 13 }}>このメンバーを削除</Text></View>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        /* 表示モード — タップで編集 */
                        <TouchableOpacity
                          style={styles.familyRow}
                          onPress={() => startEditMember(m)}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                            {m.role === "child" ? (
                              <ChildCharacterSvg gender={resolveChildGender(m.icon)} size={22} />
                            ) : (
                              <PixelFamilyIcon size={18} />
                            )}
                            <Text style={styles.familyName}>
                              {m.name}（{m.role === "child" ? "こども" : "おや"}）
                            </Text>
                          </View>
                          <PixelPencilIcon size={14} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  {familyMembers.length === 0 && (
                    <Text style={{ textAlign: "center", color: palette.textMuted, marginVertical: 12 }}>
                      まだメンバーがいません
                    </Text>
                  )}

                  {/* 子供追加フォーム */}
                  <View style={{ marginTop: 16 }}>
                    <Text style={[styles.label, { marginBottom: 8 }]}>子供を追加</Text>

                    {/* キャラクター選択 (男の子/女の子/どちらでもない) */}
                    <View style={{ flexDirection: "row", gap: 8, marginBottom: 8, justifyContent: "space-around" }}>
                      {CHILD_GENDERS.map((g) => (
                        <TouchableOpacity
                          key={g.key}
                          onPress={() => setNewChildIcon(g.key)}
                          style={{
                            flex: 1,
                            paddingVertical: 10,
                            paddingHorizontal: 4,
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: newChildIcon === g.key ? palette.primary : palette.border,
                            backgroundColor: newChildIcon === g.key ? palette.primaryLight : palette.surfaceMuted,
                            alignItems: "center",
                          }}
                          accessibilityLabel={g.label}
                          accessibilityState={{ selected: newChildIcon === g.key }}
                        >
                          <ChildCharacterSvg gender={g.key} size={44} />
                          <Text
                            style={{
                              fontSize: 11,
                              marginTop: 4,
                              fontWeight: "bold",
                              color: newChildIcon === g.key ? palette.primary : palette.textMuted,
                            }}
                          >
                            {g.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TextInput
                      style={styles.input}
                      placeholder="なまえ（れい: ハルト）"
                      placeholderTextColor={palette.textPlaceholder}
                      value={newChildName}
                      onChangeText={setNewChildName}
                      onFocus={() => setTimeout(() => adminScrollRef.current?.scrollToEnd({ animated: true }), 200)}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="あんしょうばんごう（なくてもOK）"
                      placeholderTextColor={palette.textPlaceholder}
                      value={newChildPin}
                      onChangeText={setNewChildPin}
                      keyboardType="number-pad"
                      maxLength={6}
                      onFocus={() => setTimeout(() => adminScrollRef.current?.scrollToEnd({ animated: true }), 200)}
                    />
                    <TouchableOpacity
                      style={[styles.button, styles.buttonPrimary]}
                      onPress={handleAddChild}
                      disabled={addingChild || !newChildName.trim()}
                    >
                      {addingChild ? (
                        <Text style={styles.buttonText}>追加中...</Text>
                      ) : (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" }}>
                          <PixelPersonIcon size={16} />
                          <Text style={styles.buttonText}>子供を追加</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <View style={{ height: 200 }} />
                  </View>
                </>
              ) : (
                <>
                  {families.map((f) => {
                    const isSample = f.name === SAMPLE_FAMILY_NAME;
                    return (
                      <View key={f.id}>
                        <View style={styles.familyRow}>
                          <TouchableOpacity
                            style={{ flex: 1 }}
                            onPress={() => !isSample && openFamilyMembers(f)}
                          >
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flex: 1 }}>
                              <PixelHouseIcon size={16} />
                              <Text style={styles.familyName}>{f.name}{isSample ? "（見本）" : ""}</Text>
                            </View>
                          </TouchableOpacity>
                          {!isSample && (
                            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                              <TouchableOpacity
                                onPress={() => handleDeleteFamily(f)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <PixelTrashIcon size={18} />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                        {!isSample && (
                          <View style={{ flexDirection: "row", gap: 8, marginBottom: 8, marginTop: -4 }}>
                            <TouchableOpacity
                              style={{
                                flex: 1,
                                backgroundColor: palette.primary,
                                borderRadius: 10,
                                paddingVertical: 10,
                                alignItems: "center",
                              }}
                              onPress={async () => {
                                await setSession({
                                  userId: loggedInUserId,
                                  familyId: f.id,
                                  role: "admin",
                                  name: adminEmail.split("@")[0],
                                });
                                // DB側も更新
                                await supabase.from("otetsudai_users").update({ family_id: f.id }).eq("id", loggedInUserId);
                                onLoginSuccess();
                              }}
                            >
                              <Text style={{ color: palette.white, fontWeight: "bold", fontSize: 14 }}>▶ ダッシュボード</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={{
                                flex: 1,
                                backgroundColor: palette.surfaceMuted,
                                borderRadius: 10,
                                paddingVertical: 10,
                                alignItems: "center",
                                borderWidth: 1,
                                borderColor: palette.border,
                              }}
                              onPress={() => openFamilyMembers(f)}
                            >
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelPencilIcon size={14} /><Text style={{ color: palette.textBase, fontWeight: "bold", fontSize: 14 }}>メンバー管理</Text></View>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </>
              )}

              {/* 家族追加（メンバー管理中は非表示） */}
              {!managingFamily && (
                <>
                  <View style={styles.addFamilyRow}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      placeholder="あたらしい かぞくめい（れい: たなかけ）"
                      placeholderTextColor={palette.textPlaceholder}
                      value={newFamilyName}
                      onChangeText={setNewFamilyName}
                      onFocus={() => setTimeout(() => adminScrollRef.current?.scrollToEnd({ animated: true }), 200)}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonPrimary, { marginTop: 8 }]}
                    onPress={handleAddFamily}
                    disabled={addingFamily || !newFamilyName.trim()}
                  >
                    <Text style={styles.buttonText}>
                      {addingFamily ? "追加中..." : "＋ 家族を追加"}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}

          <TouchableOpacity style={styles.backButton} onPress={() => {
            setAdminLoggedIn(false);
            setAdminEmail("");
            setAdminPassword("");
            goBack();
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelDoorIcon size={14} /><Text style={styles.backText}>もどる</Text></View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      <View style={styles.card}>
        {/* Header */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
          <PixelHeroSvg type="warrior" size={48} />
          <PixelHeroSvg type="mage" size={48} />
        </View>
        <Text style={styles.title} adjustsFontSizeToFit numberOfLines={1}>おこづかいクエスト</Text>
        <Text style={styles.subtitle} adjustsFontSizeToFit numberOfLines={1}>
          クエストをクリアしてコインをかせごう！
        </Text>

        {/* Step: Mode selection */}
        {step === "mode" && (
          <>
            <Text style={styles.label}>どっちのモード？</Text>
            <View style={{ marginBottom: 12 }}>
              <RpgButton tier="gold" size="lg" fullWidth onPress={() => { setStep("family"); loadFamilies(); }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <PixelPersonIcon size={24} />
                  <Text style={{ fontSize: 18, fontWeight: "bold", color: "#2A1800" }}>こどもモード</Text>
                </View>
              </RpgButton>
              <Text style={[styles.modeHint, { textAlign: "center", marginTop: 4 }]}>おうちをえらんでログイン</Text>
            </View>
            <View style={{ marginBottom: 8 }}>
              <RpgButton tier="violet" size="lg" fullWidth onPress={() => { setStep("admin"); setIsSignUp(false); setError(""); }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <PixelFamilyIcon size={24} />
                  <Text style={{ fontSize: 18, fontWeight: "bold", color: "#FFFFFF" }}>親モード</Text>
                </View>
              </RpgButton>
              <Text style={[styles.modeHint, { textAlign: "center", marginTop: 4 }]}>メール・パスワードでログイン</Text>
            </View>
          </>
        )}

        {/* Step: Family selection */}
        {step === "family" && (
          <>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelDoorIcon size={14} /><Text style={styles.backText}>もどる</Text></View>
            </TouchableOpacity>
            <Text style={styles.label}>おうちを選んでね</Text>
            {families.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={styles.selectButton}
                onPress={() => handleFamilySelect(f)}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelHouseIcon size={16} /><Text style={styles.selectText}>{f.name}</Text></View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Step: Member selection */}
        {step === "member" && (
          <>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelDoorIcon size={14} /><Text style={styles.backText}>{selectedFamily?.name}</Text></View>
            </TouchableOpacity>
            <Text style={styles.label}>だれかな？</Text>
            {members.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={styles.selectButton}
                onPress={() => handleUserSelect(m)}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <ChildCharacterSvg gender={resolveChildGender(m.icon)} size={36} />
                  <Text style={styles.selectText} numberOfLines={1} adjustsFontSizeToFit>
                    {m.name}
                  </Text>
                </View>
                <Text style={styles.roleText} numberOfLines={1}>こどもこうざ</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Step: PIN input */}
        {step === "pin" && (
          <>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><PixelDoorIcon size={14} /><Text style={styles.backText}>{selectedUser?.name}</Text></View>
            </TouchableOpacity>
            <Text style={styles.label}>PINをいれてね 🔑</Text>
            <Text style={styles.hint}>
              おうちのひとにきいた4けたのばんごうをいれてね
            </Text>
            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={setPin}
              maxLength={4}
              keyboardType="number-pad"
              secureTextEntry
              placeholder="4けたのPIN"
              placeholderTextColor={palette.textPlaceholder}
              textAlign="center"
              onSubmitEditing={handlePinLogin}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <RpgButton tier="gold" size="lg" fullWidth onPress={handlePinLogin}>
              クエストをはじめる！
            </RpgButton>
          </>
        )}
      </View>

      {/* 利用規約・プライバシーポリシー — LandingScreen と同一仕様（アプリ内 LegalModal で表示） */}
      <View style={styles.legalRow}>
        <TouchableOpacity onPress={() => setLegalModal("terms")} accessibilityRole="button" accessibilityLabel="利用規約を開く">
          <RubyText style={styles.legalLink} parts={[["利用規約", "りようきやく"]]} rubySize={6} />
        </TouchableOpacity>
        <Text style={styles.legalSep}>|</Text>
        <TouchableOpacity onPress={() => setLegalModal("privacy")} accessibilityRole="button" accessibilityLabel="プライバシーポリシーを開く">
          <AutoRubyText text="プライバシーポリシー" style={styles.legalLink} rubySize={6} />
        </TouchableOpacity>
      </View>
    </ScrollView>

    <LegalModal
      visible={legalModal === "terms"}
      onClose={() => setLegalModal(null)}
      title={TERMS.title}
      updated={TERMS.updated}
      sections={TERMS.sections}
    />
    <LegalModal
      visible={legalModal === "privacy"}
      onClose={() => setLegalModal(null)}
      title={PRIVACY.title}
      updated={PRIVACY.updated}
      sections={PRIVACY.sections}
    />
    </KeyboardAvoidingView>
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
      flexGrow: 1,
      justifyContent: "center",
      padding: 20,
      backgroundColor: p.surfaceMuted,
    },
    card: {
      backgroundColor: p.white,
      borderRadius: 16,
      padding: 24,
      shadowColor: p.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    icon: {
      fontSize: 48,
      textAlign: "center",
      marginBottom: 8,
    },
    title: {
      fontSize: rf(24),
      fontWeight: "bold",
      textAlign: "center",
      color: p.primaryDark,
      marginBottom: 4,
    },
    titleAdmin: {
      fontSize: 20,
      fontWeight: "bold",
      textAlign: "center",
      color: p.textStrong,
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 14,
      textAlign: "center",
      color: p.textMuted,
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: "bold",
      marginBottom: 12,
      color: p.textStrong,
    },
    hint: {
      fontSize: 12,
      color: p.textMuted,
      marginBottom: 12,
    },
    selectButton: {
      borderWidth: 1,
      borderColor: p.accentDark,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      backgroundColor: p.white,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    selectText: {
      fontSize: rf(18),
      color: p.textStrong,
      flexShrink: 1,
    },
    roleText: {
      fontSize: rf(12),
      color: p.textMuted,
      marginLeft: 4,
    },
    pinInput: {
      borderWidth: 2,
      borderColor: p.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 28,
      letterSpacing: 12,
      marginBottom: 16,
      backgroundColor: p.surfaceMuted,
      color: p.textStrong,
    },
    input: {
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      marginBottom: 12,
      backgroundColor: p.surfaceMuted,
      color: p.textStrong,
    },
    button: {
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      marginTop: 4,
    },
    buttonPrimary: {
      backgroundColor: p.accent,
    },
    buttonAdmin: {
      backgroundColor: p.textStrong,
    },
    buttonText: {
      color: p.white,
      fontSize: 18,
      fontWeight: "bold",
    },
    error: {
      color: p.red,
      fontSize: 14,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 8,
      backgroundColor: p.redLight,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      overflow: "hidden",
    },
    backButton: {
      marginTop: 16,
      marginBottom: 12,
      alignItems: "center",
    } as const,
    backText: {
      fontSize: 14,
      color: p.textMuted,
    },
    modeButton: {
      borderWidth: 2,
      borderRadius: 16,
      padding: 20,
      alignItems: "center",
      marginBottom: 12,
    },
    modeEmoji: { fontSize: 36, marginBottom: 4 },
    modeText: { fontSize: rf(18), fontWeight: "bold" },
    modeHint: { fontSize: 12, color: p.textMuted, marginTop: 4 },
    switchAuthLink: {
      marginTop: 16,
      alignItems: "center",
      paddingVertical: 8,
    },
    switchAuthText: {
      fontSize: 13,
      color: p.primary,
      textDecorationLine: "underline",
    },
    adminLink: {
      marginTop: 20,
      alignItems: "center",
    },
    adminLinkText: {
      fontSize: 12,
      color: p.textMuted,
    },
    familyRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
      backgroundColor: p.surfaceMuted,
    } as const,
    familyName: {
      fontSize: 16,
      color: p.textStrong,
      flex: 1,
    },
    familyDelete: {
      fontSize: 18,
    },
    addFamilyRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 12,
    },
    legalRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      marginTop: 16,
    },
    legalLink: {
      fontSize: 11,
      color: p.primary,
    },
    legalSep: {
      fontSize: 11,
      color: p.textMuted,
    },
    loadingText: {
      color: p.textMuted,
      marginTop: 12,
      fontSize: 14,
    },
  });
}
