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
import { AutoRubyText, RubyText } from "../components/Ruby";
import { useAppAlert } from "../components/AppAlert";
import { PixelCoinIcon, PixelHouseIcon } from "../components/PixelIcons";
import ShakeView from "../components/ShakeView";

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
    alert("📩 リクエスト送ったよ！", "冒険団マスターの返事を待ってね！", [
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
            <AutoRubyText text="確認" style={styles.title} rubySize={8} />
          </View>

          <View style={styles.confirmCard}>
            <AutoRubyText
              text="使う金額"
              style={styles.confirmLabel}
              rubySize={7}
            />
            <Text style={styles.confirmAmount}>
              {parsedAmount.toLocaleString()}
              <Text style={styles.confirmYen}>コロ</Text>
            </Text>

            <AutoRubyText text="何に" style={styles.confirmLabel} rubySize={7} />
            <AutoRubyText
              text={`「${purpose.trim()}」`}
              style={styles.confirmPurpose}
              rubySize={7}
            />

            <AutoRubyText text="残り" style={styles.confirmLabel} rubySize={7} />
            <Text style={styles.confirmRemaining}>
              {remaining.toLocaleString()}コロ
            </Text>
          </View>

          <View style={styles.confirmButtons}>
            <TouchableOpacity
              style={styles.confirmBackBtn}
              onPress={() => setStep("input")}
              accessibilityRole="button"
              accessibilityLabel="もどる"
            >
              <AutoRubyText
                text="← 戻る"
                style={styles.confirmBackBtnText}
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
                text={sending ? "送っているよ…" : "📩 リクエストする！"}
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate("ChildDashboard", { childId })}
            accessibilityRole="button"
            accessibilityLabel="戻る"
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <PixelHouseIcon size={12} />
              <AutoRubyText text="← 戻る" style={styles.backText} rubySize={5} noWrap />
            </View>
          </TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1, justifyContent: "center", marginTop: -4 }}>
            <View style={{ marginTop: 12 }}><PixelCoinIcon size={18} /></View>
            <RubyText parts={["オーダー！"]} style={styles.title} rubySize={6} noWrap />
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          minimumZoomScale={1}
          maximumZoomScale={3}
          bouncesZoom
        >
          {/* Balance display */}
          <View style={styles.balanceCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <PixelCoinIcon size={20} />
              <AutoRubyText
                text={`手持ちコイン: ${spendingBalance.toLocaleString()}コロ`}
                style={styles.balanceText}
                rubySize={7}
              />
            </View>
          </View>

          {/* Amount display */}
          <ShakeView shake={overBalance}>
            <View style={styles.amountDisplay}>
              <Text style={styles.amountValue}>
                {amount.length > 0 ? parseInt(amount, 10).toLocaleString() : "0"}
              </Text>
              <Text style={styles.amountYen}>コロ</Text>
            </View>
          </ShakeView>

          {overBalance && (
            <AutoRubyText
              text="残りが足りないよ"
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
            <RubyText parts={[["何", "なに"], "に", ["使", "つか"], "いたい？"]} style={styles.purposeLabel} rubySize={5} noWrap />
            <TextInput
              style={styles.purposeInput}
              placeholder=""
              placeholderTextColor={palette.textPlaceholder}
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
              text="次へ →"
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
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 10,
      backgroundColor: p.background,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
    },
    title: {
      fontSize: rf(18),
      fontWeight: "bold",
      color: p.textStrong,
      textAlign: "center",
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: p.primary,
      backgroundColor: p.background,
    },
    backText: {
      fontSize: 8,
      fontWeight: "bold",
      color: p.textMuted,
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
    purposeLabel: {
      fontSize: 12,
      color: p.textMuted,
      marginBottom: 4,
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
      fontWeight: "bold",
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
    confirmBackBtn: {
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
    confirmBackBtnText: {
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
