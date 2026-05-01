import React, { useMemo } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, type Palette } from "../theme";
import { PixelCrossIcon } from "./PixelIcons";
import type { LegalSection } from "../lib/legal-texts";

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  updated: string;
  sections: LegalSection[];
};

/**
 * 利用規約／プライバシーポリシー表示用モーダル。
 *
 * Web版への外部遷移を避けてアプリ内で完結させるため、
 * テキストはすべて src/lib/legal-texts.ts から取得する。
 * 閉じる＝必ず呼び出し元（通常 LandingScreen）へ戻る。
 */
export default function LegalModal({
  visible,
  onClose,
  title,
  updated,
  sections,
}: Props) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text
            style={styles.title}
            accessibilityRole="header"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {title}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityLabel="閉じる"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <PixelCrossIcon size={18} />
          </TouchableOpacity>
        </View>
        <Text style={styles.updated}>{updated}</Text>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator
        >
          {sections.map((s, i) => (
            <View
              key={i}
              style={[styles.section, s.callout && styles.callout]}
            >
              <Text style={[styles.heading, s.callout && styles.calloutHeading]}>
                {s.heading}
              </Text>
              {s.calloutLabel ? (
                <Text style={styles.calloutLabel}>{s.calloutLabel}</Text>
              ) : null}
              {s.paragraphs?.map((p, j) => (
                <Text key={j} style={styles.paragraph}>
                  {p}
                </Text>
              ))}
              {s.bullets?.map((b, j) => (
                <View key={j} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>・</Text>
                  <Text style={styles.bulletText}>{b}</Text>
                </View>
              ))}
            </View>
          ))}

          <TouchableOpacity
            onPress={onClose}
            style={styles.backBtn}
            accessibilityLabel="TOPへもどる"
          >
            <Text style={styles.backBtnText}>← TOPへもどる</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: p.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
    },
    title: {
      fontSize: 20,
      fontWeight: "800",
      color: p.primary,
      flex: 1,
    },
    closeBtn: {
      padding: 6,
      borderRadius: 8,
      backgroundColor: p.surface,
    },
    updated: {
      fontSize: 11,
      color: p.textMuted,
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 4,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    section: {
      marginBottom: 20,
    },
    callout: {
      borderWidth: 1.5,
      borderColor: p.primary,
      backgroundColor: p.surface,
      padding: 14,
      borderRadius: 12,
    },
    heading: {
      fontSize: 15,
      fontWeight: "700",
      color: p.primary,
      marginBottom: 8,
    },
    calloutHeading: {
      fontSize: 16,
    },
    calloutLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: p.accent,
      marginBottom: 8,
    },
    paragraph: {
      fontSize: 13,
      color: p.textBase,
      lineHeight: 20,
      marginBottom: 6,
    },
    bulletRow: {
      flexDirection: "row",
      marginBottom: 4,
      paddingRight: 4,
    },
    bulletDot: {
      fontSize: 13,
      color: p.textBase,
      width: 14,
      lineHeight: 20,
    },
    bulletText: {
      fontSize: 13,
      color: p.textBase,
      lineHeight: 20,
      flex: 1,
    },
    backBtn: {
      marginTop: 8,
      marginBottom: 16,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: p.primary,
      backgroundColor: p.surface,
      alignItems: "center",
    },
    backBtnText: {
      fontSize: 11,
      fontWeight: "700",
      color: p.primary,
    },
  });
}
