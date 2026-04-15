import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import { RubyText, AutoRubyText } from "../components/Ruby";
import AnimatedButton from "../components/AnimatedButton";

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
  const isLandscape = width > height;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
      ]}
      style={styles.scroll}
      bounces
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.hero, isTablet && { maxWidth: 480, alignSelf: "center", width: "100%" }]}>
        <Text style={[styles.icon, isSmallScreen && { fontSize: 48, marginBottom: 4 }]} accessibilityLabel="おこづかいクエスト">⚔️</Text>
        <Text
          style={[styles.title, isTablet && { fontSize: 38 }, isSmallScreen && { fontSize: 26 }]}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          おこづかいクエスト
        </Text>
        <View style={{ alignItems: "center", marginBottom: 6 }}>
          <Text style={[styles.subtitle, isSmallScreen && { fontSize: 14 }]}>クエストをクリアして</Text>
          <RubyText style={[styles.subtitle, isSmallScreen && { fontSize: 14 }]} parts={["コインを ", ["稼", "かせ"], "ごう！"]} rubySize={7} />
        </View>
        <View style={{ alignItems: "center", marginBottom: 28 }}>
          <RubyText style={styles.description} parts={["お", ["手伝", "てつだ"], "い＝クエスト！"]} rubySize={5} />
          <RubyText style={styles.description} parts={[["稼", "かせ"], "いで、", ["貯", "た"], "めて、", ["増", "ふ"], "やすマネー", ["冒険", "ぼうけん"], "アプリ"]} rubySize={5} />
        </View>

        <View style={[styles.buttons, isSmallScreen && { marginBottom: 20 }]}>
          <AnimatedButton
            style={[styles.button, styles.buttonPrimary]}
            onPress={onLogin}
            accessibilityLabel="ログイン"
          >
            <Text style={styles.buttonIconText}>🔑</Text>
            <Text style={[styles.buttonPrimaryText, isTablet && { fontSize: 20 }]} adjustsFontSizeToFit numberOfLines={1}>
              ログイン
            </Text>
          </AnimatedButton>
        </View>

        <View style={styles.features}>
          <View style={[styles.featureCard, { backgroundColor: palette.walletSpendBg, borderColor: palette.walletSpendBorder }]}>
            <View style={[styles.featureIcon, { backgroundColor: palette.walletSpend }]}>
              <Text style={styles.featureEmoji}>💰</Text>
            </View>
            <RubyText style={[styles.featureTitle, { color: palette.walletSpendText }]} parts={[["使", "つか"], "う"]} rubySize={7} />
            {isLandscape ? (
              <AutoRubyText text="稼いだコインで好きなものを買おう！" style={[styles.featureDesc, { color: palette.walletSpendText }]} rubySize={4} />
            ) : (
              <View>
                <RubyText style={[styles.featureDesc, { color: palette.walletSpendText }]} parts={[["稼", "かせ"], "いだ"]} rubySize={4} />
                <Text style={[styles.featureDesc, { color: palette.walletSpendText }]}>コインで</Text>
                <RubyText style={[styles.featureDesc, { color: palette.walletSpendText }]} parts={[["好", "す"], "きなもの"]} rubySize={4} />
                <RubyText style={[styles.featureDesc, { color: palette.walletSpendText }]} parts={["を", ["買", "か"], "おう！"]} rubySize={4} />
              </View>
            )}
          </View>

          <View style={[styles.featureCard, { backgroundColor: palette.walletSaveBg, borderColor: palette.walletSaveBorder }]}>
            <View style={[styles.featureIcon, { backgroundColor: palette.walletSave }]}>
              <Text style={styles.featureEmoji}>🐷</Text>
            </View>
            <RubyText style={[styles.featureTitle, { color: palette.walletSaveText }]} parts={[["貯", "た"], "める"]} rubySize={7} />
            {isLandscape ? (
              <AutoRubyText text="貯金して大きな夢を叶えよう！" style={[styles.featureDesc, { color: palette.walletSaveText }]} rubySize={4} />
            ) : (
              <View>
                <RubyText style={[styles.featureDesc, { color: palette.walletSaveText }]} parts={[["貯金", "ちょきん"], "して"]} rubySize={4} />
                <RubyText style={[styles.featureDesc, { color: palette.walletSaveText }]} parts={[["大", "おお"], "きな", ["夢", "ゆめ"], "を"]} rubySize={4} />
                <RubyText style={[styles.featureDesc, { color: palette.walletSaveText }]} parts={[["叶", "かな"], "えよう！"]} rubySize={4} />
              </View>
            )}
          </View>

          <View style={[styles.featureCard, { backgroundColor: palette.walletInvestBg, borderColor: palette.walletInvestBorder }]}>
            <View style={[styles.featureIcon, { backgroundColor: palette.walletInvest }]}>
              <Text style={styles.featureEmoji}>🌱</Text>
            </View>
            <RubyText style={[styles.featureTitle, { color: palette.walletInvestText }]} parts={[["増", "ふ"], "やす"]} rubySize={7} />
            {isLandscape ? (
              <AutoRubyText text="コインを育てて もっと増やそう！" style={[styles.featureDesc, { color: palette.walletInvestText }]} rubySize={4} />
            ) : (
              <View>
                <RubyText style={[styles.featureDesc, { color: palette.walletInvestText }]} parts={["コインを", ["育", "そだ"], "てて"]} rubySize={4} />
                <RubyText style={[styles.featureDesc, { color: palette.walletInvestText }]} parts={["もっと", ["増", "ふ"], "やそう！"]} rubySize={4} />
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.legalRow}>
        <TouchableOpacity onPress={() => Linking.openURL("https://otetsudai-bank-beta.vercel.app/terms")} accessibilityRole="link" accessibilityLabel="りようきやく">
          <RubyText style={styles.legalLink} parts={[["利用規約", "りようきやく"]]} rubySize={6} />
        </TouchableOpacity>
        <Text style={styles.legalSep} accessibilityElementsHidden>|</Text>
        <TouchableOpacity onPress={() => Linking.openURL("https://otetsudai-bank-beta.vercel.app/privacy")} accessibilityRole="link" accessibilityLabel="プライバシーポリシー">
          <AutoRubyText text="プライバシーポリシー" style={styles.legalLink} rubySize={6} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: p.backgroundLanding,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    hero: {
      alignItems: "center",
    },
    icon: {
      fontSize: 64,
      marginBottom: 8,
    },
    title: {
      fontSize: rf(32),
      fontWeight: "800",
      color: p.primaryDark,
      marginBottom: 8,
      textAlign: "center",
    },
    subtitle: {
      fontSize: rf(13),
      color: p.primary,
      marginBottom: 6,
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
      marginBottom: 28,
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 16,
      paddingVertical: 18,
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
      fontSize: rf(18),
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
      padding: 10,
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
      fontSize: 9,
      lineHeight: 16,
      textAlign: "left" as const,
    },
    legalRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      marginTop: 8,
      marginBottom: 12,
    },
    legalLink: {
      fontSize: 11,
      color: p.primary,
    },
    legalSep: {
      fontSize: 11,
      color: p.textMuted,
    },
  });
}
