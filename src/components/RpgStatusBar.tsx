import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect, Path, G, Defs, LinearGradient, Stop } from "react-native-svg";
import WalletBalanceAnimation from "./WalletBalanceAnimation";

type Props = {
  hp: number;     // 0-100
  mp: number;     // 連続週数 (表示用)
  exp: number;    // 0-100
  maxMp?: number; // MP最大値（表示スケール用、デフォルト10）
};

/**
 * RPG 3ゲージステータスバー
 * HP(赤) = 過去7日の活動率
 * MP(青) = 貯金連続週数
 * EXP(金) = レベル進捗
 */
export default function RpgStatusBar({ hp, mp, exp, maxMp = 10 }: Props) {
  const mpPercent = Math.min(100, Math.round((mp / maxMp) * 100));

  return (
    <View style={styles.container}>
      <GaugeRow label="HP" value={hp} max={100} color1="#E74C3C" color2="#C0392B" icon="heart" numValue={Math.round(hp)} />
      <GaugeRow label="MP" value={mpPercent} max={100} color1="#3498DB" color2="#2980B9" icon="magic" numValue={mpPercent} />
      <GaugeRow label="EXP" value={exp} max={100} color1="#FFD700" color2="#DAA520" icon="sword" numValue={exp} />
    </View>
  );
}

type GaugeProps = {
  label: string;
  value: number;
  max: number;
  color1: string;
  color2: string;
  icon: "heart" | "magic" | "sword";
  numValue: number;
};

function GaugeRow({ label, value, max, color1, color2, icon, numValue }: GaugeProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <GaugeIcon type={icon} />
      </View>
      <Text style={[styles.label, { color: color1 }]}>{label}</Text>
      <View style={styles.barOuter}>
        <Svg width="100%" height={12} viewBox="0 0 200 12">
          <Defs>
            <LinearGradient id={`gauge-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor={color1} />
              <Stop offset="100%" stopColor={color2} />
            </LinearGradient>
          </Defs>
          {/* 背景 */}
          <Rect x={0} y={0} width={200} height={12} rx={6} fill="#2A2A3E" />
          {/* ゲージ */}
          <Rect x={0} y={0} width={pct * 2} height={12} rx={6} fill={`url(#gauge-${label})`} />
          {/* ハイライト */}
          <Rect x={0} y={1} width={pct * 2} height={4} rx={3} fill="#FFFFFF" opacity={0.2} />
          {/* セグメントマーク */}
          {[25, 50, 75].map((seg) => (
            <Rect key={seg} x={seg * 2 - 0.5} y={0} width={1} height={12} fill="#1A1A2E" opacity={0.4} />
          ))}
        </Svg>
      </View>
      <WalletBalanceAnimation
        value={numValue}
        duration={600}
        formatFn={(n) => `${n}%`}
        textStyle={styles.suffix}
      />
    </View>
  );
}

function GaugeIcon({ type }: { type: "heart" | "magic" | "sword" }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      {type === "heart" && (
        <Path d="M7,12 C3,9 1,6 1,4 C1,2 3,1 5,2 L7,4 L9,2 C11,1 13,2 13,4 C13,6 11,9 7,12Z" fill="#E74C3C" />
      )}
      {type === "magic" && (
        <G>
          <Path d="M7,1 L8,5 L12,5 L9,8 L10,12 L7,10 L4,12 L5,8 L2,5 L6,5Z" fill="#3498DB" />
        </G>
      )}
      {type === "sword" && (
        <G>
          <Rect x={6} y={1} width={2} height={8} rx={0.5} fill="#FFD700" />
          <Rect x={4} y={8} width={6} height={2} rx={1} fill="#DAA520" />
          <Rect x={5.5} y={10} width={3} height={3} rx={0.5} fill="#8B6914" />
        </G>
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    padding: 8,
    gap: 4,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconWrap: {
    width: 16,
    alignItems: "center",
  },
  label: {
    fontSize: 9,
    fontWeight: "bold",
    width: 24,
  },
  barOuter: {
    flex: 1,
    height: 12,
  },
  suffix: {
    fontSize: 9,
    color: "#888",
    width: 32,
    textAlign: "right",
  },
});
