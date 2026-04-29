import React, { useMemo, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, type Palette, linkStyles } from "../../theme";
import { rf } from "../../lib/responsive";
import { RubyText } from "../../components/Ruby";
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
  const [subtitleWrap, setSubtitleWrap] = useState(false);
  const [measured, setMeasured] = useState(false);

  const onSubtitleLayout = useCallback((e: LayoutChangeEvent) => {
    if (measured) return;
    const containerWidth = e.nativeEvent.layout.width;
    const fontSize = rf(14);
    const estimatedWidth = 18 * fontSize * 0.85;
    setSubtitleWrap(estimatedWidth > containerWidth);
    setMeasured(true);
  }, [measured]);

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.heroRow} accessibilityLabel="ジョブサガ">
          <PixelHeroSvg type="warrior" size={64} animated mode="walk" />
          <PixelHeroSvg type="mage" size={64} animated mode="walk" />
        </View>

        <Text
          style={styles.title}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          ジョブサガ
        </Text>

        <View style={styles.subtitleWrap} onLayout={onSubtitleLayout}>
          {subtitleWrap ? (
            <>
              <RubyText style={styles.subtitle} parts={["クエストをクリアして、"]} rubySize={6} />
              <RubyText style={styles.subtitle} parts={[["金貨", "きんか"], "をかせごう！"]} rubySize={6} />
            </>
          ) : (
            <RubyText style={styles.subtitle} parts={["クエストをクリアして、", ["金貨", "きんか"], "をかせごう！"]} rubySize={6} />
          )}
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
        accessibilityLabel="アカウントを復旧する"
        accessibilityRole="button"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <RubyText style={styles.recoverText} parts={["アカウントを", ["復旧", "ふっきゅう"], "する"]} rubySize={5} />
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
      ...linkStyles(p).linkTextMuted,
      fontSize: rf(12),
    },
  });
}
