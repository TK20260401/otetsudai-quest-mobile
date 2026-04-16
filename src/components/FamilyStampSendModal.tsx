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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import { FAMILY_STAMPS } from "../lib/family-stamps";
import { useKeyboardHeight } from "../lib/useKeyboardHeight";
import type { User } from "../lib/types";
import * as Haptics from "expo-haptics";

type Props = {
  visible: boolean;
  senderId: string;
  familyId: string;
  familyMembers: User[];
  onClose: () => void;
  onSent: () => void;
};

export default function FamilyStampSendModal({
  visible,
  senderId,
  familyId,
  familyMembers,
  onClose,
  onSent,
}: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const keyboardHeight = useKeyboardHeight();

  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [selectedStamp, setSelectedStamp] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const recipients = useMemo(
    () => familyMembers.filter((m) => m.id !== senderId),
    [familyMembers, senderId]
  );

  const canSend = selectedRecipient && (selectedStamp || message.trim().length > 0);

  function resetForm() {
    setSelectedRecipient(null);
    setSelectedStamp(null);
    setMessage("");
  }

  async function handleSend() {
    if (!canSend) return;
    setSending(true);

    const { error } = await supabase.from("otetsudai_family_messages").insert({
      family_id: familyId,
      sender_id: senderId,
      recipient_id: selectedRecipient,
      stamp_id: selectedStamp,
      message: message.trim() || null,
    });

    setSending(false);

    if (!error) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      resetForm();
      onSent();
    }
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modal, { paddingBottom: insets.bottom + 16 }]}>
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* ヘッダー */}
              <View style={styles.headerRow}>
                <Text style={styles.header}>💌 エールを おくる</Text>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.closeBtn}
                  accessibilityLabel="とじる"
                  accessibilityRole="button"
                >
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* 送り先選択 */}
              <Text style={styles.sectionLabel}>だれに おくる？</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.recipientRow}
              >
                {recipients.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.recipientItem,
                      selectedRecipient === m.id && styles.recipientItemSelected,
                    ]}
                    onPress={() => setSelectedRecipient(m.id)}
                    accessibilityLabel={`${m.name}に おくる`}
                    accessibilityRole="button"
                  >
                    <Text style={styles.recipientIcon}>{m.icon}</Text>
                    <Text
                      style={[
                        styles.recipientName,
                        selectedRecipient === m.id && styles.recipientNameSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {m.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* スタンプ選択 */}
              <Text style={styles.sectionLabel}>スタンプを えらぼう</Text>
              <View style={styles.stampGrid}>
                {FAMILY_STAMPS.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.stampItem,
                      selectedStamp === s.id && styles.stampItemSelected,
                    ]}
                    onPress={() =>
                      setSelectedStamp(selectedStamp === s.id ? null : s.id)
                    }
                    accessibilityLabel={s.label}
                    accessibilityRole="button"
                  >
                    <Text style={styles.stampEmoji}>{s.emoji}</Text>
                    <Text
                      style={[
                        styles.stampLabel,
                        selectedStamp === s.id && styles.stampLabelSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* メッセージ入力 */}
              <TextInput
                style={styles.textInput}
                value={message}
                onChangeText={setMessage}
                placeholder="ひとこと メッセージ（なくても OK）"
                placeholderTextColor={palette.textMuted}
                multiline
                maxLength={100}
                onFocus={() => {
                  setTimeout(
                    () => scrollRef.current?.scrollToEnd({ animated: true }),
                    200
                  );
                }}
              />

              {/* 送信ボタン */}
              <TouchableOpacity
                style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!canSend || sending}
                accessibilityLabel="エールを おくる"
                accessibilityRole="button"
              >
                <Text style={styles.sendText}>
                  {sending ? "おくりちゅう..." : "📣 エールを おくる！"}
                </Text>
              </TouchableOpacity>

              <Text style={styles.hint}>
                ※ スタンプ か メッセージの どちらかを いれてね
              </Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: p.overlay,
      justifyContent: "flex-end",
    },
    modalContainer: {
      flex: 1,
      justifyContent: "flex-end",
    },
    modal: {
      backgroundColor: p.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      paddingTop: 16,
      maxHeight: "85%",
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    header: {
      fontSize: rf(20),
      fontWeight: "bold",
      color: p.textStrong,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: p.surfaceMuted,
      justifyContent: "center",
      alignItems: "center",
    },
    closeBtnText: {
      fontSize: 16,
      color: p.textMuted,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: "bold",
      color: p.textStrong,
      marginBottom: 8,
      marginTop: 8,
    },
    recipientRow: {
      gap: 10,
      paddingBottom: 8,
    },
    recipientItem: {
      alignItems: "center",
      backgroundColor: p.surfaceMuted,
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderWidth: 2,
      borderColor: p.border,
      minWidth: 72,
      minHeight: 48,
    },
    recipientItemSelected: {
      borderColor: p.primary,
      backgroundColor: p.primaryLight,
    },
    recipientIcon: {
      fontSize: 28,
    },
    recipientName: {
      fontSize: 12,
      color: p.textBase,
      marginTop: 4,
      fontWeight: "bold",
    },
    recipientNameSelected: {
      color: p.primaryDark,
    },
    stampGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 8,
    },
    stampItem: {
      alignItems: "center",
      backgroundColor: p.surfaceMuted,
      borderRadius: 12,
      padding: 8,
      borderWidth: 2,
      borderColor: p.border,
      width: "23%",
      minHeight: 48,
    },
    stampItemSelected: {
      borderColor: p.primary,
      backgroundColor: p.primaryLight,
    },
    stampEmoji: {
      fontSize: 24,
    },
    stampLabel: {
      fontSize: 9,
      color: p.textMuted,
      marginTop: 2,
      textAlign: "center",
    },
    stampLabelSelected: {
      color: p.primaryDark,
      fontWeight: "bold",
    },
    textInput: {
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      minHeight: 50,
      marginTop: 8,
      marginBottom: 12,
      backgroundColor: p.surfaceMuted,
      color: p.textBase,
    },
    sendButton: {
      backgroundColor: p.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      minHeight: 56,
      justifyContent: "center",
    },
    sendButtonDisabled: {
      backgroundColor: p.textMuted,
    },
    sendText: {
      fontSize: 18,
      fontWeight: "bold",
      color: p.white,
    },
    hint: {
      fontSize: 11,
      color: p.textMuted,
      textAlign: "center",
      marginTop: 8,
      marginBottom: 8,
    },
  });
}
