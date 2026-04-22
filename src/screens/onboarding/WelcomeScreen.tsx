import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, type Palette } from "../../theme";
import { rf } from "../../lib/responsive";
import { AutoRubyText } from "../../components/Ruby";
import PixelHeroSvg from "../../components/PixelHeroSvg";
import RpgButton from "../../components/RpgButton";

type Props = {
  onNext: () => void;
  onRecover: () => void;
};

export default function WelcomeScreen({ onNext, onRecover }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.heroRow} accessibilityLabel="おこづかいクエスト キャラクター">
          <PixelHeroSvg type="warrior" size={64} animated mode="walk" />
          <PixelHeroSvg type="mage" size={64} animated mode="walk" />
        </View>

        <Text
          style={styles.title}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          おこづかいクエスト
        </Text>

        <View style={styles.subtitleWrap}>
          <AutoRubyText
            text="クエストをクリアして、コインをかせごう！"
            style={styles.subtitle}
            rubySize={6}
          />
        </View>

        <View style={styles.buttonWrap}>
          <RpgButton
            tier="gold"
            size="lg"
            fullWidth
            onPress={onNext}
            accessibilityLabel="はじめる"
          >
            <Text style={styles.buttonText}>はじめる！</Text>
          </RpgButton>
        </View>
      </View>

      <TouchableOpacity
        onPress={onRecover}
        style={styles.recoverLink}
        accessibilityLabel="アカウントをふっきゅうする"
        accessibilityRole="button"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.recoverText}>アカウントをふっきゅうする</Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: p.backgroundLanding,
      paddingHorizontal: 20,
      justifyContent: "center",
    },
    content: {
      alignItems: "center",
    },
    heroRow: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 12,
      alignItems: "flex-end",
    },
    title: {
      fontSize: rf(28),
      fontWeight: "800",
      color: p.primaryDark,
      marginBottom: 8,
      textAlign: "center",
    },
    subtitleWrap: {
      alignItems: "center",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: rf(14),
      color: p.primary,
      textAlign: "center",
      lineHeight: rf(24),
    },
    buttonWrap: {
      width: "100%",
      marginTop: 24,
    },
    buttonText: {
      fontSize: rf(18),
      fontWeight: "bold",
      color: "#2A1800",
    },
    recoverLink: {
      alignSelf: "center",
      marginTop: 24,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    recoverText: {
      fontSize: rf(12),
      color: p.textMuted,
      textDecorationLine: "underline",
    },
  });
}
