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
import type { Task } from "../lib/types";
import { useAppAlert } from "./AppAlert";
import { RubyText, AutoRubyText } from "./Ruby";
import { PixelCoinIcon } from "./PixelIcons";
import RubyPlaceholderInput from "./RubyPlaceholderInput";

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
      alert("⚠️", "今のお駄賃より大きい金額を入れてね");
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
    alert("📩 リクエスト送ったよ！", "冒険団マスターの返事を待ってね！");
    onSent();
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
            <View style={styles.titleRow}>
              <PixelCoinIcon size={22} />
              <RubyText
                style={styles.title}
                parts={[["値上", "ねあ"], "げリクエスト"]}
                rubySize={6}
                noWrap
              />
            </View>
            <AutoRubyText
              text={task.title}
              style={styles.taskName}
              rubySize={5}
              noWrap
            />

            <View style={styles.currentRow}>
              <RubyText
                style={styles.currentLabel}
                parts={[["今", "いま"], "の お", ["駄賃", "だちん"]]}
                rubySize={5}
                noWrap
              />
              <RubyText
                style={styles.currentAmount}
                parts={[`${task.reward_amount}`, "コロ"]}
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
              <RubyPlaceholderInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="number-pad"
                placeholderParts={[["金額", "きんがく"]]}
                placeholderRubySize={5}
                placeholderTextColor={palette.textPlaceholder}
                textAlign="center"
              />
              <RubyText
                style={styles.yen}
                parts={["コロ"]}
                rubySize={5}
                noWrap
              />
            </View>

            <RubyPlaceholderInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholderParts={[["冒険団", "ぼうけんだん"], "マスターに", ["一言", "ひとこと"], "（なくてもOK）"]}
              placeholderRubySize={4}
              placeholderNoWrap
              placeholderTextColor={palette.textPlaceholder}
              multiline
              maxLength={100}
              onFocus={() => {
                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
              }}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                accessibilityLabel="やめる"
                accessibilityRole="button"
              >
                <RubyText
                  style={styles.cancelText}
                  parts={[["止", "や"], "める"]}
                  rubySize={5}
                  noWrap
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendButton, sending && { opacity: 0.5 }]}
                onPress={handleSend}
                disabled={sending}
                accessibilityLabel={sending ? "送信中" : "リクエストを送る"}
                accessibilityRole="button"
              >
                {sending ? (
                  <RubyText
                    style={styles.sendText}
                    parts={[["送", "おく"], "り", ["中", "ちゅう"], "..."]}
                    rubySize={5}
                    noWrap
                  />
                ) : (
                  <Text
                    style={styles.sendText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    📩 リクエスト！
                  </Text>
                )}
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
      borderRadius: 16,
      padding: 20,
      backgroundColor: p.background,
      borderWidth: 1.5,
      borderColor: p.border,
    },
    titleRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 6,
      marginBottom: 8,
    },
    title: {
      fontSize: rf(20),
      fontWeight: "bold",
      color: p.textStrong,
      textAlign: "center",
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
      borderRadius: 10,
      padding: 12,
      borderWidth: 1.5,
      borderColor: p.border,
    },
    currentLabel: { fontSize: 14, color: p.textMuted },
    currentAmount: { fontSize: 18, fontWeight: "bold", color: p.textStrong },
    arrowRow: { alignItems: "center", marginVertical: 4 },
    arrow: { fontSize: 24, color: p.primary },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
      borderWidth: 1.5,
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
      borderWidth: 1.5,
      borderColor: p.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      minHeight: 50,
      marginBottom: 16,
      color: p.textStrong,
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
      borderWidth: 1.5,
      borderColor: p.border,
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
