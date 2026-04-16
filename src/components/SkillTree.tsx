import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BADGE_DEFINITIONS } from "../lib/badges";
import type { Badge } from "../lib/types";
import type { Palette } from "../theme";

/** バッジの表示順序と獲得条件テキスト */
const TREE_ORDER: { key: string; condition: string }[] = [
  { key: "first_task", condition: "1回クエストクリア" },
  { key: "streak_3", condition: "3日連続クリア" },
  { key: "earned_1000", condition: "合計1,000円" },
  { key: "saving_master", condition: "貯金目標達成" },
  { key: "quest_master", condition: "50回クリア" },
];

type Props = {
  badges: Badge[];
  palette: Palette;
};

export default function SkillTree({ badges, palette }: Props) {
  const earnedSet = new Set(badges.map((b) => b.badge_type));

  return (
    <View style={styles.container}>
      {TREE_ORDER.map((item, index) => {
        const def = BADGE_DEFINITIONS[item.key];
        if (!def) return null;
        const earned = earnedSet.has(item.key);
        const isLast = index === TREE_ORDER.length - 1;

        return (
          <View key={item.key} style={styles.row}>
            {/* ノード */}
            <View style={styles.nodeColumn}>
              <View
                style={[
                  styles.node,
                  earned
                    ? { backgroundColor: palette.accentLight, borderColor: palette.accent }
                    : { backgroundColor: palette.surfaceMuted, borderColor: palette.border },
                ]}
              >
                <Text style={[styles.nodeEmoji, !earned && styles.nodeEmojiLocked]}>
                  {def.emoji}
                </Text>
              </View>
              {/* 接続線 */}
              {!isLast && (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: earnedSet.has(TREE_ORDER[index + 1].key) ? palette.accent : palette.border },
                  ]}
                />
              )}
            </View>

            {/* テキスト */}
            <View style={styles.textColumn}>
              <Text
                style={[
                  styles.label,
                  { color: earned ? palette.textStrong : palette.textMuted },
                  earned && { fontWeight: "bold" },
                ]}
              >
                {def.label}
              </Text>
              {earned ? (
                <Text style={[styles.status, { color: palette.accent }]}>獲得済み ✓</Text>
              ) : (
                <Text style={[styles.condition, { color: palette.textMuted }]}>
                  {item.condition}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  nodeColumn: {
    alignItems: "center",
    width: 52,
  },
  node: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeEmoji: {
    fontSize: 22,
  },
  nodeEmojiLocked: {
    opacity: 0.3,
  },
  connector: {
    width: 3,
    height: 20,
    borderRadius: 1.5,
  },
  textColumn: {
    flex: 1,
    paddingTop: 6,
    paddingLeft: 8,
  },
  label: {
    fontSize: 14,
  },
  status: {
    fontSize: 11,
    marginTop: 1,
  },
  condition: {
    fontSize: 11,
    marginTop: 1,
  },
});
