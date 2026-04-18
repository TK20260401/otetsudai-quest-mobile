import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect, Path, G } from "react-native-svg";
import type { RpgStats } from "../lib/rpg-stats";

type Props = {
  stats: RpgStats;
  appearance: string;
};

/**
 * RPG装備ステータスシート
 * ATK/DEF/LCKをピクセルアイコン付きで表示
 */
export default function EquipmentView({ stats, appearance }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{appearance}</Text>
      <View style={styles.statsRow}>
        <StatItem icon="sword" label="ATK" value={stats.atk} color="#E74C3C" />
        <StatItem icon="shield" label="DEF" value={stats.def} color="#3498DB" />
        <StatItem icon="clover" label="LCK" value={stats.lck} color="#2ECC71" />
      </View>
    </View>
  );
}

function StatItem({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <View style={styles.statItem}>
      <StatIcon type={icon} color={color} />
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function StatIcon({ type, color }: { type: string; color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16">
      {type === "sword" && (
        <G>
          <Rect x={7} y={1} width={2} height={9} rx={0.5} fill={color} />
          <Rect x={5} y={9} width={6} height={2} rx={1} fill={color} />
          <Rect x={6.5} y={11} width={3} height={3} rx={0.5} fill="#8B6914" />
        </G>
      )}
      {type === "shield" && (
        <Path d="M8,1 L14,4 L14,9 Q14,14 8,15 Q2,14 2,9 L2,4 Z" fill={color} opacity={0.8} />
      )}
      {type === "clover" && (
        <G>
          <Path d="M8,3 Q5,3 5,5.5 Q5,8 8,8 Q11,8 11,5.5 Q11,3 8,3Z" fill={color} />
          <Path d="M5,8 Q3,8 3,10 Q3,12 5.5,12 Q8,12 8,10 Q8,8 5,8Z" fill={color} />
          <Path d="M11,8 Q13,8 13,10 Q13,12 10.5,12 Q8,12 8,10 Q8,8 11,8Z" fill={color} />
          <Rect x={7.5} y={11} width={1} height={4} fill="#5D4037" />
        </G>
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(26,26,46,0.9)",
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  title: {
    fontSize: 9,
    color: "#DAA520",
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: 2,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: "bold",
  },
  statValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});
