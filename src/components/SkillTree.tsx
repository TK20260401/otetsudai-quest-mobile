import React from "react";
import { View, StyleSheet } from "react-native";
import { BADGE_DEFINITIONS } from "../lib/badges";
import { AutoRubyText } from "./Ruby";
import type { Badge } from "../lib/types";
import type { Palette } from "../theme";
import IdleAnimationWrapper, { type IdleAnimationType } from "./IdleAnimationWrapper";
import {
  PixelCrossedSwordsIcon,
  PixelFlameIcon,
  PixelCoinIcon,
  PixelPiggyIcon,
  PixelTrophyIcon,
} from "./PixelIcons";

/** バッジの表示順序と獲得条件テキスト */
const TREE_ORDER: { key: string; condition: string }[] = [
  { key: "first_task", condition: "1回クエストクリア" },
  { key: "streak_3", condition: "3日連続クリア" },
  { key: "earned_1000", condition: "合計 1,000コロ" },
  { key: "saving_master", condition: "貯金目標 達成" },
  { key: "quest_master", condition: "50回クリア" },
];

/** バッジキー → SVGアイコン + アニメーション種別 */
const BADGE_ICON_MAP: Record<string, { icon: React.ComponentType<{ size?: number }>; anim: IdleAnimationType }> = {
  first_task:    { icon: PixelCrossedSwordsIcon, anim: "sway" },
  streak_3:      { icon: PixelFlameIcon,         anim: "flicker" },
  earned_1000:   { icon: PixelCoinIcon,          anim: "spin" },
  saving_master: { icon: PixelPiggyIcon,         anim: "bounce" },
  quest_master:  { icon: PixelTrophyIcon,        anim: "pulse" },
};

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
        const iconEntry = BADGE_ICON_MAP[item.key];

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
                {iconEntry ? (
                  earned ? (
                    <IdleAnimationWrapper type={iconEntry.anim}>
                      <View>
                        <iconEntry.icon size={24} />
                      </View>
                    </IdleAnimationWrapper>
                  ) : (
                    <View style={{ opacity: 0.3 }}>
                      <iconEntry.icon size={24} />
                    </View>
                  )
                ) : null}
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
              <AutoRubyText
                text={def.label}
                style={[
                  styles.label,
                  { color: earned ? palette.textStrong : palette.textMuted },
                  earned && { fontWeight: "bold" },
                ]}
                rubySize={6}
              />
              {earned ? (
                <AutoRubyText
                  text="獲得済み ✓"
                  style={[styles.status, { color: palette.accent }]}
                  rubySize={5}
                />
              ) : (
                <AutoRubyText
                  text={item.condition}
                  style={[styles.condition, { color: palette.textMuted }]}
                  rubySize={5}
                />
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
