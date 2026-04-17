import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import { AutoRubyText } from "./Ruby";
import type { FamilyChallenge, User } from "../lib/types";
import { PixelCrownIcon, PixelGiftIcon, PixelConfettiIcon } from "./PixelIcons";

type Props = {
  challenge: FamilyChallenge;
  children: User[];
  isParent?: boolean;
};

type ChildProgress = {
  childId: string;
  name: string;
  icon: string;
  count: number;
};

export default function FamilyChallengeCard({
  challenge,
  children: kids,
  isParent,
}: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [progress, setProgress] = useState<ChildProgress[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function load() {
      if (kids.length === 0) return;
      const childIds = kids.map((k) => k.id);

      const { data: logs } = await supabase
        .from("otetsudai_task_logs")
        .select("child_id")
        .in("child_id", childIds)
        .eq("status", "approved")
        .gte("approved_at", `${challenge.start_date}T00:00:00`)
        .lte("approved_at", `${challenge.end_date}T23:59:59`);

      const counts: Record<string, number> = {};
      (logs || []).forEach((l: { child_id: string }) => {
        counts[l.child_id] = (counts[l.child_id] || 0) + 1;
      });

      const prog = kids.map((k) => ({
        childId: k.id,
        name: k.name,
        icon: k.icon,
        count: counts[k.id] || 0,
      }));

      setProgress(prog);
      setTotalCount(prog.reduce((s, p) => s + p.count, 0));
    }
    load();
  }, [challenge.id, kids]);

  const percent = Math.min(
    100,
    Math.round((totalCount / challenge.target_quests) * 100)
  );
  const remaining = Math.max(0, challenge.target_quests - totalCount);
  const isComplete = challenge.is_achieved || totalCount >= challenge.target_quests;

  // 期間内かチェック
  const today = new Date().toISOString().slice(0, 10);
  const isActive = today >= challenge.start_date && today <= challenge.end_date;
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(challenge.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );

  return (
    <View style={[styles.container, isComplete && styles.containerComplete]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <PixelCrownIcon size={20} />
        <AutoRubyText
          text={isComplete ? "かぞくチャレンジ たっせい！" : "かぞくチャレンジ"}
          style={styles.header}
          rubySize={6}
        />
      </View>

      <Text style={styles.title}>「{challenge.title}」</Text>

      {/* メンバー進捗 */}
      <View style={styles.membersSection}>
        {progress.map((p) => {
          const ratio = challenge.target_quests > 0
            ? Math.min(1, p.count / Math.ceil(challenge.target_quests / kids.length))
            : 0;
          return (
            <View key={p.childId} style={styles.memberRow}>
              <Text style={styles.memberIcon}>{p.icon}</Text>
              <Text style={styles.memberName} numberOfLines={1}>
                {p.name}
              </Text>
              <View style={styles.barBg}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.round(ratio * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.memberCount}>{p.count}</Text>
            </View>
          );
        })}
      </View>

      {/* 合計進捗バー */}
      <View style={styles.totalSection}>
        <Text style={styles.totalText}>
          かぞく ごうけい: {totalCount}/{challenge.target_quests} クエスト
        </Text>
        <View style={styles.totalBarBg}>
          <View
            style={[
              styles.totalBarFill,
              {
                width: `${percent}%`,
                backgroundColor: isComplete ? palette.green : palette.primary,
              },
            ]}
          />
        </View>
        <Text style={styles.percentText}>{percent}%</Text>
      </View>

      {/* ボーナス + 残り */}
      <View style={styles.footer}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <PixelGiftIcon size={16} />
          <Text style={styles.bonusText}>たっせいボーナス: みんなに {challenge.bonus_amount}えん！</Text>
        </View>
        {!isComplete && isActive && (
          <Text style={styles.remainText}>
            あと {remaining}クエスト！ のこり{daysLeft}にち がんばろう！
          </Text>
        )}
        {isComplete && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={styles.completeText}>みんなで たっせいした！ おめでとう！</Text>
            <PixelConfettiIcon size={16} />
          </View>
        )}
      </View>
    </View>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    container: {
      backgroundColor: p.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: p.accent,
      shadowColor: p.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    containerComplete: {
      borderColor: p.green,
      backgroundColor: p.greenLight,
    },
    header: {
      fontSize: rf(14),
      fontWeight: "bold",
      color: p.accentDark,
      textAlign: "center",
      marginBottom: 4,
    },
    title: {
      fontSize: rf(15),
      fontWeight: "bold",
      color: p.textStrong,
      textAlign: "center",
      marginBottom: 12,
    },
    membersSection: {
      gap: 6,
      marginBottom: 12,
    },
    memberRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    memberIcon: {
      fontSize: 18,
      width: 24,
    },
    memberName: {
      fontSize: 12,
      fontWeight: "bold",
      color: p.textBase,
      width: 50,
    },
    barBg: {
      flex: 1,
      height: 10,
      backgroundColor: p.surfaceMuted,
      borderRadius: 5,
      overflow: "hidden",
    },
    barFill: {
      height: 10,
      backgroundColor: p.primary,
      borderRadius: 5,
    },
    memberCount: {
      fontSize: 12,
      fontWeight: "bold",
      color: p.textStrong,
      width: 24,
      textAlign: "right",
    },
    totalSection: {
      marginBottom: 10,
    },
    totalText: {
      fontSize: 12,
      color: p.textBase,
      marginBottom: 4,
      textAlign: "center",
    },
    totalBarBg: {
      height: 14,
      backgroundColor: p.surfaceMuted,
      borderRadius: 7,
      overflow: "hidden",
    },
    totalBarFill: {
      height: 14,
      borderRadius: 7,
    },
    percentText: {
      fontSize: 11,
      fontWeight: "bold",
      color: p.textMuted,
      textAlign: "right",
      marginTop: 2,
    },
    footer: {
      alignItems: "center",
    },
    bonusText: {
      fontSize: 13,
      fontWeight: "bold",
      color: p.accent,
    },
    remainText: {
      fontSize: 12,
      color: p.textBase,
      marginTop: 4,
    },
    completeText: {
      fontSize: 13,
      fontWeight: "bold",
      color: p.green,
      marginTop: 4,
    },
  });
}
