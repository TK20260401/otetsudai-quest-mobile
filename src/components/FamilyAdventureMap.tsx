import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import { getCurrentLevel } from "../lib/levels";
import CharacterSvg from "./CharacterSvg";
import type { User, Wallet } from "../lib/types";
import { PixelMapIcon } from "./PixelIcons";

type Props = {
  familyName: string;
  children: User[];
  wallets: Record<string, Wallet>;
};

type FamilyStats = {
  weeklyQuests: number;
  weeklyEarned: number;
  familyStreak: number;
};

export default function FamilyAdventureMap({
  familyName,
  children: kids,
  wallets,
}: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [stats, setStats] = useState<FamilyStats>({
    weeklyQuests: 0,
    weeklyEarned: 0,
    familyStreak: 0,
  });

  useEffect(() => {
    async function load() {
      if (kids.length === 0) return;
      const childIds = kids.map((k) => k.id);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const { data: logs } = await supabase
        .from("otetsudai_task_logs")
        .select("*, task:otetsudai_tasks(reward_amount)")
        .in("child_id", childIds)
        .eq("status", "approved")
        .gte("approved_at", weekStart.toISOString());

      const weeklyQuests = logs?.length || 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const weeklyEarned = (logs || []).reduce(
        (sum: number, l: any) => sum + (l.task?.reward_amount || 0),
        0
      );

      // 家族ストリーク: 家族の誰かがクエストをクリアした連続日数
      const { data: streakLogs } = await supabase
        .from("otetsudai_task_logs")
        .select("approved_at")
        .in("child_id", childIds)
        .eq("status", "approved")
        .not("approved_at", "is", null)
        .order("approved_at", { ascending: false })
        .limit(90);

      let familyStreak = 0;
      if (streakLogs && streakLogs.length > 0) {
        const days = new Set(
          streakLogs.map((l: { approved_at: string }) =>
            new Date(l.approved_at).toDateString()
          )
        );
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const check = new Date(today);
        if (!days.has(check.toDateString())) {
          check.setDate(check.getDate() - 1);
        }
        while (days.has(check.toDateString())) {
          familyStreak++;
          check.setDate(check.getDate() - 1);
        }
      }

      setStats({ weeklyQuests, weeklyEarned, familyStreak });
    }
    load();
  }, [kids]);

  const familyTotal = kids.reduce((sum, k) => {
    const w = wallets[k.id];
    return sum + (w ? w.spending_balance + w.saving_balance + w.invest_balance : 0);
  }, 0);

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <PixelMapIcon size={22} />
        <Text style={styles.header}>{familyName}の ぼうけんちず</Text>
      </View>

      {/* メンバーカード横並び */}
      <View style={styles.membersRow}>
        {kids.map((kid) => {
          const w = wallets[kid.id];
          const total = w
            ? w.spending_balance + w.saving_balance + w.invest_balance
            : 0;
          const level = getCurrentLevel(total);
          return (
            <View key={kid.id} style={styles.memberCard}>
              <CharacterSvg level={level.level} mood="normal" size={48} />
              <Text style={styles.memberLevel}>Lv.{level.level}</Text>
              <Text style={styles.memberName} numberOfLines={1}>
                {kid.name}
              </Text>
              <Text style={styles.memberBalance}>
                {total.toLocaleString()}円
              </Text>
            </View>
          );
        })}
      </View>

      {/* 家族統計 */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.weeklyQuests}</Text>
          <Text style={styles.statLabel}>今週クエスト</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>¥{stats.weeklyEarned.toLocaleString()}</Text>
          <Text style={styles.statLabel}>稼いだ</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats.familyStreak > 0 ? `🔥${stats.familyStreak}` : "—"}
          </Text>
          <Text style={styles.statLabel}>連続日</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>¥{familyTotal.toLocaleString()}</Text>
          <Text style={styles.statLabel}>合計</Text>
        </View>
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
      borderWidth: 1,
      borderColor: p.accent,
      shadowColor: p.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    header: {
      fontSize: rf(16),
      fontWeight: "bold",
      color: p.textStrong,
      textAlign: "center",
      marginBottom: 12,
    },
    membersRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 12,
      marginBottom: 14,
    },
    memberCard: {
      alignItems: "center",
      backgroundColor: p.primaryLight,
      borderRadius: 14,
      padding: 10,
      minWidth: 80,
      borderWidth: 1,
      borderColor: p.border,
    },
    memberLevel: {
      fontSize: 11,
      fontWeight: "bold",
      color: p.primary,
      marginTop: 2,
    },
    memberName: {
      fontSize: 12,
      fontWeight: "bold",
      color: p.textStrong,
      marginTop: 2,
    },
    memberBalance: {
      fontSize: 11,
      color: p.textMuted,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      backgroundColor: p.accentLight,
      borderRadius: 12,
      padding: 10,
    },
    statItem: {
      alignItems: "center",
    },
    statValue: {
      fontSize: rf(14),
      fontWeight: "bold",
      color: p.textStrong,
    },
    statLabel: {
      fontSize: 10,
      color: p.textMuted,
    },
  });
}
