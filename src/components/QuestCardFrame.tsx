import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Rect, Path, Circle, G, Defs, LinearGradient, Stop } from "react-native-svg";

type Tier = "bronze" | "silver" | "gold";

type Props = {
  tier: Tier;
  children: React.ReactNode;
};

const TIER_COLORS = {
  bronze: { light: "#D8A878", mid: "#A0704C", dark: "#6B4430", gem: "#8B5E3C" },
  silver: { light: "#D8DEE4", mid: "#A0A8B0", dark: "#6B7580", gem: "#C0C8D0" },
  gold:   { light: "#FFE066", mid: "#DAA520", dark: "#B8860B", gem: "#E74C3C" },
};

/**
 * RPGクエストカードフレーム
 * クエストカードの周囲にピクセルア���ト風の装飾ボーダーを描画
 */
export default function QuestCardFrame({ tier, children }: Props) {
  const c = TIER_COLORS[tier];

  return (
    <View style={styles.container}>
      {/* 装飾ボーダーSVG（背景） */}
      <View style={styles.frameWrap}>
        <Svg width="100%" height="100%" viewBox="0 0 300 8" preserveAspectRatio="none">
          <Defs>
            <LinearGradient id={`qf-${tier}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={c.dark} />
              <Stop offset="20%" stopColor={c.mid} />
              <Stop offset="50%" stopColor={c.light} />
              <Stop offset="80%" stopColor={c.mid} />
              <Stop offset="100%" stopColor={c.dark} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={300} height={3} fill={`url(#qf-${tier})`} />
          <Rect x={0} y={5} width={300} height={1} fill={c.dark} opacity={0.3} />
          {/* 角の宝石装飾 */}
          <Circle cx={6} cy={4} r={3} fill={c.gem} />
          <Circle cx={294} cy={4} r={3} fill={c.gem} />
          {/* 中央装飾 */}
          {tier === "gold" && (
            <G>
              <Path d="M145,1 L150,6 L155,1 Z" fill={c.gem} />
              <Circle cx={150} cy={2} r={1.5} fill="#3498DB" />
            </G>
          )}
          {tier === "silver" && (
            <Circle cx={150} cy={3} r={2} fill={c.gem} />
          )}
        </Svg>
      </View>

      {/* コンテンツ */}
      <View style={[styles.content, { borderColor: c.mid, borderLeftWidth: 3 }]}>
        {children}
      </View>

      {/* 下部装飾 */}
      <View style={styles.frameWrapBottom}>
        <Svg width="100%" height="100%" viewBox="0 0 300 4" preserveAspectRatio="none">
          <Rect x={0} y={1} width={300} height={3} fill={`url(#qf-${tier})`} />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  frameWrap: {
    height: 8,
  },
  frameWrapBottom: {
    height: 4,
  },
  content: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
