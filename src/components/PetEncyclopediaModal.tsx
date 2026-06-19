import React, { useEffect, useMemo, useState } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useTheme, type Palette } from "../theme";
import { RubyText } from "./Ruby";
import { PixelCrossIcon, PixelStarIcon } from "./PixelIcons";
import PetSvg from "./PetSvg";
import { PET_TYPE_INFO, type GrowthStage } from "../lib/pets";
import { getEncyclopedia, getDiscoveryBadge, type EncyclopediaEntry } from "../lib/pet-encyclopedia";

type Props = {
  visible: boolean;
  onClose: () => void;
  childId: string;
};

const STAGE_LABEL_PARTS: Record<GrowthStage, (string | [string, string])[]> = {
  egg: [["卵", "たまご"]],
  baby: [["赤", "あか"], "ちゃん"],
  child: [["子", "こ"], "ども"],
  adult: [["大人", "おとな"]],
};

export default function PetEncyclopediaModal({ visible, onClose, childId }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<EncyclopediaEntry[]>([]);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    getEncyclopedia(childId).then((data) => {
      setEntries(data);
      setLoading(false);
    });
  }, [visible, childId]);

  const badge = getDiscoveryBadge(entries);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity
            onPress={onClose}
            accessibilityLabel="とじる"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.closeBtn}
          >
            <PixelCrossIcon size={20} />
          </TouchableOpacity>

          <View style={styles.header}>
            <PixelStarIcon size={22} />
            <RubyText style={styles.title} parts={["ペット", ["図鑑", "ずかん"]]} rubySize={6} />
          </View>

          {/* 進捗バッジ */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <RubyText style={styles.statLabel} parts={[["発見", "はっけん"]]} rubySize={4} />
              <Text style={styles.statValue}>
                {badge.seen}<Text style={styles.statTotal}>／{badge.total}</Text>
              </Text>
            </View>
            <View style={styles.statBox}>
              <RubyText
                style={styles.statLabel}
                parts={[["完", "かん"], ["全", "ぜん"], ["成", "せい"], ["長", "ちょう"]]}
                rubySize={4}
              />
              <Text style={styles.statValue}>
                {badge.fullyGrown}<Text style={styles.statTotal}>／{badge.total}</Text>
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={palette.primary} />
              <RubyText style={styles.loadingText} parts={[["読", "よ"], "み", ["込", "こ"], "み", ["中", "ちゅう"], "..."]} rubySize={5} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
              {entries.map((entry) => {
                const info = PET_TYPE_INFO[entry.petType];
                const discovered = entry.highestStage !== null;
                const isAdult = entry.highestStage === "adult";
                return (
                  <View
                    key={entry.petType}
                    style={[
                      styles.cell,
                      discovered ? styles.cellDiscovered : styles.cellLocked,
                      isAdult && styles.cellComplete,
                    ]}
                  >
                    <View style={styles.cellIconWrap}>
                      {discovered ? (
                        <View style={styles.iconClip}>
                          <PetSvg
                            type={entry.petType}
                            stage={entry.highestStage as GrowthStage}
                            size={44}
                            animated={false}
                          />
                        </View>
                      ) : (
                        <View style={styles.silhouette}>
                          <Text style={styles.silhouetteText}>？</Text>
                        </View>
                      )}
                    </View>
                    {discovered ? (
                      <>
                        <Text style={styles.cellName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{info.nameJa}</Text>
                        <RubyText
                          style={styles.cellStage}
                          parts={STAGE_LABEL_PARTS[entry.highestStage as GrowthStage]}
                          rubySize={4}
                        />
                        <RubyText
                          style={styles.cellCount}
                          parts={[`${entry.totalCount}`, ["匹", "ひき"]]}
                          rubySize={4}
                        />
                      </>
                    ) : (
                      <RubyText style={styles.cellLockText} parts={[["未", "み"], ["発", "はっ"], ["見", "けん"]]} rubySize={4} />
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* 説明文 */}
          <RubyText
            style={styles.hint}
            parts={[
              "クエストを",
              ["頑張", "がんば"],
              "って ペットを ",
              ["仲間", "なかま"],
              "に しよう！",
            ]}
            rubySize={4}
          />
        </View>
      </View>
    </Modal>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: p.overlay,
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
    },
    card: {
      width: "100%",
      maxWidth: 460,
      maxHeight: "90%",
      backgroundColor: p.surface,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: p.primary,
      padding: 16,
      gap: 10,
      position: "relative" as const,
    },
    closeBtn: {
      position: "absolute" as const,
      top: 8,
      right: 8,
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: p.surfaceMuted,
      zIndex: 10,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: "800",
      color: p.textStrong,
    },
    statsRow: {
      flexDirection: "row",
      gap: 8,
    },
    statBox: {
      flex: 1,
      backgroundColor: p.surfaceMuted,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      alignItems: "center" as const,
      borderWidth: 1,
      borderColor: p.border,
    },
    statLabel: {
      fontSize: 11,
      color: p.textMuted,
      fontWeight: "700",
    },
    statValue: {
      fontSize: 18,
      fontWeight: "800",
      color: p.accent,
      marginTop: 2,
    },
    statTotal: {
      fontSize: 12,
      fontWeight: "600",
      color: p.textMuted,
    },
    loading: {
      paddingVertical: 40,
      alignItems: "center" as const,
      gap: 8,
    },
    loadingText: {
      fontSize: 12,
      color: p.textMuted,
    },
    grid: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      justifyContent: "space-between" as const,
      gap: 8,
      paddingVertical: 4,
    },
    cell: {
      width: "31%",
      aspectRatio: 0.7,
      borderRadius: 12,
      borderWidth: 2,
      padding: 6,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 1,
    },
    cellLocked: {
      backgroundColor: p.surfaceMuted,
      borderColor: p.border,
      opacity: 0.7,
    },
    cellDiscovered: {
      backgroundColor: p.surface,
      borderColor: p.border,
    },
    cellComplete: {
      borderColor: p.accent,
      borderWidth: 3,
      backgroundColor: p.surfaceMuted,
    },
    cellIconWrap: {
      width: 56,
      height: 56,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    iconClip: {
      width: 56,
      height: 56,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    silhouette: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: p.surfaceMuted,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      borderWidth: 1,
      borderColor: p.border,
    },
    silhouetteTextWrap: {
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    silhouetteText: {
      fontSize: 28,
      fontWeight: "900",
      color: p.textMuted,
    },
    cellName: {
      fontSize: 9,
      fontWeight: "700",
      color: p.textStrong,
      marginTop: 2,
    },
    cellStage: {
      fontSize: 8,
      color: p.accent,
      fontWeight: "600",
    },
    cellCount: {
      fontSize: 7,
      color: p.textMuted,
    },
    cellLockText: {
      fontSize: 8,
      color: p.textMuted,
      fontWeight: "600",
    },
    hint: {
      fontSize: 11,
      color: p.textMuted,
      textAlign: "center" as const,
      marginTop: 4,
    },
  });
}
