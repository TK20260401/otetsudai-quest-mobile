import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import { getFamilyStampById } from "../lib/family-stamps";
import { AutoRubyText, RubyStr } from "./Ruby";
import type { FamilyMessage } from "../lib/types";
import { PixelChatIcon } from "./PixelIcons";
import StampSvg from "./StampSvg";

type Props = {
  messages: FamilyMessage[];
  currentUserId: string;
  /** 受信側のメッセージをタップで非表示にするコールバック (id を渡す) */
  onDismiss?: (id: string) => void;
};

/**
 * 相対時刻をルビマーカー記法で返す。呼び出し側で <RubyStr text={...} />
 * で描画すれば漢字＋ふりがな表示になる。
 */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "たったいま";
  if (mins < 60) return `${mins}[分|ふん][前|まえ]`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}[時間|じかん][前|まえ]`;
  const days = Math.floor(hours / 24);
  return `${days}[日|にち][前|まえ]`;
}

export default function FamilyMessageCard({ messages, currentUserId, onDismiss }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  if (messages.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <PixelChatIcon size={18} />
        <AutoRubyText
          text="パーティチャット"
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
        // 自分が受信者で onDismiss が渡されていればタップ可能
        const canDismiss = !!onDismiss && msg.recipient_id === currentUserId;

        const RowWrapper: any = canDismiss ? TouchableOpacity : View;
        const rowProps: any = canDismiss
          ? {
              activeOpacity: 0.6,
              onPress: () => onDismiss?.(msg.id),
              accessibilityHint: "タップでこのメッセージを非表示にします",
            }
          : {};

        return (
          <RowWrapper
            key={msg.id}
            style={[styles.msgRow, isMine && styles.msgRowMine]}
            accessibilityLabel={`${senderName}から${recipientName}へ ${stamp?.label ?? ""} ${msg.message ?? ""}`}
            {...rowProps}
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
                  <View style={styles.stampSvgWrap}>
                    <StampSvg id={stamp.id} size={28} />
                  </View>
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
              <RubyStr text={timeAgo(msg.created_at)} style={styles.timeText} rubySize={4} />
              {canDismiss && (
                <Text style={styles.dismissHint}>タップで閉じる</Text>
              )}
            </View>
          </RowWrapper>
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
      borderWidth: 1.5,
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
      gap: 6,
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
    stampSvgWrap: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
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
    dismissHint: {
      fontSize: 9,
      color: p.textMuted,
      textAlign: "right",
      marginTop: 2,
      fontStyle: "italic",
    },
  });
}
