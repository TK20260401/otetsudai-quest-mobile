import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import { RubyText, AutoRubyText } from "../components/Ruby";
import PixelHeroSvg from "../components/PixelHeroSvg";
import { PixelKeyIcon, PixelCoinIcon, PixelPiggyIcon, PixelSeedlingIcon } from "../components/PixelIcons";
import RpgButton from "../components/RpgButton";
import LegalModal from "../components/LegalModal";
import { TERMS, PRIVACY } from "../lib/legal-texts";

type Props = {
  onSignup?: () => void;
  onLogin: () => void;
};

export default function LandingScreen({ onSignup, onLogin }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const isTablet = width >= 600;
  const isSmallScreen = height < 700;
  const [legalModal, setLegalModal] = useState<"terms" | "privacy" | null>(null);

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 8 },
      ]}
    >
      <View style={[styles.hero, isTablet && { maxWidth: 480, alignSelf: "center", width: "100%" }]}>
        <View style={styles.heroRow} accessibilityLabel="おこづかいクエスト">
          <PixelHeroSvg type="warrior" size={isSmallScreen ? 48 : 64} />
          <PixelHeroSvg type="mage" size={isSmallScreen ? 48 : 64} />
        </View>
        <Text
          style={[styles.title, isTablet && { fontSize: 38 }, isSmallScreen && { fontSize: 24 }]}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          おこづかいクエスト
        </Text>
        <View style={styles.subtitleWrap}>
          <RubyText style={[styles.subtitle, isSmallScreen && { fontSize: 13 }]} parts={["クエストをクリアして、コインを ", ["稼", "かせ"], "ごう！"]} rubySize={6} />
        </View>

        <View style={[styles.buttons, isSmallScreen && { marginBottom: 12 }]}>
          <RpgButton tier="gold" size="lg" fullWidth onPress={onLogin} accessibilityLabel="ログイン">
            <PixelKeyIcon size={22} />
            <Text style={{ fontSize: isTablet ? 18 : 16, fontWeight: "bold", color: "#2A1800" }} adjustsFontSizeToFit numberOfLines={1}>
              クエストをはじめる！
            </Text>
          </RpgButton>
        </View>

        <View style={styles.features}>
          <View style={[styles.featureCard, { backgroundColor: palette.walletSpendBg, borderColor: palette.walletSpendBorder }]}>
            <View style={[styles.featureIcon, { backgroundColor: palette.walletSpend }]}>
              <PixelCoinIcon size={16} />
            </View>
            <RubyText style={[styles.featureTitle, { color: palette.walletSpendText }]} parts={[["使", "つか"], "う"]} rubySize={7} />
            <AutoRubyText text="物を買う" style={[styles.featureDesc, { color: palette.walletSpendText }]} rubySize={4} />
          </View>

          <View style={[styles.featureCard, { backgroundColor: palette.walletSaveBg, borderColor: palette.walletSaveBorder }]}>
            <View style={[styles.featureIcon, { backgroundColor: palette.walletSave }]}>
              <PixelPiggyIcon size={16} />
            </View>
            <RubyText style={[styles.featureTitle, { color: palette.walletSaveText }]} parts={[["貯", "た"], "める"]} rubySize={7} />
            <AutoRubyText text="夢を叶える" style={[styles.featureDesc, { color: palette.walletSaveText }]} rubySize={4} />
          </View>

          <View style={[styles.featureCard, { backgroundColor: palette.walletInvestBg, borderColor: palette.walletInvestBorder }]}>
            <View style={[styles.featureIcon, { backgroundColor: palette.walletInvest }]}>
              <PixelSeedlingIcon size={16} />
            </View>
            <RubyText style={[styles.featureTitle, { color: palette.walletInvestText }]} parts={[["増", "ふ"], "やす"]} rubySize={7} />
            <AutoRubyText text="お金が育つ" style={[styles.featureDesc, { color: palette.walletInvestText }]} rubySize={4} />
          </View>
        </View>
      </View>

      <View style={styles.legalRow}>
        <TouchableOpacity onPress={() => setLegalModal("terms")} accessibilityRole="button" accessibilityLabel="利用規約を開く">
          <RubyText style={styles.legalLink} parts={[["利用規約", "りようきやく"]]} rubySize={5} />
        </TouchableOpacity>
        <Text style={styles.legalSep} accessibilityElementsHidden>|</Text>
        <TouchableOpacity onPress={() => setLegalModal("privacy")} accessibilityRole="button" accessibilityLabel="プライバシーポリシーを開く">
          <AutoRubyText text="プライバシーポリシー" style={styles.legalLink} rubySize={5} />
        </TouchableOpacity>
      </View>

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
      borderWidth: 2,
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
      borderWidth: 2,
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
    subtitleWrap: {
      alignItems: "center",
      marginBottom: 4,
    },
  });
}
