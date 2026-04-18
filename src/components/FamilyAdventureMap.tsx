import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect, Circle, Ellipse, Path, G, Defs, LinearGradient, Stop } from "react-native-svg";
import { supabase } from "../lib/supabase";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import { getCurrentLevel } from "../lib/levels";
import CharacterSvg from "./CharacterSvg";
import type { User, Wallet } from "../lib/types";
import { PixelMapIcon, PixelFlameIcon, PixelCoinIcon } from "./PixelIcons";
import DungeonMap from "./DungeonMap";

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
  const [totalFamilyQuests, setTotalFamilyQuests] = useState(0);

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

      const { count: totalQ } = await supabase
        .from("otetsudai_task_logs")
        .select("id", { count: "exact", head: true })
        .in("child_id", childIds)
        .eq("status", "approved");
      setTotalFamilyQuests(totalQ || 0);
    }
    load();
  }, [kids]);

  const familyTotal = kids.reduce((sum, k) => {
    const w = wallets[k.id];
    return sum + (w ? w.spending_balance + w.saving_balance + w.invest_balance : 0);
  }, 0);

  return (
    <View style={styles.container}>
      {/* ワールドマップ背景 */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, opacity: 0.12 }}>
        <PixelWorldMapBg width={340} />
      </View>

      {/* ヘッダー */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, zIndex: 1 }}>
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
          {stats.familyStreak > 0 ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
              <PixelFlameIcon size={16} />
              <Text style={styles.statValue}>{stats.familyStreak}</Text>
            </View>
          ) : (
            <Text style={styles.statValue}>—</Text>
          )}
          <Text style={styles.statLabel}>連続日</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>¥{familyTotal.toLocaleString()}</Text>
          <Text style={styles.statLabel}>合計</Text>
        </View>
      </View>

      {/* ダンジョンフロア進行マップ */}
      <DungeonMap totalQuests={totalFamilyQuests} />
    </View>
  );
}

/** ピクセルアートのワールドマップ背景 */
function PixelWorldMapBg({ width = 340 }: { width?: number }) {
  const h = Math.round(width * 0.5);
  return (
    <Svg width={width} height={h} viewBox="0 0 340 170">
      <Defs>
        <LinearGradient id="mapSky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#87CEEB" />
          <Stop offset="100%" stopColor="#E0F0FF" />
        </LinearGradient>
        <LinearGradient id="mapGrass" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#4CAF50" />
          <Stop offset="100%" stopColor="#388E3C" />
        </LinearGradient>
      </Defs>
      {/* 空 */}
      <Rect x={0} y={0} width={340} height={170} fill="url(#mapSky)" />
      {/* 山（遠景） */}
      <Path d="M0,120 L40,60 L80,110 L120,50 L160,100 L200,40 L240,90 L280,55 L320,95 L340,70 L340,170 L0,170 Z" fill="#6B8E4E" opacity={0.3} />
      {/* 丘（中景） */}
      <Path d="M0,140 L60,100 L120,130 L180,95 L240,120 L300,100 L340,130 L340,170 L0,170 Z" fill="url(#mapGrass)" opacity={0.5} />
      {/* 道 */}
      <Path d="M30,160 Q80,140 130,150 Q180,160 220,140 Q260,120 310,145" fill="none" stroke="#D4A030" strokeWidth={4} strokeLinecap="round" strokeDasharray="8,4" />
      {/* 城（右奥） */}
      <Rect x={275} y={80} width={20} height={30} fill="#A0A0B0" />
      <Rect x={270} y={75} width={30} height={8} fill="#B0B0C0" />
      <Path d="M270,75 L275,65 L280,75" fill="#C0392B" />
      <Path d="M290,75 L295,65 L300,75" fill="#C0392B" />
      {/* 木（点在） */}
      <Circle cx={50} cy={128} r={8} fill="#2E7D32" />
      <Rect x={48} y={134} width={4} height={8} fill="#5D4037" />
      <Circle cx={160} cy={118} r={6} fill="#388E3C" />
      <Rect x={158} y={123} width={4} height={6} fill="#5D4037" />
      <Circle cx={100} cy={138} r={7} fill="#43A047" />
      <Rect x={98} y={143} width={4} height={7} fill="#5D4037" />
      {/* 旗マーカー */}
      <Rect x={218} y={130} width={2} height={14} fill="#5D4037" />
      <Path d="M220,130 L230,133 L220,136" fill="#E74C3C" />
    </Svg>
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
