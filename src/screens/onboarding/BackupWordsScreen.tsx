import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, type Palette } from "../../theme";
import { rf } from "../../lib/responsive";
import RpgButton from "../../components/RpgButton";

type Props = {
  words: string[];
  onConfirm: () => void;
  onBack: () => void;
};

export default function BackupWordsScreen({ words, onConfirm, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [checked, setChecked] = useState(false);

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <TouchableOpacity
        onPress={onBack}
        style={styles.backButton}
        accessibilityLabel="もどる"
        accessibilityRole="button"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.backArrow}>{"\u2190"}</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>だいじな あいことば</Text>
        <Text style={styles.subtitle}>
          かみに かいて たいせつに しまってね
        </Text>

        <View style={styles.card}>
          {words.slice(0, 3).map((word, i) => (
            <View key={i} style={styles.wordRow}>
              <Text style={styles.wordNumber}>{i + 1}</Text>
              <Text style={styles.wordText}>{word}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setChecked((prev) => !prev)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          accessibilityLabel="かみにかいたよ"
        >
          <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
            {checked && <Text style={styles.checkmark}>{"\u2713"}</Text>}
          </View>
          <Text style={styles.checkboxLabel}>かみに かいたよ！</Text>
        </TouchableOpacity>

        <View style={styles.buttonWrap}>
          <RpgButton
            tier="gold"
            size="lg"
            fullWidth
            disabled={!checked}
            onPress={onConfirm}
            accessibilityLabel="おぼえた つぎへ"
          >
            <Text
              style={[
                styles.buttonText,
                !checked && styles.buttonTextDisabled,
              ]}
            >
              おぼえた！つぎへ
            </Text>
          </RpgButton>
        </View>

        <Text style={styles.warningText}>
          このあいことばは、アカウントを{"\n"}ふっきゅうするときにつかいます
        </Text>
      </View>
    </View>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: p.backgroundLanding,
      paddingHorizontal: 20,
    },
    backButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    backArrow: {
      fontSize: rf(24),
      color: p.primaryDark,
      fontWeight: "bold",
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginTop: -20,
    },
    title: {
      fontSize: rf(22),
      fontWeight: "800",
      color: p.primaryDark,
      marginBottom: 8,
      textAlign: "center",
    },
    subtitle: {
      fontSize: rf(14),
      color: p.primary,
      marginBottom: 24,
      textAlign: "center",
    },
    card: {
      width: "100%",
      backgroundColor: p.white,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: p.borderStrong,
      paddingVertical: 20,
      paddingHorizontal: 24,
      gap: 16,
      marginBottom: 24,
    },
    wordRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    wordNumber: {
      fontSize: rf(16),
      fontWeight: "bold",
      color: p.textMuted,
      width: 28,
      textAlign: "center",
    },
    wordText: {
      fontSize: rf(22),
      fontWeight: "bold",
      color: p.primaryDark,
      letterSpacing: 1,
    },
    checkboxRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 20,
      minHeight: 44,
      paddingHorizontal: 8,
    },
    checkbox: {
      width: 28,
      height: 28,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: p.borderStrong,
      backgroundColor: p.white,
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxChecked: {
      backgroundColor: p.primary,
      borderColor: p.primary,
    },
    checkmark: {
      fontSize: 18,
      color: p.white,
      fontWeight: "bold",
    },
    checkboxLabel: {
      fontSize: rf(15),
      color: p.textStrong,
      fontWeight: "600",
    },
    buttonWrap: {
      width: "100%",
      marginBottom: 16,
    },
    buttonText: {
      fontSize: rf(18),
      fontWeight: "bold",
      color: "#2A1800",
    },
    buttonTextDisabled: {
      opacity: 0.5,
    },
    warningText: {
      fontSize: rf(11),
      color: p.textMuted,
      textAlign: "center",
      lineHeight: rf(18),
    },
  });
}
