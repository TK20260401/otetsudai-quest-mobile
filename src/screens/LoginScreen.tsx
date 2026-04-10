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
} from "react-native";
import { supabase } from "../lib/supabase";
import type { Family, User } from "../lib/types";
import { verifyPin, loginAsUser, signIn } from "../services/auth";
import { colors } from "../lib/colors";

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
      await loginAsUser(adminUser, adminUser.family_id || "", authData.user.id);
      onLoginSuccess();
    } catch {
      setError("ログインに失敗しました");
    }
    setAdminLoading(false);
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

  // Admin login
  if (step === "admin") {
    return (
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
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

          <TouchableOpacity style={styles.backButton} onPress={goBack}>
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
        <Text style={styles.title}>おこづかいクエスト</Text>
        <Text style={styles.subtitle}>
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
                <Text style={styles.selectText}>
                  {m.role === "parent" ? "👨‍👩‍👧‍👦" : "🧒"} {m.name}
                </Text>
                <Text style={styles.roleText}>
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
    fontSize: 24,
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
    fontSize: 18,
    color: colors.slateDark,
  },
  roleText: {
    fontSize: 12,
    color: colors.slate,
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
});
