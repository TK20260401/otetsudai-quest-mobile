import React, { useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import { useKeyboardHeight } from "../lib/useKeyboardHeight";
import { useAppAlert } from "./AppAlert";
import { AutoRubyText, RubyText } from "./Ruby";
import { PixelPiggyIcon, PixelWarningIcon } from "./PixelIcons";

type Props = {
  visible: boolean;
  childId: string;
  onClose: () => void;
  onCreated: () => void;
};

export default function SavingGoalModal({ visible, childId, onClose, onCreated }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const { alert } = useAppAlert();
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [amountError, setAmountError] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const keyboardHeight = useKeyboardHeight();

  async function handleSubmit() {
    const noTitle = !title.trim();
    const parsed = parseInt(targetAmount);
    const noAmount = !parsed || parsed <= 0;
    setTitleError(noTitle);
    setAmountError(noAmount);
    if (noTitle || noAmount) return;
    setSubmitting(true);
    const { error } = await supabase.from("otetsudai_saving_goals").insert({
      child_id: childId,
      title: title.trim(),
      target_amount: parsed,
      is_achieved: false,
    });
    setSubmitting(false);
    if (error) {
      alert("⚠️", "エラーが おきました。もういちど ためしてね");
      return;
    }
    alert("🗺️ お宝マップ 完成！", "目標に向かって がんばろう！");
    setTitle("");
    setTargetAmount("");
    setTitleError(false);
    setAmountError(false);
    onCreated();
  }

  return (
    <Modal transparent animationType="slide" visible={visible}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            { flexGrow: 1, justifyContent: "center" },
            keyboardHeight > 0 && { paddingBottom: keyboardHeight },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View style={styles.card}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <PixelPiggyIcon size={22} />
              <RubyText parts={["お", ["宝", "たから"], "マップを ", ["作", "つく"], "る"]} style={styles.title} rubySize={8} />
            </View>

            <RubyText parts={[["何", "なに"], "を ", ["手", "て"], "に", ["入", "い"], "れたい？"]} style={styles.inputLabel} rubySize={6} />
            <TextInput
              style={[styles.titleInput, titleError && styles.inputError]}
              value={title}
              onChangeText={(t) => { setTitle(t); setTitleError(false); }}
              placeholder={"例（れい）：\n自転車（じてんしゃ）、\n本（ほん）"}
              multiline
              placeholderTextColor={palette.textPlaceholder}
              maxLength={50}
              accessibilityLabel="お宝マップの 名前"
              onFocus={() => {
                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
              }}
            />
            {titleError && <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: -12, marginBottom: 12 }}><PixelWarningIcon size={14} /><AutoRubyText text="名前を入れてね" style={[styles.errorText, { marginTop: 0, marginBottom: 0 }]} rubySize={5} /></View>}

            <RubyText parts={["いくら ", ["集", "あつ"], "める？"]} style={styles.inputLabel} rubySize={6} />
            <View style={styles.amountRow}>
              <TextInput
                style={[styles.amountInput, amountError && styles.inputError]}
                value={targetAmount}
                onChangeText={(t) => { setTargetAmount(t); setAmountError(false); }}
                keyboardType="number-pad"
                placeholder="コイン（まいすう）"
                placeholderTextColor={palette.textPlaceholder}
                textAlign="center"
                accessibilityLabel="目標コイン"
              />
              <Text style={styles.yen}>コロ</Text>
            </View>
            {amountError && <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: -12, marginBottom: 12 }}><PixelWarningIcon size={14} /><AutoRubyText text="コインを入れてね" style={[styles.errorText, { marginTop: 0, marginBottom: 0 }]} rubySize={5} /></View>}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                accessibilityLabel="撤退"
                accessibilityRole="button"
              >
                <RubyText parts={[["撤退", "てったい"]]} style={styles.cancelText} rubySize={4} noWrap />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, submitting && { opacity: 0.5 }]}
                onPress={handleSubmit}
                disabled={submitting}
                accessibilityLabel="お宝マップを作る"
                accessibilityRole="button"
              >
                <Text style={styles.submitText}>
                  {submitting ? "つくっているよ..." : "作る！"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: p.overlay,
      padding: 20,
    },
    card: {
      backgroundColor: p.surface,
      borderRadius: 16,
      padding: 20,
    },
    title: {
      fontSize: rf(20),
      fontWeight: "bold",
      color: p.textStrong,
      textAlign: "center",
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      color: p.textMuted,
      marginBottom: 6,
    },
    titleInput: {
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      minHeight: 48,
      marginBottom: 16,
      backgroundColor: p.surfaceMuted,
      color: p.textStrong,
    },
    amountRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    amountInput: {
      flex: 1,
      fontSize: 22,
      fontWeight: "bold",
      color: p.textStrong,
      borderWidth: 2,
      borderColor: p.primary,
      borderRadius: 10,
      padding: 10,
      minHeight: 48,
      backgroundColor: p.surfaceMuted,
    },
    yen: {
      fontSize: 18,
      color: p.primary,
      fontWeight: "bold",
      marginLeft: 8,
    },
    buttonRow: {
      flexDirection: "row",
      gap: 10,
    },
    cancelButton: {
      flex: 1,
      padding: 14,
      minHeight: 48,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.surfaceMuted,
    },
    cancelText: {
      fontSize: 13,
      fontWeight: "bold",
      color: p.textMuted,
    },
    submitButton: {
      flex: 2,
      padding: 14,
      minHeight: 48,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.primary,
    },
    submitText: {
      fontSize: 16,
      fontWeight: "bold",
      color: p.white,
    },
    inputError: {
      borderColor: p.red,
      borderWidth: 2,
    },
    errorText: {
      color: p.red,
      fontSize: 12,
      fontWeight: "bold",
      marginTop: -12,
      marginBottom: 12,
    },
  });
}
