import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import { getFamilyStampById } from "../lib/family-stamps";
import { AutoRubyText } from "./Ruby";
import type { FamilyMessage } from "../lib/types";

type Props = {
  messages: FamilyMessage[];
  currentUserId: string;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たったいま";
  if (mins < 60) return `${mins}ふんまえ`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}じかんまえ`;
  const days = Math.floor(hours / 24);
  return `${days}にちまえ`;
}

export default function FamilyMessageCard({ messages, currentUserId }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  if (messages.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <AutoRubyText
          text="💬 パーティチャット"
          style={styles.sectionTitle}
          rubySize={6}
        />
      </View>

      {messages.map((msg) => {
        const stamp = msg.stamp_id ? getFamilyStampById(msg.stamp_id) : null;
        const isMine = msg.sender_id === currentUserId;
        const senderName = msg.sender?.name ?? "?";
        const senderIcon = msg.sender?.icon ?? "👤";
        const recipientName = msg.recipient?.name ?? "?";
        const recipientIcon = msg.recipient?.icon ?? "👤";

        return (
          <View
            key={msg.id}
            style={[styles.msgRow, isMine && styles.msgRowMine]}
            accessibilityLabel={`${senderName}から${recipientName}へ ${stamp?.label ?? ""} ${msg.message ?? ""}`}
          >
            {/* アバター */}
            <View style={styles.avatarCol}>
              <Text style={styles.avatar}>{senderIcon}</Text>
            </View>

            {/* 吹き出し */}
            <View style={[styles.bubble, isMine && styles.bubbleMine]}>
              {/* 送信者 → 受信者 */}
              <View style={styles.nameRow}>
                <Text style={styles.senderName}>{senderName}</Text>
                <Text style={styles.arrow}> → </Text>
                <Text style={styles.recipientBadge}>
                  {recipientIcon} {recipientName}
                </Text>
              </View>

              {/* スタンプ + メッセージ */}
              <View style={styles.contentRow}>
                {stamp && (
                  <Text style={styles.stampEmoji}>{stamp.emoji}</Text>
                )}
                <View style={styles.textCol}>
                  {stamp && (
                    <Text style={styles.stampLabel}>{stamp.label}</Text>
                  )}
                  {msg.message && (
                    <Text style={styles.msgText}>「{msg.message}」</Text>
                  )}
                </View>
              </View>

              {/* 時間 */}
              <Text style={styles.timeText}>{timeAgo(msg.created_at)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    container: {
      backgroundColor: p.surface,
      borderRadius: 16,
      padding: 16,
      marginTop: 12,
      borderWidth: 1,
      borderColor: p.border,
      shadowColor: p.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: rf(16),
      fontWeight: "bold",
      color: p.textStrong,
    },
    msgRow: {
      flexDirection: "row",
      marginBottom: 10,
      alignItems: "flex-start",
    },
    msgRowMine: {
      opacity: 0.85,
    },
    avatarCol: {
      width: 36,
      alignItems: "center",
      marginRight: 8,
      marginTop: 2,
    },
    avatar: {
      fontSize: 24,
    },
    bubble: {
      flex: 1,
      backgroundColor: p.primaryLight,
      borderRadius: 14,
      borderTopLeftRadius: 4,
      padding: 10,
    },
    bubbleMine: {
      backgroundColor: p.surfaceMuted,
      borderTopLeftRadius: 14,
      borderTopRightRadius: 4,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    senderName: {
      fontSize: 12,
      fontWeight: "bold",
      color: p.primaryDark,
    },
    arrow: {
      fontSize: 11,
      color: p.textMuted,
    },
    recipientBadge: {
      fontSize: 12,
      color: p.textBase,
      fontWeight: "bold",
    },
    contentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    stampEmoji: {
      fontSize: 28,
    },
    textCol: {
      flex: 1,
    },
    stampLabel: {
      fontSize: 14,
      fontWeight: "bold",
      color: p.textStrong,
    },
    msgText: {
      fontSize: 13,
      color: p.textBase,
      marginTop: 2,
    },
    timeText: {
      fontSize: 10,
      color: p.textMuted,
      textAlign: "right",
      marginTop: 4,
    },
  });
}
