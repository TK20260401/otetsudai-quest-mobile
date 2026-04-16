import React, { useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import { useKeyboardHeight } from "../lib/useKeyboardHeight";
import { useAppAlert } from "./AppAlert";
import { AutoRubyText } from "./Ruby";

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
  const scrollRef = useRef<ScrollView>(null);
  const keyboardHeight = useKeyboardHeight();

  async function handleSubmit() {
    if (!title.trim()) {
      alert("⚠️", "もくひょうの なまえを いれてね");
      return;
    }
    const parsed = parseInt(targetAmount);
    if (!parsed || parsed <= 0) {
      alert("⚠️", "きんがくを ただしく いれてね");
      return;
    }
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
    alert("🐷 もくひょう できたよ！", "ちょきん がんばろう！");
    setTitle("");
    setTargetAmount("");
    onCreated();
  }

  return (
    <Modal transparent animationType="slide" visible={visible}>
      <View style={styles.overlay}>
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
            <AutoRubyText
              text="🐷 ちょきん目標をつくる"
              style={styles.title}
              rubySize={8}
            />

            <Text style={styles.inputLabel}>何を 買いたい？</Text>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="何を 買いたい？（例：ゲーム、自転車）"
              placeholderTextColor={palette.textMuted}
              maxLength={50}
              accessibilityLabel="貯金 目標の 名前"
              onFocus={() => {
                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
              }}
            />

            <Text style={styles.inputLabel}>いくら 貯める？</Text>
            <View style={styles.amountRow}>
              <TextInput
                style={styles.amountInput}
                value={targetAmount}
                onChangeText={setTargetAmount}
                keyboardType="number-pad"
                placeholder="金額"
                placeholderTextColor={palette.textMuted}
                textAlign="center"
                accessibilityLabel="目標 金額"
              />
              <Text style={styles.yen}>円</Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                accessibilityLabel="やめる"
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>やめる</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, submitting && { opacity: 0.5 }]}
                onPress={handleSubmit}
                disabled={submitting}
                accessibilityLabel="ちょきん もくひょうを つくる"
                accessibilityRole="button"
              >
                <Text style={styles.submitText}>
                  {submitting ? "つくっているよ..." : "つくる！"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
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
      backgroundColor: p.white,
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
      borderWidth: 1,
      borderColor: p.border,
    },
    cancelText: {
      fontSize: 16,
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
  });
}
