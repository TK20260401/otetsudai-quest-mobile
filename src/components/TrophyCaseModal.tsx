import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BADGE_DEFINITIONS } from "../lib/badges";
import { supabase } from "../lib/supabase";
import type { Badge } from "../lib/types";
import RpgCard from "./RpgCard";
import RpgButton from "./RpgButton";
import { PixelTrophyIcon } from "./PixelIcons";
import CoinKunChat from "./CoinKunChat";
import { useTheme, type Palette } from "../theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  childId: string;
};

export default function TrophyCaseModal({ visible, onClose, childId }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const insets = useSafeAreaInsets();

  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    supabase
      .from("otetsudai_badges")
      .select("*")
      .eq("child_id", childId)
      .order("earned_at", { ascending: true })
      .then(({ data }) => {
        setBadges((data as Badge[]) || []);
        setLoading(false);
      });
  }, [visible, childId]);

  const earnedMap = useMemo(() => {
    const map = new Map<string, Badge>();
    for (const b of badges) map.set(b.badge_type, b);
    return map;
  }, [badges]);

  const entries = Object.entries(BADGE_DEFINITIONS);
  const earnedCount = entries.filter(([key]) => earnedMap.has(key)).length;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <PixelTrophyIcon size={20} />
            <Text style={styles.headerTitle}>トロフィーケース</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityLabel="トロフィーケースを閉じる"
            accessibilityRole="button"
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          しゅとく {earnedCount} / {entries.length} バッジ
        </Text>

        <ScrollView
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator
        >
          {loading ? (
            <ActivityIndicator color={palette.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.grid}>
              {entries.map(([key, def]) => {
                const earned = earnedMap.get(key);
                const isEarned = !!earned;
                return (
                  <View key={key} style={styles.gridItem}>
                    <RpgCard
                      tier={isEarned ? "gold" : "violet"}
                      variant="compact"
                      style={{ opacity: isEarned ? 1 : 0.55 }}
                    >
                      <View style={styles.cardInner}>
                        <Text style={styles.emoji}>
                          {isEarned ? def.emoji : "🔒"}
                        </Text>
                        <Text
                          style={[
                            styles.label,
                            { color: isEarned ? palette.accent : palette.textMuted },
                          ]}
                          numberOfLines={1}
                        >
                          {isEarned ? def.label : "？？？"}
                        </Text>
                        <Text style={styles.desc} numberOfLines={2}>
                          {def.description}
                        </Text>
                        {isEarned && earned && (
                          <Text style={styles.date}>
                            {new Date(earned.earned_at).toLocaleDateString("ja-JP")}
                          </Text>
                        )}
                      </View>
                    </RpgCard>
                  </View>
                );
              })}
            </View>
          )}
          <View style={{ marginTop: 12 }}>
            <RpgButton tier="silver" size="md" onPress={onClose}>
              とじる
            </RpgButton>
          </View>
        </ScrollView>
      </View>
      <CoinKunChat role="child" />
    </Modal>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: p.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: p.textStrong,
    },
    closeBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 18,
      backgroundColor: p.surfaceMuted,
    },
    closeText: {
      fontSize: 16,
      color: p.textStrong,
    },
    subtitle: {
      fontSize: 12,
      color: p.textMuted,
      textAlign: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    gridItem: {
      width: "48%",
    },
    cardInner: {
      alignItems: "center",
      paddingVertical: 6,
    },
    emoji: {
      fontSize: 32,
      marginBottom: 4,
    },
    label: {
      fontSize: 12,
      fontWeight: "bold",
      textAlign: "center",
    },
    desc: {
      fontSize: 9,
      color: p.textMuted,
      textAlign: "center",
      lineHeight: 13,
      marginTop: 2,
    },
    date: {
      fontSize: 8,
      color: p.accent,
      marginTop: 4,
    },
  });
}
