import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import { AutoRubyText } from "../components/Ruby";
import { useAppAlert } from "../components/AppAlert";

const NUM_KEYS = [
  { label: "1", value: "1", a11y: "いち" },
  { label: "2", value: "2", a11y: "に" },
  { label: "3", value: "3", a11y: "さん" },
  { label: "4", value: "4", a11y: "よん" },
  { label: "5", value: "5", a11y: "ご" },
  { label: "6", value: "6", a11y: "ろく" },
  { label: "7", value: "7", a11y: "なな" },
  { label: "8", value: "8", a11y: "はち" },
  { label: "9", value: "9", a11y: "きゅう" },
  { label: "00", value: "00", a11y: "ぜろぜろ" },
  { label: "0", value: "0", a11y: "ぜろ" },
  { label: "←", value: "back", a11y: "けす" },
] as const;

export default function SpendRequestScreen({
  route,
  navigation,
}: {
  route: any;
  navigation: any;
}) {
  const { childId, walletId, spendingBalance } = route.params as {
    childId: string;
    walletId: string;
    spendingBalance: number;
  };

  const { alert } = useAppAlert();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState<"input" | "confirm">("input");

  const parsedAmount = parseInt(amount, 10) || 0;
  const overBalance = parsedAmount > spendingBalance;
  const canProceed =
    amount.length > 0 && parsedAmount > 0 && !overBalance && purpose.trim().length > 0;

  function handleKeyPress(value: string) {
    if (value === "back") {
      setAmount((prev) => prev.slice(0, -1));
    } else {
      setAmount((prev) => {
        const next = prev + value;
        // Prevent unreasonably long numbers
        if (next.length > 8) return prev;
        return next;
      });
    }
  }

  async function handleSubmit() {
    setSending(true);
    const { error } = await supabase.from("otetsudai_spend_requests").insert({
      child_id: childId,
      wallet_id: walletId,
      amount: parseInt(amount, 10),
      purpose: purpose.trim(),
      status: "pending",
    });
    setSending(false);
    if (error) {
      alert("エラー", "リクエストできませんでした");
      return;
    }
    alert("📩 リクエストおくったよ！", "おやの へんじを まってね！", [
      { text: "OK", onPress: () => navigation.goBack() },
    ]);
  }

  // ── Step: confirm ──
  if (step === "confirm") {
    const remaining = spendingBalance - parsedAmount;
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.header}>
            <AutoRubyText text="かくにん" style={styles.title} rubySize={8} />
          </View>

          <View style={styles.confirmCard}>
            <AutoRubyText
              text="つかう きんがく"
              style={styles.confirmLabel}
              rubySize={7}
            />
            <Text style={styles.confirmAmount}>
              {parsedAmount.toLocaleString()}
              <Text style={styles.confirmYen}>えん</Text>
            </Text>

            <AutoRubyText text="なにに" style={styles.confirmLabel} rubySize={7} />
            <AutoRubyText
              text={`「${purpose.trim()}」`}
              style={styles.confirmPurpose}
              rubySize={7}
            />

            <AutoRubyText text="のこり" style={styles.confirmLabel} rubySize={7} />
            <Text style={styles.confirmRemaining}>
              {remaining.toLocaleString()}えん
            </Text>
          </View>

          <View style={styles.confirmButtons}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep("input")}
              accessibilityRole="button"
              accessibilityLabel="もどる"
            >
              <AutoRubyText
                text="← もどる"
                style={styles.backButtonText}
                rubySize={7}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, sending && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={sending}
              accessibilityRole="button"
              accessibilityLabel="リクエストする"
            >
              <AutoRubyText
                text={sending ? "おくっているよ…" : "📩 リクエストする！"}
                style={styles.submitButtonText}
                rubySize={7}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Step: input ──
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <AutoRubyText text="🛒 つかいたい！" style={styles.title} rubySize={8} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="とじる"
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Balance display */}
          <View style={styles.balanceCard}>
            <AutoRubyText
              text={`つかえる おかね: ${spendingBalance.toLocaleString()}えん`}
              style={styles.balanceText}
              rubySize={7}
            />
          </View>

          {/* Amount display */}
          <View style={styles.amountDisplay}>
            <Text style={styles.amountValue}>
              {amount.length > 0 ? parseInt(amount, 10).toLocaleString() : "0"}
            </Text>
            <Text style={styles.amountYen}>えん</Text>
          </View>

          {overBalance && (
            <AutoRubyText
              text="のこりが たりないよ"
              style={styles.warningText}
              rubySize={7}
            />
          )}

          {/* Number Pad */}
          <View style={styles.numPad}>
            {NUM_KEYS.map((key) => (
              <TouchableOpacity
                key={key.value === "00" ? "double-zero" : key.value}
                style={styles.numKey}
                onPress={() => handleKeyPress(key.value)}
                accessibilityRole="button"
                accessibilityLabel={key.a11y}
              >
                <Text style={styles.numKeyText}>{key.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Purpose input */}
          <View style={styles.purposeSection}>
            <TextInput
              style={styles.purposeInput}
              placeholder="なにに つかいたい？"
              placeholderTextColor={palette.textMuted}
              value={purpose}
              onChangeText={setPurpose}
              maxLength={100}
              returnKeyType="done"
            />
          </View>

          {/* Next button */}
          <TouchableOpacity
            style={[styles.nextButton, !canProceed && styles.buttonDisabled]}
            onPress={() => setStep("confirm")}
            disabled={!canProceed}
            accessibilityRole="button"
            accessibilityLabel="つぎへ"
          >
            <AutoRubyText
              text="つぎへ →"
              style={styles.nextButtonText}
              rubySize={7}
            />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: p.background,
    },
    flex: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },
    container: {
      flex: 1,
      padding: 20,
    },

    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      position: "relative",
    },
    title: {
      fontSize: rf(22),
      fontWeight: "bold",
      color: p.textStrong,
      textAlign: "center",
    },
    closeButton: {
      position: "absolute",
      right: 0,
      top: 0,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: p.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    closeButtonText: {
      fontSize: rf(18),
      color: p.textMuted,
      fontWeight: "bold",
    },

    // Balance card
    balanceCard: {
      backgroundColor: p.walletSpendBg,
      borderRadius: 14,
      padding: 14,
      alignItems: "center",
      marginBottom: 20,
      borderWidth: 1,
      borderColor: p.walletSpendBorder,
    },
    balanceText: {
      fontSize: rf(16),
      fontWeight: "bold",
      color: p.walletSpendText,
    },

    // Amount display
    amountDisplay: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "center",
      marginBottom: 8,
    },
    amountValue: {
      fontSize: rf(36),
      fontWeight: "bold",
      color: p.textStrong,
    },
    amountYen: {
      fontSize: rf(20),
      fontWeight: "bold",
      color: p.textBase,
      marginLeft: 4,
    },

    // Warning
    warningText: {
      fontSize: rf(14),
      color: p.red,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 8,
    },

    // Number pad
    numPad: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 10,
      marginBottom: 20,
      marginTop: 8,
    },
    numKey: {
      minHeight: 56,
      minWidth: 56,
      width: "28%",
      borderRadius: 12,
      backgroundColor: p.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
    },
    numKeyText: {
      fontSize: rf(24),
      fontWeight: "bold",
      color: p.textStrong,
    },

    // Purpose input
    purposeSection: {
      marginBottom: 20,
    },
    purposeInput: {
      backgroundColor: p.surfaceMuted,
      borderRadius: 12,
      padding: 14,
      fontSize: rf(16),
      color: p.textBase,
      borderWidth: 1,
      borderColor: p.border,
    },

    // Next button
    nextButton: {
      backgroundColor: p.walletSpend,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 52,
    },
    nextButtonText: {
      fontSize: rf(18),
      fontWeight: "bold",
      color: p.white,
    },

    // Disabled state
    buttonDisabled: {
      opacity: 0.4,
    },

    // ── Confirm step ──
    confirmCard: {
      backgroundColor: p.surfaceMuted,
      borderRadius: 16,
      padding: 24,
      marginBottom: 32,
    },
    confirmLabel: {
      fontSize: rf(14),
      color: p.textMuted,
      fontWeight: "600",
      marginBottom: 4,
      marginTop: 16,
    },
    confirmAmount: {
      fontSize: rf(32),
      fontWeight: "bold",
      color: p.walletSpendText,
    },
    confirmYen: {
      fontSize: rf(18),
      fontWeight: "bold",
    },
    confirmPurpose: {
      fontSize: rf(18),
      fontWeight: "bold",
      color: p.textStrong,
    },
    confirmRemaining: {
      fontSize: rf(18),
      fontWeight: "bold",
      color: p.textBase,
    },

    // Confirm buttons
    confirmButtons: {
      flexDirection: "row",
      gap: 12,
    },
    backButton: {
      flex: 1,
      backgroundColor: p.surfaceMuted,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 52,
      borderWidth: 1,
      borderColor: p.border,
    },
    backButtonText: {
      fontSize: rf(16),
      fontWeight: "bold",
      color: p.textMuted,
    },
    submitButton: {
      flex: 1,
      backgroundColor: p.walletSpend,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 52,
    },
    submitButtonText: {
      fontSize: rf(16),
      fontWeight: "bold",
      color: p.white,
    },
  });
}
