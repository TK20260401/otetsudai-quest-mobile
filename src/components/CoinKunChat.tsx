import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  PanResponder,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PixelCoinIcon, PixelChatIcon, PixelCrossIcon } from "./PixelIcons";
import { useTheme, type Palette } from "../theme";

type Role = "parent" | "child" | "guest";
type Message = { role: "user" | "assistant"; content: string };

const CHILD_SUGGESTIONS = [
  "クエストのコツをおしえて",
  "貯金ってなに？",
  "バッジをあつめたい！",
  "ごほうびの使いかた",
];
const PARENT_SUGGESTIONS = [
  "年齢別おすすめのクエストは？",
  "報酬の金額の目安を教えて",
  "お金の教育で大切なことは？",
  "子どものやる気を引き出すには？",
];
const GUEST_SUGGESTIONS = [
  "このアプリはなに？",
  "始めかたをおしえて",
  "どんな機能がある？",
  "冒険団マスターはなにができる？",
];

// Web版と同じ /api/chat を呼び出す（Vercelデプロイ済みのURL）
const CHAT_API_URL = "https://otetsudai-bank-beta.vercel.app/api/chat";

export default function CoinKunChat({ role }: { role: Role }) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const insets = useSafeAreaInsets();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // ドラッグ移動用
  const { width: screenW, height: screenH } = Dimensions.get("window");
  const fabSize = 56;
  const pan = useRef(new Animated.ValueXY({ x: screenW - fabSize - 16, y: screenH - fabSize - 20 - (insets.bottom || 0) })).current;
  const isDragging = useRef(false);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5,
    onPanResponderGrant: () => {
      isDragging.current = false;
      pan.extractOffset();
    },
    onPanResponderMove: (_, gs) => {
      if (Math.abs(gs.dx) > 5 || Math.abs(gs.dy) > 5) {
        isDragging.current = true;
      }
      Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(_, gs);
    },
    onPanResponderRelease: () => {
      pan.flattenOffset();
      if (!isDragging.current) {
        setOpen(true);
      }
    },
  }), [pan]);

  const isChild = role === "child";
  const suggestions =
    role === "child" ? CHILD_SUGGESTIONS : role === "parent" ? PARENT_SUGGESTIONS : GUEST_SUGGESTIONS;

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, role }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: isChild
            ? "ごめんね、上手くいかなかったよ"
            : "エラーが発生しました。",
        },
      ]);
    }
    setLoading(false);
  }

  const accentColor = isChild ? palette.primary : palette.borderStrong;
  const accentDark = isChild ? palette.primaryDark : palette.accentLight;

  return (
    <>
      {/* フローティングボタン（ドラッグ移動可能） */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.fab,
          {
            backgroundColor: accentColor,
            transform: pan.getTranslateTransform(),
          },
        ]}
        accessibilityLabel="AIアシスタント"
        accessibilityRole="button"
      >
        {isChild ? <PixelCoinIcon size={26} /> : <PixelChatIcon size={26} />}
      </Animated.View>

      {/* チャットモーダル */}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.panel, { paddingBottom: insets.bottom || 12 }]}>
            {/* ヘッダー */}
            <View style={[styles.header, { backgroundColor: accentColor }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {isChild ? <PixelCoinIcon size={18} /> : <PixelChatIcon size={18} />}
                <Text style={styles.headerTitle}>
                  {role === "child"
                    ? "コインくん"
                    : role === "parent"
                      ? "クエストアドバイザー"
                      : "クエストガイド"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeBtn} accessibilityLabel="閉じる">
                <PixelCrossIcon size={16} />
              </TouchableOpacity>
            </View>

            {/* メッセージリスト */}
            <ScrollView
              ref={scrollRef}
              style={styles.messageList}
              contentContainerStyle={{ padding: 12, gap: 8 }}
              keyboardShouldPersistTaps="handled"
            >
              {messages.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    {role === "child"
                      ? "コインくんに何でも聞いてね！"
                      : role === "parent"
                        ? "クエスト教育についてご相談ください"
                        : "ジョブサガについて何でも聞いてね！"}
                  </Text>
                </View>
              )}
              {messages.map((msg, i) => (
                <View
                  key={i}
                  style={[
                    styles.bubble,
                    msg.role === "user"
                      ? [styles.bubbleUser, { backgroundColor: accentColor }]
                      : styles.bubbleAssistant,
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      msg.role === "user" ? styles.bubbleTextUser : styles.bubbleTextAssistant,
                    ]}
                  >
                    {msg.content}
                  </Text>
                </View>
              ))}
              {loading && (
                <View style={[styles.bubble, styles.bubbleAssistant]}>
                  <ActivityIndicator size="small" color={palette.textMuted} />
                </View>
              )}
            </ScrollView>

            {/* サジェスト（初期表示） */}
            {messages.length <= 1 && (
              <View style={styles.suggestions}>
                {suggestions.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => send(s)}
                    style={[styles.suggestion, { borderColor: accentColor }]}
                    disabled={loading}
                  >
                    <Text style={[styles.suggestionText, { color: accentColor }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* 入力 */}
            <View style={styles.inputRow}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder={isChild ? "聞いてみよう..." : "メッセージを入力..."}
                placeholderTextColor={palette.textPlaceholder}
                style={styles.input}
                editable={!loading}
                returnKeyType="send"
                onSubmitEditing={() => send(input)}
              />
              <TouchableOpacity
                onPress={() => send(input)}
                disabled={loading || !input.trim()}
                style={[
                  styles.sendBtn,
                  { backgroundColor: accentColor, opacity: loading || !input.trim() ? 0.5 : 1 },
                ]}
              >
                <Text style={styles.sendText}>送信</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    fab: {
      position: "absolute",
      top: 0,
      left: 0,
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: p.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 8,
      borderWidth: 2,
      borderColor: p.goldBorder,
    },
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: p.overlay,
    },
    panel: {
      backgroundColor: p.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "85%",
      minHeight: "60%",
      borderWidth: 1,
      borderColor: p.border,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: p.white,
    },
    closeBtn: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      backgroundColor: "rgba(0,0,0,0.3)",
    },
    messageList: {
      flex: 1,
      backgroundColor: p.background,
    },
    emptyState: {
      padding: 24,
      alignItems: "center",
    },
    emptyText: {
      fontSize: 13,
      color: p.textMuted,
      textAlign: "center",
    },
    bubble: {
      maxWidth: "82%",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 14,
    },
    bubbleUser: {
      alignSelf: "flex-end",
      borderBottomRightRadius: 4,
    },
    bubbleAssistant: {
      alignSelf: "flex-start",
      backgroundColor: p.surfaceMuted,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: p.border,
    },
    bubbleText: {
      fontSize: 14,
      lineHeight: 20,
    },
    bubbleTextUser: {
      color: p.white,
    },
    bubbleTextAssistant: {
      color: p.textStrong,
    },
    suggestions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: p.border,
      backgroundColor: p.surface,
    },
    suggestion: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      borderWidth: 1,
      backgroundColor: p.surfaceMuted,
    },
    suggestionText: {
      fontSize: 11,
      fontWeight: "600",
    },
    inputRow: {
      flexDirection: "row",
      gap: 8,
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: p.border,
      backgroundColor: p.surface,
    },
    input: {
      flex: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.surfaceMuted,
      color: p.textStrong,
      fontSize: 14,
    },
    sendBtn: {
      paddingHorizontal: 16,
      justifyContent: "center",
      borderRadius: 12,
      minWidth: 60,
    },
    sendText: {
      color: p.white,
      fontWeight: "bold",
      fontSize: 14,
    },
  });
}
