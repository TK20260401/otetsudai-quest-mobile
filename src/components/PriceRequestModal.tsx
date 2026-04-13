import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/colors";
import { useKeyboardHeight } from "../lib/useKeyboardHeight";
import type { Task } from "../lib/types";

type Props = {
  visible: boolean;
  task: Task;
  onClose: () => void;
  onSent: () => void;
};

export default function PriceRequestModal({ visible, task, onClose, onSent }: Props) {
  const [amount, setAmount] = useState(String(task.reward_amount + 10));
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const keyboardHeight = useKeyboardHeight();

  async function handleSend() {
    const proposed = parseInt(amount);
    if (!proposed || proposed <= task.reward_amount) {
      Alert.alert("⚠️", "いまの おだちんより おおきい きんがくを いれてね");
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
    Alert.alert("📩 リクエストおくったよ！", "おやの へんじを まってね！");
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
            <Text style={styles.title}>💰 ねあげリクエスト</Text>
            <Text style={styles.taskName}>{task.title}</Text>

            <View style={styles.currentRow}>
              <Text style={styles.currentLabel}>いまの おだちん</Text>
              <Text style={styles.currentAmount}>{task.reward_amount}えん</Text>
            </View>

            <View style={styles.arrowRow}>
              <Text style={styles.arrow}>↓</Text>
            </View>

            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>きぼうの きんがく</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="number-pad"
                placeholder="きんがく"
                textAlign="center"
              />
              <Text style={styles.yen}>えん</Text>
            </View>

            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder="おやに ひとこと！（にゅうりょく しなくても OK）"
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
                <Text style={styles.sendText}>
                  {sending ? "おくりちゅう..." : "📩 リクエスト！"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.slateDark,
    textAlign: "center",
    marginBottom: 8,
  },
  taskName: {
    fontSize: 16,
    color: colors.slate,
    textAlign: "center",
    marginBottom: 16,
  },
  currentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.grayLight,
    borderRadius: 10,
    padding: 12,
  },
  currentLabel: { fontSize: 14, color: colors.slate },
  currentAmount: { fontSize: 18, fontWeight: "bold", color: colors.slateDark },
  arrowRow: { alignItems: "center", marginVertical: 4 },
  arrow: { fontSize: 24, color: colors.primary },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  inputLabel: { fontSize: 14, color: colors.primary, flex: 1 },
  amountInput: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.primaryDark,
    width: 80,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    padding: 4,
  },
  yen: { fontSize: 16, color: colors.primary, marginLeft: 4 },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 50,
    marginBottom: 16,
    backgroundColor: colors.grayLight,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: { fontSize: 16, color: colors.slate },
  sendButton: {
    flex: 2,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: colors.primary,
  },
  sendText: { fontSize: 16, fontWeight: "bold", color: colors.white },
});
