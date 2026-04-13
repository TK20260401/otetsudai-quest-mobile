import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../lib/colors";
import { rf } from "../lib/responsive";

type Props = {
  onSignup: () => void;
  onLogin: () => void;
};

export default function LandingScreen({ onSignup, onLogin }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 600;
  const isSmallScreen = height < 700;

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
        <Text style={[styles.icon, isSmallScreen && { fontSize: 48, marginBottom: 4 }]}>⚔️</Text>
        <Text
          style={[styles.title, isTablet && { fontSize: 38 }, isSmallScreen && { fontSize: 26 }]}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          おこづかいクエスト
        </Text>
        <Text
          style={[styles.subtitle, isSmallScreen && { fontSize: 14 }]}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          クエストをクリアして コインを かせごう！
        </Text>
        <Text style={styles.description} adjustsFontSizeToFit numberOfLines={2}>
          お手伝い＝クエスト！稼いで、貯めて、増やすマネー冒険アプリ
        </Text>

        <View style={[styles.buttons, isSmallScreen && { marginBottom: 20 }]}>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={onSignup}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonIconText}>⚔️</Text>
            <Text style={[styles.buttonPrimaryText, isTablet && { fontSize: 20 }]}>
              あたらしく はじめる
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonOutline]}
            onPress={onLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonIconText}>🔑</Text>
            <Text style={[styles.buttonOutlineText, isTablet && { fontSize: 20 }]}>
              ログイン
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.features}>
          <View style={[styles.featureCard, { backgroundColor: "#fef2f2", borderColor: "#fecaca" }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.spend }]}>
              <Text style={styles.featureEmoji}>💰</Text>
            </View>
            <Text style={[styles.featureTitle, { color: "#b91c1c" }]}>つかう</Text>
            <Text style={[styles.featureDesc, { color: "#dc2626" }]}>
              かせいだコインで すきなものを かおう！
            </Text>
          </View>

          <View style={[styles.featureCard, { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.save }]}>
              <Text style={styles.featureEmoji}>🐷</Text>
            </View>
            <Text style={[styles.featureTitle, { color: "#1d4ed8" }]}>ためる</Text>
            <Text style={[styles.featureDesc, { color: "#2563eb" }]}>
              ちょきんして おおきな ゆめを かなえよう！
            </Text>
          </View>

          <View style={[styles.featureCard, { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" }]}>
            <View style={[styles.featureIcon, { backgroundColor: colors.invest }]}>
              <Text style={styles.featureEmoji}>🌱</Text>
            </View>
            <Text style={[styles.featureTitle, { color: "#15803d" }]}>ふやす</Text>
            <Text style={[styles.featureDesc, { color: "#16a34a" }]}>
              コインをそだてて もっと ふやそう！
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.footer}>おこづかいクエスト v0.5</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#fefce8",
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
    color: "#065f46",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: rf(16),
    color: colors.primary,
    marginBottom: 2,
    textAlign: "center",
  },
  description: {
    fontSize: rf(12),
    color: colors.slate,
    marginBottom: 28,
    textAlign: "center",
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
    backgroundColor: colors.primary,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonOutline: {
    borderWidth: 2,
    borderColor: "#6ee7b7",
    backgroundColor: colors.white,
  },
  buttonIconText: {
    fontSize: 24,
  },
  buttonPrimaryText: {
    fontSize: rf(18),
    fontWeight: "bold",
    color: colors.white,
  },
  buttonOutlineText: {
    fontSize: rf(18),
    fontWeight: "bold",
    color: "#047857",
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
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 10,
  },
  footer: {
    textAlign: "center",
    fontSize: 11,
    color: colors.slate,
    marginTop: 24,
  },
});
