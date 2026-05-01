import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import { RubyText, AutoRubyText } from "../components/Ruby";
import PixelHeroSvg from "../components/PixelHeroSvg";
import { PixelKeyIcon, PixelDoorIcon, PixelCoinIcon, PixelPiggyIcon, PixelSeedlingIcon } from "../components/PixelIcons";
import RpgButton from "../components/RpgButton";
import AccessibilityToggle from "../components/AccessibilityToggle";
import LegalModal from "../components/LegalModal";
import { TERMS, PRIVACY } from "../lib/legal-texts";
import CoinKunChat from "../components/CoinKunChat";

type Props = {
  onSignup?: () => void;
  onLogin: () => void;
  onParentLogin?: () => void;
};

export default function LandingScreen({ onSignup, onLogin, onParentLogin }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const isTablet = width >= 600;
  const isSmallScreen = height < 700;
  const [legalModal, setLegalModal] = useState<"terms" | "privacy" | null>(null);
  const [subtitleWrap, setSubtitleWrap] = useState(false);
  const [measured, setMeasured] = useState(false);

  const onSubtitleLayout = useCallback((e: LayoutChangeEvent) => {
    if (measured) return;
    const containerWidth = e.nativeEvent.layout.width;
    // RubyText の1行での推定幅（フォントサイズ × 文字数の概算）
    // 「クエストをクリアして、コロを集めよう！」= 18文字
    const fontSize = isSmallScreen ? 13 : rf(13);
    const estimatedWidth = 18 * fontSize * 0.85;
    setSubtitleWrap(estimatedWidth > containerWidth);
    setMeasured(true);
  }, [measured, isSmallScreen]);

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 8 },
      ]}
    >
      <AccessibilityToggle />
      <View style={[styles.hero, isTablet && { maxWidth: 480, alignSelf: "center", width: "100%" }]}>
        <View style={styles.heroRow} accessibilityLabel="JOB SAGA">
          <PixelHeroSvg type="warrior" size={isSmallScreen ? 48 : 64} animated mode="walk" />
          <PixelHeroSvg type="mage" size={isSmallScreen ? 48 : 64} animated mode="walk" />
        </View>
        <Text
          style={[styles.title, isTablet && { fontSize: 38 }, isSmallScreen && { fontSize: 24 }]}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          JOB SAGA
        </Text>
        <View style={styles.subtitleWrap} onLayout={onSubtitleLayout}>
          {subtitleWrap ? (
            <>
              <RubyText style={[styles.subtitle, isSmallScreen && { fontSize: 13 }]} parts={["クエストをクリアして、"]} rubySize={6} />
              <RubyText style={[styles.subtitle, isSmallScreen && { fontSize: 13 }]} parts={["コロを", ["集", "あつ"], "めよう！"]} rubySize={6} />
            </>
          ) : (
            <RubyText style={[styles.subtitle, isSmallScreen && { fontSize: 13 }]} parts={["クエストをクリアして、コロを", ["集", "あつ"], "めよう！"]} rubySize={6} />
          )}
        </View>

        <View style={[styles.buttons, isSmallScreen && { marginBottom: 12 }]}>
          {onSignup && (
            <RpgButton tier="gold" size="lg" fullWidth contentAlign="start" onPress={onSignup} accessibilityLabel="はじめてのひと 新規登録">
              <PixelKeyIcon size={22} />
              <Text style={{ fontSize: isTablet ? 18 : 16, fontWeight: "bold", color: "#2A1800", textAlign: "left" }} adjustsFontSizeToFit numberOfLines={1}>
                はじめてのひと
              </Text>
            </RpgButton>
          )}
          <RpgButton tier="silver" size="lg" fullWidth contentAlign="start" onPress={onLogin} accessibilityLabel="つづきから ログイン">
            <PixelDoorIcon size={22} />
            <Text style={{ fontSize: isTablet ? 18 : 16, fontWeight: "bold", color: "#1A1D22", textAlign: "left" }} adjustsFontSizeToFit numberOfLines={1}>
              つづきから
            </Text>
          </RpgButton>
          {onParentLogin && (
            <TouchableOpacity
              onPress={onParentLogin}
              style={styles.parentLink}
              accessibilityLabel="おうちのひとログイン"
              accessibilityRole="button"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <RubyText
                style={{
                  fontSize: 14,
                  color: palette.textMuted,
                  textDecorationLine: "underline",
                  textDecorationColor: palette.textMuted,
                }}
                parts={["おうちのひと（", ["冒険団長", "ぼうけんだんちょう"], "モード）"]}
                rubySize={5}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.features}>
          <View style={[styles.featureCard, { backgroundColor: palette.walletSpendBg, borderColor: palette.walletSpendBorder }]}>
            <View style={[styles.featureIcon, { backgroundColor: palette.walletSpend }]}>
              <PixelCoinIcon size={16} />
            </View>
            <RubyText style={[styles.featureTitle, { color: palette.walletSpendText }]} parts={[["取引", "とりひき"]]} rubySize={7} />
            <AutoRubyText text="欲しい物を仕入れる" style={[styles.featureDesc, { color: palette.walletSpendText }]} rubySize={4} />
          </View>

          <View style={[styles.featureCard, { backgroundColor: palette.walletSaveBg, borderColor: palette.walletSaveBorder }]}>
            <View style={[styles.featureIcon, { backgroundColor: palette.walletSave }]}>
              <PixelPiggyIcon size={16} />
            </View>
            <RubyText style={[styles.featureTitle, { color: palette.walletSaveText }]} parts={[["金庫", "きんこ"]]} rubySize={7} />
            <AutoRubyText text="夢を叶える宝箱" style={[styles.featureDesc, { color: palette.walletSaveText }]} rubySize={4} />
          </View>

          <View style={[styles.featureCard, { backgroundColor: palette.walletInvestBg, borderColor: palette.walletInvestBorder }]}>
            <View style={[styles.featureIcon, { backgroundColor: palette.walletInvest }]}>
              <PixelSeedlingIcon size={16} />
            </View>
            <RubyText style={[styles.featureTitle, { color: palette.walletInvestText }]} parts={[["錬成", "れんせい"]]} rubySize={7} />
            <AutoRubyText text="お宝を大きく育てる" style={[styles.featureDesc, { color: palette.walletInvestText }]} rubySize={4} />
          </View>
        </View>
      </View>

      <View style={styles.legalRow}>
        <TouchableOpacity onPress={() => setLegalModal("terms")} accessibilityRole="button" accessibilityLabel="利用規約を開く">
          <RubyText style={styles.legalLink} parts={[["利用規約", "りようきやく"]]} rubySize={5} />
        </TouchableOpacity>
        {/* ルビ有無で波打たないよう、セパレータも RubyText の空ルビ構造で揃える */}
        <RubyText style={styles.legalSep} parts={["|"]} rubySize={5} />
        <TouchableOpacity onPress={() => setLegalModal("privacy")} accessibilityRole="button" accessibilityLabel="プライバシーポリシーを開く">
          <AutoRubyText text="プライバシーポリシー" style={styles.legalLink} rubySize={5} />
        </TouchableOpacity>
      </View>

      <Text style={styles.copyright}>{"\u00A9"} 2026 Snafty inc.</Text>

      <LegalModal
        visible={legalModal === "terms"}
        onClose={() => setLegalModal(null)}
        title={TERMS.title}
        updated={TERMS.updated}
        sections={TERMS.sections}
      />
      <LegalModal
        visible={legalModal === "privacy"}
        onClose={() => setLegalModal(null)}
        title={PRIVACY.title}
        updated={PRIVACY.updated}
        sections={PRIVACY.sections}
      />
      <CoinKunChat role="guest" />
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
    hero: {
      alignItems: "center",
    },
    heroRow: {
      flexDirection: "row" as const,
      gap: 12,
      marginBottom: 4,
      alignItems: "flex-end" as const,
    },
    title: {
      fontSize: rf(28),
      fontWeight: "800",
      color: p.primaryDark,
      marginBottom: 4,
      textAlign: "center",
    },
    subtitle: {
      fontSize: rf(13),
      color: p.primary,
      marginBottom: 4,
      textAlign: "center",
      lineHeight: rf(22),
    },
    description: {
      fontSize: rf(11),
      color: p.textMuted,
      textAlign: "center",
      lineHeight: rf(18),
    },
    buttons: {
      width: "100%",
      gap: 12,
      marginTop: 16,
      marginBottom: 20,
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 20,
      gap: 10,
    },
    buttonPrimary: {
      backgroundColor: p.primary,
      shadowColor: p.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    buttonOutline: {
      borderWidth: 1.5,
      borderColor: p.borderStrong,
      backgroundColor: p.white,
    },
    buttonIconText: {
      fontSize: 24,
    },
    buttonPrimaryText: {
      fontSize: rf(16),
      fontWeight: "bold",
      color: p.white,
    },
    buttonOutlineText: {
      fontSize: rf(18),
      fontWeight: "bold",
      color: p.primaryDark,
    },
    features: {
      flexDirection: "row",
      gap: 8,
      width: "100%",
    },
    featureCard: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1.5,
      padding: 8,
      alignItems: "flex-start",
    },
    featureIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    featureEmoji: {
      fontSize: 16,
    },
    featureTitle: {
      fontSize: 14,
      fontWeight: "bold",
      marginBottom: 4,
      lineHeight: 20,
    },
    featureDesc: {
      fontSize: 8,
      letterSpacing: -0.8,
      textAlign: "left" as const,
    },
    legalRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      marginTop: 12,
    },
    legalLink: {
      fontSize: 10,
      color: p.primary,
    },
    legalSep: {
      fontSize: 10,
      color: p.textMuted,
    },
    copyright: {
      fontSize: 9,
      color: p.textMuted,
      textAlign: "center" as const,
      marginTop: 8,
      opacity: 0.7,
    },
    subtitleWrap: {
      alignItems: "center",
      marginBottom: 4,
    },
    parentLink: {
      alignSelf: "center",
      paddingVertical: 8,
      paddingHorizontal: 16,
      minHeight: 44,
      justifyContent: "center",
    },
  });
}
