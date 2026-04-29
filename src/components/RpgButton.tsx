import React from "react";
import { Text, View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import Svg, { Rect, Defs, LinearGradient, Stop } from "react-native-svg";
import TapFeedback from "./TapFeedback";

type Tier = "gold" | "silver" | "violet" | "emerald" | "ruby" | "sapphire";
type Size = "sm" | "md" | "lg";

type Props = {
  tier?: Tier;
  size?: Size;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  accessibilityLabel?: string;
  /** アイコン+テキストを左寄せ（デフォルトは中央寄せ）。複数ボタンで行頭/アイコン位置を揃えたい時に使う */
  contentAlign?: "center" | "start";
};

const TIER_COLORS: Record<Tier, { light: string; mid: string; dark: string; stroke: string; text: string; glow: string }> = {
  gold:     { light: "#FFE066", mid: "#FFA623", dark: "#8A5200", stroke: "#6B3E00", text: "#2A1800", glow: "#FFA623" },
  silver:   { light: "#EFF1F5", mid: "#B0B7C2", dark: "#5E6672", stroke: "#3A4048", text: "#1A1D22", glow: "#B0B7C2" },
  violet:   { light: "#B79BFF", mid: "#6B4CDB", dark: "#321C7A", stroke: "#1E0F4D", text: "#FFFFFF", glow: "#6B4CDB" },
  emerald:  { light: "#5EE89E", mid: "#2ECC71", dark: "#157A40", stroke: "#0A4526", text: "#02160C", glow: "#2ECC71" },
  ruby:     { light: "#FF9088", mid: "#E74C3C", dark: "#8A2218", stroke: "#4D110B", text: "#FFFFFF", glow: "#E74C3C" },
  sapphire: { light: "#6FBDF0", mid: "#3498DB", dark: "#164E72", stroke: "#0B2B41", text: "#FFFFFF", glow: "#3498DB" },
};

const SIZE_PRESETS: Record<Size, { height: number; paddingH: number; fontSize: number }> = {
  sm: { height: 32, paddingH: 12, fontSize: 12 },
  md: { height: 44, paddingH: 20, fontSize: 14 },
  lg: { height: 56, paddingH: 24, fontSize: 16 },
};

export default function RpgButton({
  tier = "gold",
  size = "md",
  style,
  fullWidth,
  disabled,
  onPress,
  children,
  accessibilityLabel,
  contentAlign = "center",
}: Props) {
  const c = TIER_COLORS[tier];
  const s = SIZE_PRESETS[size];
  const uid = `rpgbtn-${tier}`;

  return (
    <TapFeedback onPress={onPress} disabled={disabled}>
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[
          styles.root,
          {
            height: s.height,
            paddingHorizontal: s.paddingH,
            borderColor: c.stroke,
            shadowColor: c.glow,
            opacity: disabled ? 0.5 : 1,
          },
          fullWidth && styles.fullWidth,
          style,
        ]}
      >
        {/* SVG グラデ背景 */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Svg width="100%" height="100%" viewBox="0 0 200 48" preserveAspectRatio="none">
            <Defs>
              <LinearGradient id={`${uid}-bg`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={c.light} />
                <Stop offset="45%" stopColor={c.mid} />
                <Stop offset="100%" stopColor={c.dark} />
              </LinearGradient>
              <LinearGradient id={`${uid}-shine`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
                <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width={200} height={48} fill={`url(#${uid}-bg)`} />
            <Rect x={0} y={0} width={200} height={18} fill={`url(#${uid}-shine)`} />
            <Rect x={0} y={0} width={200} height={2} fill={c.light} opacity={0.8} />
            <Rect x={0} y={2} width={200} height={1} fill="#ffffff" opacity={0.35} />
            <Rect x={0} y={45} width={200} height={3} fill={c.dark} opacity={0.7} />
            {(tier === "gold" || tier === "violet") && (
              <>
                <Rect x={3} y={3} width={3} height={3} fill={c.light} />
                <Rect x={194} y={3} width={3} height={3} fill={c.light} />
                <Rect x={3} y={42} width={3} height={3} fill={c.dark} />
                <Rect x={194} y={42} width={3} height={3} fill={c.dark} />
              </>
            )}
          </Svg>
        </View>

        {/* コンテンツ */}
        <View style={[styles.content, contentAlign === "start" && styles.contentStart]}>
          {typeof children === "string" ? (
            <Text style={[styles.text, { color: c.text, fontSize: s.fontSize }]} numberOfLines={1} adjustsFontSizeToFit>{children}</Text>
          ) : (
            React.Children.map(children, (child) => {
              if (typeof child === "string" || typeof child === "number") {
                return <Text style={[styles.text, { color: c.text, fontSize: s.fontSize }]} numberOfLines={1} adjustsFontSizeToFit>{child}</Text>;
              }
              return child;
            })
          )}
        </View>
      </View>
    </TapFeedback>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  fullWidth: { alignSelf: "stretch" },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    zIndex: 1,
    flexShrink: 1,
    paddingHorizontal: 4,
  },
  contentStart: {
    alignSelf: "stretch",
    justifyContent: "flex-start",
    gap: 12,
    paddingHorizontal: 0,
  },
  text: {
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});
