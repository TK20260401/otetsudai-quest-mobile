import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, type Palette } from "../../theme";
import { rf } from "../../lib/responsive";
import RpgButton from "../../components/RpgButton";

type Props = {
  onNext: (nickname: string) => void;
  onBack: () => void;
};

const MAX_CHARS = 10;

export default function NicknameScreen({ onNext, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [nickname, setNickname] = useState("");

  const handleChange = (text: string) => {
    if (text.length <= MAX_CHARS) {
      setNickname(text);
    }
  };

  const canProceed = nickname.trim().length > 0;

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
        <Text style={styles.title}>はじめまして！</Text>
        <Text style={styles.subtitle}>なまえをおしえて</Text>

        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="ニックネーム"
            placeholderTextColor={palette.textMuted}
            value={nickname}
            onChangeText={handleChange}
            maxLength={MAX_CHARS}
            autoFocus
            returnKeyType="done"
            accessibilityLabel="ニックネーム入力"
          />
          <Text style={styles.charCount}>
            {nickname.length}/{MAX_CHARS}
          </Text>
        </View>

        <View style={styles.buttonWrap}>
          <RpgButton
            tier="gold"
            size="lg"
            fullWidth
            disabled={!canProceed}
            onPress={() => onNext(nickname.trim())}
            accessibilityLabel="つぎへ"
          >
            <Text
              style={[
                styles.buttonText,
                !canProceed && styles.buttonTextDisabled,
              ]}
            >
              つぎへ
            </Text>
          </RpgButton>
        </View>
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
      justifyContent: "center",
      alignItems: "center",
      marginTop: -40,
    },
    title: {
      fontSize: rf(26),
      fontWeight: "800",
      color: p.primaryDark,
      marginBottom: 8,
      textAlign: "center",
    },
    subtitle: {
      fontSize: rf(16),
      color: p.primary,
      marginBottom: 32,
      textAlign: "center",
    },
    inputWrap: {
      width: "100%",
      marginBottom: 24,
    },
    input: {
      borderWidth: 2,
      borderColor: p.borderStrong,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      fontSize: rf(18),
      color: p.textStrong,
      backgroundColor: p.white,
      textAlign: "center",
    },
    charCount: {
      fontSize: rf(12),
      color: p.textMuted,
      textAlign: "right",
      marginTop: 6,
      marginRight: 4,
    },
    buttonWrap: {
      width: "100%",
    },
    buttonText: {
      fontSize: rf(18),
      fontWeight: "bold",
      color: "#2A1800",
    },
    buttonTextDisabled: {
      opacity: 0.5,
    },
  });
}
