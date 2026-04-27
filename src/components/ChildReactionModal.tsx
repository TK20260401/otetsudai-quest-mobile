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
import { useAppAlert } from "./AppAlert";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import { CHILD_STAMPS } from "../lib/child-stamps";
import { getStampById } from "../lib/stamps";
import { useKeyboardHeight } from "../lib/useKeyboardHeight";
import { PixelLetterIcon, PixelTargetIcon, PixelCoinIcon } from "./PixelIcons";
import { AutoRubyText } from "./Ruby";
import StampSvg from "./StampSvg";

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
  const { alert } = useAppAlert();

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
  // スタンプ・メッセージ単体/併用いずれでも送信可
  const canSend = Boolean(selectedStamp) || message.trim().length > 0;

  async function handleSend() {
    if (!canSend || sending) return;
    setSending(true);

    const { error, data } = await supabase
      .from("otetsudai_task_logs")
      .update({
        child_reaction_stamp: selectedStamp,
        child_reaction_message: message.trim() || null,
        child_reaction_at: new Date().toISOString(),
      })
      .eq("id", log.id)
      .select("id");

    setSending(false);

    if (error) {
      alert("送信できませんでした", `もう一度試してね\n(${error.message})`);
      return;
    }
    if (!data || data.length === 0) {
      alert("送信できませんでした", "このメッセージにはもう返事しているかも");
      return;
    }

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
            <AutoRubyText text="親からのメッセージ" style={styles.header} rubySize={6} noWrap />
          </View>

          {/* 親メッセージ表示 */}
          <View style={styles.parentCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <PixelTargetIcon size={16} />
              <AutoRubyText text={log.taskTitle} style={styles.questName} rubySize={5} noWrap />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <PixelCoinIcon size={16} />
              <Text style={styles.rewardText}>{log.rewardAmount}コロ</Text>
            </View>

            {parentStampDef && (
              <View style={styles.parentStampRow}>
                <View style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
                  <StampSvg id={parentStampDef.id} size={40} />
                </View>
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
            <AutoRubyText text="↓ 返事しよう！ ↓" style={styles.dividerText} rubySize={5} />
          </View>

          {/* スタンプ選択 */}
          <AutoRubyText text="スタンプを選んでね" style={styles.sectionLabel} rubySize={5} />
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
                accessibilityLabel={`スタンプ ${s.label}`}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedStamp === s.id }}
              >
                <View style={styles.stampSvgWrap}>
                  <StampSvg id={s.id} size={28} />
                </View>
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
            placeholder="親に一言！（入力しなくてもOK）"
            placeholderTextColor={palette.textPlaceholder}
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
            accessibilityLabel={sending ? "送信中" : "親にメッセージを送る"}
            accessibilityRole="button"
          >
            {sending ? (
              <Text style={styles.sendText}>送り中...</Text>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <PixelLetterIcon size={18} />
                <Text style={styles.sendText}>送る！</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>
            ※ スタンプかメッセージのどちらかは必ず入れてね
          </Text>

          {onSkip && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={onSkip}
              accessibilityLabel="後で返事する"
              accessibilityRole="button"
            >
              <AutoRubyText text="後で返事する" style={styles.skipText} rubySize={5} />
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
      borderRadius: 16,
      padding: 20,
      borderWidth: 1.5,
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
      borderRadius: 12,
      padding: 12,
      width: "100%",
      marginTop: 8,
      borderWidth: 1.5,
      borderColor: p.border,
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
      borderRadius: 12,
      padding: 10,
      borderWidth: 1.5,
      borderColor: p.border,
      minWidth: 72,
    },
    stampItemSelected: {
      borderColor: p.primary,
    },
    stampEmoji: { fontSize: 28 },
    stampSvgWrap: {
      width: 34,
      height: 34,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
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
      borderWidth: 1.5,
      borderColor: p.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      minHeight: 50,
      marginTop: 12,
      marginBottom: 12,
      color: p.textStrong,
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
