import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { useTheme, type Palette } from "../theme";
import BattleScene from "./BattleScene";
import TreasureChestAnimation from "./TreasureChestAnimation";

type Props = {
  show: boolean;
  level: number;
  rewardAmount?: number;
  badgeEarned?: boolean;
  onComplete: () => void;
};

type Step = "battle" | "chest" | "exp" | "done";

/**
 * RPG報酬シーケンス（モバイル版）
 * バトル → 宝箱 → EXP/ゴールド獲得表示
 */
export default function RewardSequence({ show, level, rewardAmount = 0, badgeEarned, onComplete }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [step, setStep] = useState<Step>("battle");

  const reset = useCallback(() => setStep("battle"), []);

  useEffect(() => {
    if (show) reset();
  }, [show, reset]);

  if (!show) return null;

  return (
    <Modal visible transparent animationType="fade">
      {step === "battle" && (
        <BattleScene show level={level} onComplete={() => setStep("chest")} />
      )}

      {step === "chest" && (
        <TreasureChestAnimation show onComplete={() => setStep("exp")} />
      )}

      {step === "exp" && (
        <TouchableOpacity
          style={styles.expOverlay}
          activeOpacity={0.9}
          onPress={() => { setStep("done"); onComplete(); }}
        >
          <View style={styles.expCard}>
            <Text style={styles.completeText}>QUEST COMPLETE!</Text>

            {rewardAmount > 0 && (
              <View style={styles.rewardRow}>
                <Text style={styles.rewardLabel}>ゴールド</Text>
                <Text style={styles.rewardValue}>+{rewardAmount}G</Text>
              </View>
            )}

            {badgeEarned && (
              <View style={styles.rewardRow}>
                <Text style={styles.badgeText}>NEW そうび！</Text>
              </View>
            )}

            <Text style={styles.tapHint}>タップして とじる</Text>
          </View>
        </TouchableOpacity>
      )}
    </Modal>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    expOverlay: {
      flex: 1,
      backgroundColor: p.overlay,
      justifyContent: "center",
      alignItems: "center",
    },
    expCard: {
      backgroundColor: p.surface,
      borderWidth: 1.5,
      borderColor: p.goldBorder,
      borderRadius: 20,
      padding: 32,
      alignItems: "center",
      minWidth: 260,
    },
    completeText: {
      fontSize: 20,
      fontWeight: "bold",
      color: p.gold,
      marginBottom: 20,
    },
    rewardRow: {
      marginBottom: 12,
      alignItems: "center",
    },
    rewardLabel: {
      fontSize: 12,
      color: p.textMuted,
    },
    rewardValue: {
      fontSize: 28,
      fontWeight: "bold",
      color: p.gold,
    },
    badgeText: {
      fontSize: 14,
      fontWeight: "bold",
      color: p.accent,
    },
    tapHint: {
      fontSize: 11,
      color: p.textMuted,
      marginTop: 16,
    },
  });
}
