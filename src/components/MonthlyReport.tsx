import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { supabase } from "../lib/supabase";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import { getCurrentLevel } from "../lib/levels";
import type { User, Wallet } from "../lib/types";

type Props = {
  child: User;
  wallet: Wallet | null;
};

type ReportData = {
  questsCompleted: number;
  totalEarned: number;
  maxStreak: number;
  levelStart: number;
  levelEnd: number;
  savingGoalsAchieved: number;
  savingGoalsTotal: number;
  topQuest: string | null;
  topQuestCount: number;
};

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end, label: `${now.getFullYear()}年 ${now.getMonth() + 1}月` };
}

function generateComment(data: ReportData): string {
  const parts: string[] = [];

  if (data.questsCompleted >= 20) {
    parts.push("たくさんクエストをがんばったね！");
  } else if (data.questsCompleted >= 10) {
    parts.push("コツコツがんばったね！");
  } else if (data.questsCompleted > 0) {
    parts.push("クエストに挑戦できたね！");
  }

  if (data.levelEnd > data.levelStart) {
    parts.push(`レベルが${data.levelEnd - data.levelStart}つ上がったよ！`);
  }

  if (data.maxStreak >= 5) {
    parts.push(`${data.maxStreak}日連続はすごい！`);
  }

  if (data.savingGoalsAchieved > 0) {
    parts.push("貯金の目標も達成したね！");
  }

  if (data.topQuest) {
    parts.push(`「${data.topQuest}」が一番たくさんクリアしたクエストだよ`);
  }

  return parts.length > 0 ? parts.join(" ") : "今月もがんばろう！";
}

export default function MonthlyReport({ child, wallet }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const { start, end, label } = useMemo(() => getMonthRange(), []);

  useEffect(() => {
    async function load() {
      // 今月の承認済みログ
      const { data: logs } = await supabase
        .from("otetsudai_task_logs")
        .select("*, task:otetsudai_tasks(title, reward_amount)")
        .eq("child_id", child.id)
        .eq("status", "approved")
        .gte("approved_at", start.toISOString())
        .lte("approved_at", end.toISOString());

      const approvedLogs = logs || [];
      const questsCompleted = approvedLogs.length;
      const totalEarned = approvedLogs.reduce(
        (sum: number, l: any) => sum + (l.task?.reward_amount || 0),
        0
      );

      // よくクリアしたクエスト
      const questCounts: Record<string, number> = {};
      approvedLogs.forEach((l: any) => {
        const title = l.task?.title || "";
        if (title) questCounts[title] = (questCounts[title] || 0) + 1;
      });
      const topEntry = Object.entries(questCounts).sort((a, b) => b[1] - a[1])[0];

      // 連続ストリーク（今月内）
      const days = new Set(
        approvedLogs
          .filter((l: any) => l.approved_at)
          .map((l: any) => new Date(l.approved_at).toDateString())
      );
      let maxStreak = 0;
      let currentStreak = 0;
      const d = new Date(start);
      while (d <= end) {
        if (days.has(d.toDateString())) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
        d.setDate(d.getDate() + 1);
      }

      // 貯金目標
      const { data: goals } = await supabase
        .from("otetsudai_saving_goals")
        .select("is_achieved")
        .eq("child_id", child.id);
      const savingGoalsTotal = goals?.length || 0;
      const savingGoalsAchieved = goals?.filter((g: any) => g.is_achieved).length || 0;

      // レベル計算
      const totalBalance = wallet
        ? wallet.spending_balance + wallet.saving_balance + wallet.invest_balance
        : 0;
      const levelEnd = getCurrentLevel(totalBalance).level;
      // 月初のレベル推定（今月稼いだ分を引く）
      const levelStart = getCurrentLevel(Math.max(0, totalBalance - totalEarned)).level;

      setData({
        questsCompleted,
        totalEarned,
        maxStreak,
        levelStart,
        levelEnd,
        savingGoalsAchieved,
        savingGoalsTotal,
        topQuest: topEntry ? topEntry[0] : null,
        topQuestCount: topEntry ? topEntry[1] : 0,
      });
      setLoading(false);
    }
    load();
  }, [child.id, wallet]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={palette.primary} />
      </View>
    );
  }

  if (!data) return null;

  const comment = generateComment(data);

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <Text style={styles.header}>
        📊 {child.name}の成長レポート
      </Text>
      <Text style={styles.monthLabel}>{label}</Text>

      {/* 統計カード */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statEmoji}>🎯</Text>
          <Text style={styles.statValue}>{data.questsCompleted}</Text>
          <Text style={styles.statLabel}>クエスト</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statEmoji}>💰</Text>
          <Text style={styles.statValue}>¥{data.totalEarned.toLocaleString()}</Text>
          <Text style={styles.statLabel}>稼いだ</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={styles.statValue}>{data.maxStreak}日</Text>
          <Text style={styles.statLabel}>最高連続</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statEmoji}>⚔️</Text>
          <Text style={styles.statValue}>
            Lv.{data.levelStart === data.levelEnd
              ? data.levelEnd
              : `${data.levelStart}→${data.levelEnd}`}
          </Text>
          <Text style={styles.statLabel}>
            {data.levelEnd > data.levelStart ? "🎉 UP!" : "レベル"}
          </Text>
        </View>
      </View>

      {/* 貯金達成 */}
      {data.savingGoalsTotal > 0 && (
        <View style={styles.goalRow}>
          <Text style={styles.goalText}>
            🐷 ちょきん目標: {data.savingGoalsAchieved}/{data.savingGoalsTotal} たっせい
          </Text>
        </View>
      )}

      {/* コメント */}
      <View style={styles.commentBox}>
        <Text style={styles.commentLabel}>💡 コメント:</Text>
        <Text style={styles.commentText}>「{comment}」</Text>
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
      borderColor: p.border,
      shadowColor: p.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    header: {
      fontSize: rf(15),
      fontWeight: "bold",
      color: p.textStrong,
      textAlign: "center",
    },
    monthLabel: {
      fontSize: 12,
      color: p.textMuted,
      textAlign: "center",
      marginBottom: 12,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 12,
    },
    statItem: {
      width: "47%",
      backgroundColor: p.primaryLight,
      borderRadius: 12,
      padding: 10,
      alignItems: "center",
    },
    statEmoji: {
      fontSize: 20,
      marginBottom: 2,
    },
    statValue: {
      fontSize: rf(16),
      fontWeight: "bold",
      color: p.textStrong,
    },
    statLabel: {
      fontSize: 11,
      color: p.textMuted,
    },
    goalRow: {
      backgroundColor: p.accentLight,
      borderRadius: 10,
      padding: 8,
      marginBottom: 8,
      alignItems: "center",
    },
    goalText: {
      fontSize: 13,
      color: p.accentDark,
      fontWeight: "bold",
    },
    commentBox: {
      backgroundColor: p.surfaceMuted,
      borderRadius: 12,
      padding: 12,
    },
    commentLabel: {
      fontSize: 12,
      fontWeight: "bold",
      color: p.textBase,
      marginBottom: 4,
    },
    commentText: {
      fontSize: 13,
      color: p.textBase,
      lineHeight: 20,
    },
  });
}
