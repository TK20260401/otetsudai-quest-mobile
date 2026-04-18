import React, { useMemo } from "react";
import { View, Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import Svg, { Rect, Defs, LinearGradient, Stop, RadialGradient, Path } from "react-native-svg";
import { useTheme, type Palette } from "../theme";

type Tier = "gold" | "silver" | "bronze" | "violet";
type Variant = "full" | "compact";

type Props = {
  tier?: Tier;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  title?: React.ReactNode;
  children: React.ReactNode;
};

const TIER_COLORS: Record<Tier, { light: string; mid: string; dark: string; gem: string; gemShine: string; glow: string }> = {
  gold:   { light: "#FFE066", mid: "#FFA623", dark: "#A86500", gem: "#E74C3C", gemShine: "#FFB9B0", glow: "rgba(255,166,35,0.45)" },
  silver: { light: "#E6EAF0", mid: "#A8B0BC", dark: "#5E6672", gem: "#3498DB", gemShine: "#AEDBFA", glow: "rgba(168,176,188,0.4)" },
  bronze: { light: "#E0B98A", mid: "#A87044", dark: "#5E3A20", gem: "#F1C40F", gemShine: "#FFE896", glow: "rgba(168,112,68,0.45)" },
  violet: { light: "#B79BFF", mid: "#6B4CDB", dark: "#321C7A", gem: "#F9C33B", gemShine: "#FFE39B", glow: "rgba(107,76,219,0.45)" },
};

/**
 * SVG装飾付きRPGカードフレーム（モバイル版）
 */
export default function RpgCard({ tier = "gold", variant = "full", style, contentStyle, title, children }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const c = TIER_COLORS[tier];
  const uid = `rpgcard-${tier}`;
  const barHeight = variant === "compact" ? 5 : 8;

  return (
    <View
      style={[
        styles.root,
        {
          shadowColor: c.mid,
          borderColor: c.mid,
        },
        style,
      ]}
    >
      {/* 上部装飾帯 */}
      <Svg width="100%" height={barHeight} viewBox={`0 0 300 ${barHeight}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={`${uid}-top`} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={c.dark} />
            <Stop offset="18%" stopColor={c.mid} />
            <Stop offset="50%" stopColor={c.light} />
            <Stop offset="82%" stopColor={c.mid} />
            <Stop offset="100%" stopColor={c.dark} />
          </LinearGradient>
          <RadialGradient id={`${uid}-gem`} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={c.gemShine} stopOpacity="1" />
            <Stop offset="100%" stopColor={c.gem} stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={300} height={barHeight - 2} fill={`url(#${uid}-top)`} />
        <Rect x={0} y={barHeight - 2} width={300} height={1} fill={c.dark} opacity={0.6} />
        <Rect x={2} y={1} width={4} height={4} fill={c.dark} />
        <Rect x={3} y={2} width={2} height={2} fill={`url(#${uid}-gem)`} />
        <Rect x={294} y={1} width={4} height={4} fill={c.dark} />
        <Rect x={295} y={2} width={2} height={2} fill={`url(#${uid}-gem)`} />
        {tier === "gold" && (
          <>
            <Path d={`M145,0 L150,${barHeight} L155,0 Z`} fill={c.gem} />
            <Rect x={149} y={1} width={2} height={2} fill={c.gemShine} />
          </>
        )}
        {tier === "violet" && (
          <>
            <Rect x={146} y={1} width={8} height={barHeight - 3} fill={c.gem} />
            <Rect x={148} y={2} width={4} height={2} fill={c.gemShine} />
          </>
        )}
      </Svg>

      {title ? (
        <View style={[styles.titleBar, { borderBottomColor: `${c.mid}55` }]}>
          {typeof title === "string" ? (
            <Text style={[styles.titleText, { color: c.light }]}>{title}</Text>
          ) : (
            title
          )}
        </View>
      ) : null}

      <View style={[variant === "compact" ? styles.contentCompact : styles.content, contentStyle]}>
        {children}
      </View>

      {/* 下部装飾帯 */}
      <Svg width="100%" height={barHeight - 2} viewBox={`0 0 300 ${barHeight - 2}`} preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={`${uid}-bot`} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={c.dark} />
            <Stop offset="18%" stopColor={c.mid} />
            <Stop offset="50%" stopColor={c.light} />
            <Stop offset="82%" stopColor={c.mid} />
            <Stop offset="100%" stopColor={c.dark} />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={300} height={barHeight - 2} fill={`url(#${uid}-bot)`} />
      </Svg>
    </View>
  );
}

function createStyles(palette: Palette) {
  return StyleSheet.create({
    root: {
      backgroundColor: palette.surface,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    },
    titleBar: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    titleText: {
      fontSize: 13,
      fontWeight: "700",
    },
    content: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    contentCompact: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
  });
}
