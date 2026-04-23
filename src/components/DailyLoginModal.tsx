import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import {
  BONUS_SCHEDULE,
  claimDailyBonus,
  getDailyLoginStatus,
  type DailyBonusResult,
} from "../lib/daily-login";
import RpgButton from "./RpgButton";
import { PixelGiftIcon } from "./PixelIcons";
import { useTheme, type Palette } from "../theme";
import { RubyText } from "./Ruby";

type Props = {
  visible: boolean;
  onClose: () => void;
  childId: string;
  walletId: string | null;
  onClaimed?: () => void;
};

export default function DailyLoginModal({ visible, onClose, childId, walletId, onClaimed }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [status, setStatus] = useState<{
    canClaimToday: boolean;
    currentStreak: number;
    nextDayInCycle: number;
    nextAmount: number;
  } | null>(null);
  const [result, setResult] = useState<DailyBonusResult | null>(null);

  useEffect(() => {
    if (!visible) {
      setResult(null);
      return;
    }
    setLoading(true);
    getDailyLoginStatus(childId).then((s) => {
      setStatus({
        canClaimToday: s.canClaimToday,
        currentStreak: s.record?.current_streak ?? 0,
        nextDayInCycle: s.nextDayInCycle,
        nextAmount: s.nextAmount,
      });
      setLoading(false);
    });
  }, [visible, childId]);

  async function handleClaim() {
    if (!walletId) return;
    setClaiming(true);
    const r = await claimDailyBonus(childId, walletId);
    setResult(r);
    setClaiming(false);
    onClaimed?.();
  }

  const effectiveStreak = result?.awarded ? result.streak : status?.currentStreak ?? 0;
  const highlightDay = result?.awarded ? result.dayInCycle : status?.nextDayInCycle ?? 1;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <PixelGiftIcon size={18} />
            <Text style={styles.title}>ログインボーナス</Text>
          </View>
          <View style={{ alignItems: "center", marginTop: 4, marginBottom: 12 }}>
            {result?.awarded
              ? <RubyText parts={[`${result.streak}`, ["日", "にち"], ["連続", "れんぞく"], " ログイン！"]} style={styles.subtitle} rubySize={5} />
              : result?.alreadyClaimedToday
                ? <RubyText parts={[["今日", "きょう"], "は もう もらったよ"]} style={styles.subtitle} rubySize={5} />
                : <RubyText parts={[["毎日", "まいにち"], " ログインで コインゲット！"]} style={styles.subtitle} rubySize={5} />}
          </View>

          {loading ? (
            <ActivityIndicator color={palette.primary} style={{ marginVertical: 24 }} />
          ) : (
            <>
              <View style={styles.grid}>
                {BONUS_SCHEDULE.map((amount, i) => {
                  const day = i + 1;
                  const isToday = day === highlightDay;
                  const isPast = day < highlightDay;
                  return (
                    <View key={day} style={styles.dayCell}>
                      <View
                        style={[
                          styles.dayBox,
                          isToday && styles.dayBoxToday,
                          isPast && styles.dayBoxPast,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayAmount,
                            isToday && { color: palette.primary },
                            isPast && { color: palette.green },
                          ]}
                        >
                          {isPast ? "✓" : amount}
                        </Text>
                      </View>
                      <Text style={styles.dayLabel}>Day{day}</Text>
                    </View>
                  );
                })}
              </View>

              <RubyText parts={[["続", "つづ"], "けると ", ["益々", "ますます"], " ", ["多", "おお"], "く もらえる！"]} style={styles.hint} rubySize={5} />

              {result?.awarded ? (
                <View style={styles.amountWrap}>
                  <Text style={styles.bigAmount}>+{result.amount}円</Text>
                  <RubyText parts={["「", ["使", "つか"], "う」に ", ["追加", "ついか"], "されたよ！"]} style={styles.amountNote} rubySize={5} />
                </View>
              ) : status?.canClaimToday ? (
                <View style={{ marginVertical: 12 }}>
                  <RpgButton
                    tier="gold"
                    size="lg"
                    onPress={handleClaim}
                    disabled={claiming || !walletId}
                  >
                    {claiming ? "うけとり中..." : `+${status.nextAmount}えん うけとる`}
                  </RpgButton>
                </View>
              ) : (
                <RubyText parts={[["明日", "あした"], "も ", ["来", "き"], "てね！"]} style={styles.laterText} rubySize={5} />
              )}

              <RubyText parts={["🔥", `${effectiveStreak}`, ["日", "にち"], ["連続", "れんぞく"]]} style={styles.streakText} rubySize={5} />

              <View style={{ marginTop: 12 }}>
                <RpgButton tier="silver" size="md" onPress={onClose}>
                  とじる
                </RpgButton>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: p.overlay,
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    },
    card: {
      width: "100%",
      maxWidth: 380,
      backgroundColor: p.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: p.goldBorder,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      color: p.textStrong,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 12,
      color: p.textMuted,
      textAlign: "center",
      marginTop: 4,
      marginBottom: 12,
    },
    grid: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 4,
      marginVertical: 8,
    },
    dayCell: {
      flex: 1,
      alignItems: "center",
    },
    dayBox: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: p.border,
      backgroundColor: p.surfaceMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    dayBoxToday: {
      borderColor: p.primary,
      backgroundColor: p.primaryLight,
    },
    dayBoxPast: {
      borderColor: p.green,
      backgroundColor: p.greenLight,
    },
    dayAmount: {
      fontSize: 11,
      fontWeight: "bold",
      color: p.textMuted,
    },
    dayLabel: {
      fontSize: 9,
      color: p.textMuted,
      marginTop: 2,
    },
    hint: {
      fontSize: 11,
      color: p.textMuted,
      textAlign: "center",
      marginTop: 8,
    },
    amountWrap: {
      alignItems: "center",
      marginVertical: 12,
    },
    bigAmount: {
      fontSize: 32,
      fontWeight: "bold",
      color: p.primary,
    },
    amountNote: {
      fontSize: 11,
      color: p.textMuted,
      marginTop: 4,
    },
    laterText: {
      textAlign: "center",
      color: p.textMuted,
      fontSize: 13,
      marginVertical: 12,
    },
    streakText: {
      textAlign: "center",
      fontSize: 11,
      color: p.textMuted,
    },
  });
}
