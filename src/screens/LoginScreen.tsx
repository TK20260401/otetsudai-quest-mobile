import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import { supabase } from "../lib/supabase";
import type { Family, User } from "../lib/types";
import { verifyPin, loginAsUser, signIn } from "../services/auth";
import { colors } from "../lib/colors";
import { rf } from "../lib/responsive";

type LoginStep = "family" | "member" | "pin" | "admin";

type Props = {
  onLoginSuccess: () => void;
};

export default function LoginScreen({ onLoginSuccess }: Props) {
  const [step, setStep] = useState<LoginStep>("family");
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
      setError("PINがちがいます");
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
        setError("メールアドレスまたはパスワードが正しくありません");
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
        setError("管理者権限がありません");
        setAdminLoading(false);
        return;
      }
      setAdminLoggedIn(true);
      await loadFamilies();
    } catch {
      setError("ログインに失敗しました");
    }
    setAdminLoading(false);
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
      Alert.alert("追加しました", `${newFamilyName.trim()} を追加しました`);
      await loadFamilies();
    } catch {
      Alert.alert("エラー", "家族の追加に失敗しました");
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
    } else if (step === "admin") {
      setStep("family");
      setAdminEmail("");
      setAdminPassword("");
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
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
              <Text style={styles.icon}>🔧</Text>
              <Text style={styles.titleAdmin}>管理者ログイン</Text>

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
                placeholder="パスワード"
                value={adminPassword}
                onChangeText={setAdminPassword}
                secureTextEntry
                onSubmitEditing={handleAdminLogin}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.button, styles.buttonAdmin]}
                onPress={handleAdminLogin}
                disabled={adminLoading || !adminEmail || !adminPassword}
              >
                <Text style={styles.buttonText}>
                  {adminLoading ? "ログインちゅう..." : "ログイン"}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.icon}>🏠</Text>
              <Text style={styles.titleAdmin}>家族管理</Text>

              {/* 家族一覧 */}
              {families.map((f) => (
                <View key={f.id} style={styles.familyRow}>
                  <Text style={styles.familyName}>🏠 {f.name}</Text>
                </View>
              ))}

              {/* 家族追加 */}
              <View style={styles.addFamilyRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="新しい家族名（例: 田中家）"
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
                  {addingFamily ? "追加中..." : "＋ 家族を追加"}
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

        {/* Step: Family selection */}
        {step === "family" && (
          <>
            <Text style={styles.label}>おうちをえらんでね</Text>
            {families.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={styles.selectButton}
                onPress={() => handleFamilySelect(f)}
              >
                <Text style={styles.selectText}>🏠 {f.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.adminLink}
              onPress={() => setStep("admin")}
            >
              <Text style={styles.adminLinkText}>🔧 管理者ログイン</Text>
            </TouchableOpacity>
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
              <Text style={styles.buttonText}>ログイン</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* 利用規約・プライバシーポリシー */}
      <View style={styles.legalRow}>
        <Text style={styles.legalLink} onPress={() => Linking.openURL("https://otetsudai-bank-beta.vercel.app/terms")}>
          利用規約
        </Text>
        <Text style={styles.legalSep}>|</Text>
        <Text style={styles.legalLink} onPress={() => Linking.openURL("https://otetsudai-bank-beta.vercel.app/privacy")}>
          プライバシーポリシー
        </Text>
      </View>
    </ScrollView>
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
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: colors.slateLight,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    shadowColor: colors.black,
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
    color: colors.primaryDark,
    marginBottom: 4,
  },
  titleAdmin: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    color: colors.slateDark,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: colors.slate,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: colors.slateDark,
  },
  hint: {
    fontSize: 12,
    color: colors.slate,
    marginBottom: 12,
  },
  selectButton: {
    borderWidth: 1,
    borderColor: colors.amberDark,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    fontSize: rf(18),
    color: colors.slateDark,
    flexShrink: 1,
  },
  roleText: {
    fontSize: rf(12),
    color: colors.slate,
    marginLeft: 4,
  },
  pinInput: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 28,
    letterSpacing: 12,
    marginBottom: 16,
    backgroundColor: colors.grayLight,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: colors.grayLight,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 4,
  },
  buttonPrimary: {
    backgroundColor: colors.amber,
  },
  buttonAdmin: {
    backgroundColor: colors.slateDark,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  error: {
    color: colors.red,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 14,
    color: colors.slate,
  },
  adminLink: {
    marginTop: 20,
    alignItems: "center",
  },
  adminLinkText: {
    fontSize: 12,
    color: colors.gray,
  },
  familyRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    backgroundColor: colors.grayLight,
  },
  familyName: {
    fontSize: 16,
    color: colors.slateDark,
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
    color: colors.primary,
    textDecorationLine: "underline",
  },
  legalSep: {
    fontSize: 11,
    color: colors.slate,
  },
});
