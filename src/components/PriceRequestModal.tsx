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
import type { Task } from "../lib/types";
import { useAppAlert } from "./AppAlert";
import { RubyText } from "./Ruby";

type Props = {
  visible: boolean;
  task: Task;
  onClose: () => void;
  onSent: () => void;
};

export default function PriceRequestModal({ visible, task, onClose, onSent }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const { alert } = useAppAlert();
  const [amount, setAmount] = useState(String(task.reward_amount + 10));
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const keyboardHeight = useKeyboardHeight();

  async function handleSend() {
    const proposed = parseInt(amount);
    if (!proposed || proposed <= task.reward_amount) {
      alert("⚠️", "いまの おだちんより おおきい きんがくを いれてね");
      return;
    }
    setSending(true);
    await supabase
      .from("otetsudai_tasks")
      .update({
        proposed_reward: proposed,
        proposal_status: "pending",
        proposal_message: message || null,
      })
      .eq("id", task.id);
    setSending(false);
    alert("📩 リクエストおくったよ！", "おやの へんじを まってね！");
    onSent();
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
            <RubyText
              style={styles.title}
              parts={["💰 ", ["値上", "ねあ"], "げリクエスト"]}
              rubySize={6}
              noWrap
            />
            <Text style={styles.taskName} numberOfLines={1} adjustsFontSizeToFit>{task.title}</Text>

            <View style={styles.currentRow}>
              <RubyText
                style={styles.currentLabel}
                parts={[["今", "いま"], "の お", ["駄賃", "だちん"]]}
                rubySize={5}
                noWrap
              />
              <RubyText
                style={styles.currentAmount}
                parts={[`${task.reward_amount}`, ["円", "えん"]]}
                rubySize={5}
                noWrap
              />
            </View>

            <View style={styles.arrowRow}>
              <Text style={styles.arrow}>↓</Text>
            </View>

            <View style={styles.inputRow}>
              <RubyText
                style={styles.inputLabel}
                parts={[["希望", "きぼう"], "の ", ["金額", "きんがく"]]}
                rubySize={5}
                noWrap
              />
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="number-pad"
                placeholder="金額"
                placeholderTextColor={palette.textPlaceholder}
                textAlign="center"
              />
              <RubyText
                style={styles.yen}
                parts={[["円", "えん"]]}
                rubySize={5}
                noWrap
              />
            </View>

            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder="親にひとこと！（入力しなくてもOK）"
              placeholderTextColor={palette.textPlaceholder}
              multiline
              maxLength={100}
              onFocus={() => {
                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
              }}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>やめる</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendButton, sending && { opacity: 0.5 }]}
                onPress={handleSend}
                disabled={sending}
              >
                {sending ? (
                  <RubyText
                    style={styles.sendText}
                    parts={[["送", "おく"], "り", ["中", "ちゅう"], "..."]}
                    rubySize={5}
                    noWrap
                  />
                ) : (
                  <Text style={styles.sendText}>📩 リクエスト！</Text>
                )}
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
      backgroundColor: p.surface,
      borderRadius: 16,
      padding: 20,
    },
    title: {
      fontSize: rf(20),
      fontWeight: "bold",
      color: p.textStrong,
      textAlign: "center",
      marginBottom: 8,
    },
    taskName: {
      fontSize: 16,
      color: p.textMuted,
      textAlign: "center",
      marginBottom: 16,
    },
    currentRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: p.surfaceMuted,
      borderRadius: 10,
      padding: 12,
    },
    currentLabel: { fontSize: 14, color: p.textMuted },
    currentAmount: { fontSize: 18, fontWeight: "bold", color: p.textStrong },
    arrowRow: { alignItems: "center", marginVertical: 4 },
    arrow: { fontSize: 24, color: p.primary },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: p.primaryLight,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: p.primary,
    },
    inputLabel: { fontSize: 14, color: p.primary, flex: 1 },
    amountInput: {
      fontSize: 22,
      fontWeight: "bold",
      color: p.primaryDark,
      width: 80,
      borderBottomWidth: 2,
      borderBottomColor: p.primary,
      padding: 4,
    },
    yen: { fontSize: 16, color: p.primary, marginLeft: 4 },
    messageInput: {
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      minHeight: 50,
      marginBottom: 16,
      backgroundColor: p.surfaceMuted,
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
    cancelText: { fontSize: 16, fontWeight: "bold", color: p.textMuted },
    sendButton: {
      flex: 2,
      padding: 14,
      minHeight: 48,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.primary,
    },
    sendText: { fontSize: 16, fontWeight: "bold", color: p.white },
  });
}
