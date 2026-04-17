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
import { CHILD_STAMPS } from "../lib/child-stamps";
import { getStampById } from "../lib/stamps";
import { useKeyboardHeight } from "../lib/useKeyboardHeight";
import { PixelLetterIcon, PixelTargetIcon, PixelCoinIcon } from "./PixelIcons";

type UnreadLog = {
  id: string;
  taskTitle: string;
  rewardAmount: number;
  parentStamp: string | null;
  parentMessage: string | null;
};

type Props = {
  logs: UnreadLog[];
  onAllDone: () => void;
  onSkip?: () => void;
};

export default function ChildReactionModal({ logs, onAllDone, onSkip }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedStamp, setSelectedStamp] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const keyboardHeight = useKeyboardHeight();
  const insets = useSafeAreaInsets();

  if (logs.length === 0) return null;
  const log = logs[currentIndex];
  const parentStampDef = log.parentStamp ? getStampById(log.parentStamp) : null;
  const canSend = selectedStamp || message.trim().length > 0;

  async function handleSend() {
    if (!canSend) return;
    setSending(true);

    await supabase
      .from("otetsudai_task_logs")
      .update({
        child_reaction_stamp: selectedStamp,
        child_reaction_message: message.trim() || null,
        child_reaction_at: new Date().toISOString(),
      })
      .eq("id", log.id);

    setSending(false);
    setSelectedStamp(null);
    setMessage("");

    if (currentIndex < logs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onAllDone();
    }
  }

  return (
    <Modal visible animationType="slide" transparent={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 20,
              paddingBottom: insets.bottom + 80,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator
          alwaysBounceVertical
        >
          {/* カウンター */}
          {logs.length > 1 && (
            <Text style={styles.counter}>
              {currentIndex + 1} / {logs.length}
            </Text>
          )}

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <PixelLetterIcon size={22} />
            <Text style={styles.header} adjustsFontSizeToFit numberOfLines={1}>おやからの メッセージ</Text>
          </View>

          {/* 親メッセージ表示 */}
          <View style={styles.parentCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <PixelTargetIcon size={16} />
              <Text style={styles.questName}>{log.taskTitle}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <PixelCoinIcon size={16} />
              <Text style={styles.rewardText}>{log.rewardAmount}えん</Text>
            </View>

            {parentStampDef && (
              <View style={styles.parentStampRow}>
                <Text style={styles.parentStampEmoji}>{parentStampDef.emoji}</Text>
                <Text style={styles.parentStampLabel}>{parentStampDef.label}</Text>
              </View>
            )}

            {log.parentMessage && (
              <View style={styles.parentMsgBubble}>
                <Text style={styles.parentMsgText}>「{log.parentMessage}」</Text>
              </View>
            )}
          </View>

          {/* 区切り */}
          <View style={styles.divider}>
            <Text style={styles.dividerText}>↓ おへんじ しよう！ ↓</Text>
          </View>

          {/* スタンプ選択 */}
          <Text style={styles.sectionLabel}>スタンプを えらんでね</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stampRow}
          >
            {CHILD_STAMPS.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.stampItem,
                  selectedStamp === s.id && styles.stampItemSelected,
                ]}
                onPress={() =>
                  setSelectedStamp(selectedStamp === s.id ? null : s.id)
                }
              >
                <Text style={styles.stampEmoji}>{s.emoji}</Text>
                <Text
                  style={[
                    styles.stampLabel,
                    selectedStamp === s.id && styles.stampLabelSelected,
                  ]}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* テキスト入力 */}
          <TextInput
            style={styles.textInput}
            value={message}
            onChangeText={setMessage}
            placeholder="おやに ひとこと！（にゅうりょく しなくても OK）"
            multiline
            maxLength={100}
            onFocus={() => {
              setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
            }}
          />

          {/* 送信ボタン */}
          <TouchableOpacity
            style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!canSend || sending}
          >
            {sending ? (
              <Text style={styles.sendText}>おくりちゅう...</Text>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <PixelLetterIcon size={18} />
                <Text style={styles.sendText}>おくる！</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>
            ※ スタンプ か メッセージの どちらかは かならず いれてね
          </Text>

          {onSkip && (
            <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
              <Text style={styles.skipText}>あとで へんじする</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: p.background,
    },
    scrollContent: {
      paddingHorizontal: 20,
    },
    counter: {
      fontSize: 13,
      color: p.textMuted,
      textAlign: "center",
      marginBottom: 4,
    },
    header: {
      fontSize: rf(22),
      fontWeight: "bold",
      color: p.textStrong,
      textAlign: "center",
      marginBottom: 16,
    },
    parentCard: {
      backgroundColor: p.accentLight,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: p.accent,
      alignItems: "center",
    },
    questName: {
      fontSize: 16,
      fontWeight: "bold",
      color: p.textStrong,
      marginBottom: 4,
    },
    rewardText: {
      fontSize: 14,
      color: p.accent,
      marginBottom: 12,
    },
    parentStampRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    parentStampEmoji: { fontSize: 40 },
    parentStampLabel: {
      fontSize: 18,
      fontWeight: "bold",
      color: p.textStrong,
    },
    parentMsgBubble: {
      backgroundColor: p.white,
      borderRadius: 12,
      padding: 12,
      width: "100%",
      marginTop: 8,
    },
    parentMsgText: {
      fontSize: 15,
      color: p.primaryDark,
      textAlign: "center",
    },
    divider: {
      alignItems: "center",
      marginVertical: 16,
    },
    dividerText: {
      fontSize: 14,
      fontWeight: "bold",
      color: p.primary,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: "bold",
      color: p.textStrong,
      marginBottom: 8,
    },
    stampRow: {
      gap: 8,
      paddingBottom: 8,
    },
    stampItem: {
      alignItems: "center",
      backgroundColor: p.white,
      borderRadius: 12,
      padding: 10,
      borderWidth: 2,
      borderColor: p.border,
      minWidth: 72,
    },
    stampItemSelected: {
      borderColor: p.primary,
      backgroundColor: p.primaryLight,
    },
    stampEmoji: { fontSize: 28 },
    stampLabel: {
      fontSize: 10,
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
      marginTop: 12,
      marginBottom: 12,
      backgroundColor: p.surfaceMuted,
    },
    sendButton: {
      backgroundColor: p.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
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
    },
    skipButton: {
      marginTop: 16,
      paddingVertical: 12,
      alignItems: "center",
    },
    skipText: {
      fontSize: 13,
      color: p.textMuted,
      textDecorationLine: "underline",
    },
  });
}
