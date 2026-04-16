import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Linking,
} from "react-native";
import { supabase } from "../lib/supabase";
import type { Family, User } from "../lib/types";
import { verifyPin, loginAsUser, signIn, signUp } from "../services/auth";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import { AutoRubyText, RubyText } from "../components/Ruby";
import { useAppAlert } from "../components/AppAlert";

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

  // Admin login
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // false=ログイン, true=新規登録

  // Family add
  const [newFamilyName, setNewFamilyName] = useState("");
  const [addingFamily, setAddingFamily] = useState(false);

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

  async function handleFamilySelect(family: Family) {
    setSelectedFamily(family);
    setError("");
    const { data } = await supabase
      .from("otetsudai_users")
      .select("*")
      .eq("family_id", family.id);
    setMembers(data || []);
    setStep("member");
  }

  function handleUserSelect(user: User) {
    setSelectedUser(user);
    setPin("");
    setError("");
    if (user.pin) {
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
      const { data: adminUser } = await supabase
        .from("otetsudai_users")
        .select("*")
        .eq("auth_id", authData.user.id)
        .eq("role", "admin")
        .single();
      if (!adminUser) {
        await supabase.auth.signOut();
        setError("かんりしゃ けんげんが ありません");
        setAdminLoading(false);
        return;
      }
      setAdminLoggedIn(true);
      await loadFamilies();
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
        // 登録後に自動ログイン
        setAdminLoggedIn(true);
        await loadFamilies();
        alert("🎉 登録完了", "家族を追加してはじめましょう！");
      }
    } catch {
      setError("登録に失敗しました");
    }
    setAdminLoading(false);
  }

  function handleDeleteFamily(family: Family) {
    alert("家族を削除", `「${family.name}」を削除しますか？\n関連するデータも全て削除されます。`, [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除する",
        style: "destructive",
        onPress: async () => {
          // 関連データを先に削除（FK制約）
          await supabase.from("otetsudai_family_settings").delete().eq("family_id", family.id);
          await supabase.from("otetsudai_messages").delete().eq("family_id", family.id);
          await supabase.from("otetsudai_tasks").delete().eq("family_id", family.id);
          await supabase.from("otetsudai_users").delete().eq("family_id", family.id);
          await supabase.from("otetsudai_families").delete().eq("id", family.id);
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
        .insert({ name: newFamilyName.trim() })
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
      await loadFamilies();
    } catch {
      alert("エラー", "家族の追加に失敗しました");
    }
    setAddingFamily(false);
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
        <Text style={styles.icon}>🔑</Text>
        <ActivityIndicator size="large" color={palette.primary} />
        <Text style={styles.loadingText}>よみこみちゅう...</Text>
      </View>
    );
  }

  // Admin login / family management
  if (step === "admin") {
    return (
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {!adminLoggedIn ? (
            <>
              <Text style={styles.icon}>{isSignUp ? "📝" : "🔧"}</Text>
              <Text style={styles.titleAdmin} adjustsFontSizeToFit numberOfLines={1}>
                {isSignUp ? "新規アカウント作成" : "管理者ログイン"}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="メールアドレス"
                value={adminEmail}
                onChangeText={setAdminEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder={isSignUp ? "パスワード（6文字以上）" : "パスワード"}
                value={adminPassword}
                onChangeText={setAdminPassword}
                secureTextEntry
                onSubmitEditing={isSignUp ? handleAdminSignUp : handleAdminLogin}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.button, styles.buttonAdmin]}
                onPress={isSignUp ? handleAdminSignUp : handleAdminLogin}
                disabled={adminLoading || !adminEmail || !adminPassword}
              >
                <Text style={styles.buttonText}>
                  {adminLoading
                    ? (isSignUp ? "登録中..." : "ログイン中...")
                    : (isSignUp ? "アカウント作成" : "ログイン")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchAuthLink}
                onPress={() => { setIsSignUp(!isSignUp); setError(""); }}
              >
                <Text style={styles.switchAuthText}>
                  {isSignUp ? "ログインに戻る" : "新規登録"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.icon}>🏠</Text>
              <RubyText style={styles.titleAdmin} parts={[["家族", "かぞく"], ["管理", "かんり"]]} rubySize={7} />

              {/* 家族一覧 */}
              {families.map((f) => (
                <View key={f.id} style={styles.familyRow}>
                  <Text style={styles.familyName}>🏠 {f.name}</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteFamily(f)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.familyDelete}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* 家族追加 */}
              <View style={styles.addFamilyRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="あたらしい かぞくめい（れい: たなかけ）"
                  value={newFamilyName}
                  onChangeText={setNewFamilyName}
                />
              </View>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary, { marginTop: 8 }]}
                onPress={handleAddFamily}
                disabled={addingFamily || !newFamilyName.trim()}
              >
                <Text style={styles.buttonText}>
                  {addingFamily ? "ついかちゅう..." : "＋ かぞくを ついか"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.backButton} onPress={() => {
            setAdminLoggedIn(false);
            setAdminEmail("");
            setAdminPassword("");
            goBack();
          }}>
            <Text style={styles.backText}>← もどる</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        {/* Header */}
        <Text style={styles.icon}>⚔️</Text>
        <Text style={styles.title} adjustsFontSizeToFit numberOfLines={1}>おこづかいクエスト</Text>
        <Text style={styles.subtitle} adjustsFontSizeToFit numberOfLines={1}>
          クエストをクリアしてコインをかせごう！
        </Text>

        {/* Step: Mode selection */}
        {step === "mode" && (
          <>
            <Text style={styles.label}>どっちのモード？</Text>
            <TouchableOpacity
              style={[styles.modeButton, { backgroundColor: palette.primaryLight, borderColor: palette.primary }]}
              onPress={() => { setStep("family"); loadFamilies(); }}
            >
              <Text style={styles.modeEmoji}>🧒</Text>
              <Text style={[styles.modeText, { color: palette.primaryDark }]}>こどもモード</Text>
              <Text style={styles.modeHint}>おうちをえらんで ログイン</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}
              onPress={() => setStep("admin")}
            >
              <Text style={styles.modeEmoji}>👨‍👩‍👧‍👦</Text>
              <Text style={[styles.modeText, { color: palette.textStrong }]}>おやモード</Text>
              <Text style={styles.modeHint}>メール・パスワードで ログイン</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Step: Family selection */}
        {step === "family" && (
          <>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <Text style={styles.backText}>← もどる</Text>
            </TouchableOpacity>
            <Text style={styles.label}>おうちを選んでね</Text>
            {families.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={styles.selectButton}
                onPress={() => handleFamilySelect(f)}
              >
                <Text style={styles.selectText}>🏠 {f.name}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Step: Member selection */}
        {step === "member" && (
          <>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <Text style={styles.backText}>
                ← {selectedFamily?.name}
              </Text>
            </TouchableOpacity>
            <Text style={styles.label}>だれかな？</Text>
            {members.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={styles.selectButton}
                onPress={() => handleUserSelect(m)}
              >
                <Text style={styles.selectText} numberOfLines={1} adjustsFontSizeToFit>
                  {m.role === "parent" ? "👨‍👩‍👧‍👦" : "🧒"} {m.name}
                </Text>
                <Text style={styles.roleText} numberOfLines={1}>
                  {m.role === "parent" ? "おやこうざ" : "こどもこうざ"}
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Step: PIN input */}
        {step === "pin" && (
          <>
            <TouchableOpacity style={styles.backButton} onPress={goBack}>
              <Text style={styles.backText}>← {selectedUser?.name}</Text>
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
              textAlign="center"
              onSubmitEditing={handlePinLogin}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handlePinLogin}
            >
              <Text style={styles.buttonText}>クエストをはじめる！</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* 利用規約・プライバシーポリシー */}
      <View style={styles.legalRow}>
        <TouchableOpacity onPress={() => Linking.openURL("https://otetsudai-bank-beta.vercel.app/terms")}>
          <RubyText style={styles.legalLink} parts={[["利用規約", "りようきやく"]]} rubySize={6} />
        </TouchableOpacity>
        <Text style={styles.legalSep}>|</Text>
        <TouchableOpacity onPress={() => Linking.openURL("https://otetsudai-bank-beta.vercel.app/privacy")}>
          <AutoRubyText text="プライバシーポリシー" style={styles.legalLink} rubySize={6} />
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    },
    input: {
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      marginBottom: 12,
      backgroundColor: p.surfaceMuted,
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
