import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect, Circle, Ellipse, Path, G, Defs, LinearGradient, RadialGradient, Stop } from "react-native-svg";
import { supabase } from "../lib/supabase";
import { useTheme, type Palette } from "../theme";
import { rf } from "../lib/responsive";
import { AutoRubyText, RubyText } from "./Ruby";
import type { FamilyChallenge, User } from "../lib/types";
import { PixelCrownIcon, PixelGiftIcon, PixelConfettiIcon } from "./PixelIcons";
import CharacterSvg from "./CharacterSvg";

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
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" }}>
        <PixelCrownIcon size={20} />
        <RubyText
          style={styles.header}
          parts={
            isComplete
              ? [["冒険団", "ぼうけんだん"], "チャレンジ ", ["達成", "たっせい"], "！"]
              : [["冒険団", "ぼうけんだん"], "チャレンジ"]
          }
          rubySize={6}
        />
      </View>

      {/* ボスモンスター */}
      <View style={{ alignItems: "center", marginVertical: 8 }}>
        <PixelBossMonster defeated={isComplete} size={64} />
        {isComplete ? (
          <RubyText
            style={{ fontSize: 10, color: "#4CAF50", fontWeight: "bold", marginTop: 2 }}
            parts={[["倒", "たお"], "した！"]}
            rubySize={5}
          />
        ) : (
          <Text style={{ fontSize: 10, color: "#C0392B", fontWeight: "bold", marginTop: 2 }}>
            HP: {remaining}/{challenge.target_quests}
          </Text>
        )}
      </View>

      <View style={styles.titleWrap}>
        <AutoRubyText
          text={`「${challenge.title}」`}
          style={styles.title}
          rubySize={6}
          noWrap
        />
      </View>

      {/* メンバー進捗 */}
      <View style={styles.membersSection}>
        {progress.map((p) => {
          const ratio = challenge.target_quests > 0
            ? Math.min(1, p.count / Math.ceil(challenge.target_quests / kids.length))
            : 0;
          return (
            <View key={p.childId} style={styles.memberRow}>
              <View style={styles.memberIcon}>
                <CharacterSvg level={1} mood="normal" size={20} />
              </View>
              <Text
                style={styles.memberName}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
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
        <RubyText
          style={styles.totalText}
          parts={[
            ["冒険団", "ぼうけんだん"],
            ["合計", "ごうけい"],
            `: ${totalCount}/${challenge.target_quests} クエスト`,
          ]}
          rubySize={5}
        />
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
          <RubyText
            style={styles.bonusText}
            parts={[["達成", "たっせい"], `ボーナス: みんなに ${challenge.bonus_amount}`, "コロ", "！"]}
            rubySize={5}
            noWrap
          />
        </View>
        {!isComplete && isActive && (
          <RubyText
            style={styles.remainText}
            parts={[
              `あと ${remaining}クエスト！ `,
              ["残", "のこ"],
              `り${daysLeft}`,
              ["日", "にち"],
              " ",
              ["頑張", "がんば"],
              "ろう！",
            ]}
            rubySize={5}
            noWrap
          />
        )}
        {isComplete && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <RubyText
              style={styles.completeText}
              parts={["みんなで ", ["達成", "たっせい"], "した！ おめでとう！"]}
              rubySize={5}
            />
            <PixelConfettiIcon size={16} />
          </View>
        )}
      </View>
    </View>
  );
}

/** ピクセルアートのボスモンスター（スライム風） */
function PixelBossMonster({ defeated = false, size = 64 }: { defeated?: boolean; size?: number }) {
  const opacity = defeated ? 0.4 : 1;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" opacity={opacity}>
      <Defs>
        <RadialGradient id="bossBody" cx="50%" cy="40%" r="50%">
          <Stop offset="0%" stopColor={defeated ? "#888" : "#7B4CDB"} />
          <Stop offset="100%" stopColor={defeated ? "#666" : "#5A2DAA"} />
        </RadialGradient>
        <RadialGradient id="bossGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={defeated ? "#666" : "#9B59B6"} stopOpacity={0.3} />
          <Stop offset="100%" stopColor={defeated ? "#444" : "#6C3483"} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {/* シャドウ */}
      <Ellipse cx={32} cy={58} rx={22} ry={5} fill="#000" opacity={0.15} />
      {/* オーラ */}
      {!defeated && <Circle cx={32} cy={36} r={30} fill="url(#bossGlow)" />}
      {/* ボディ（スライム形状） */}
      <Path
        d="M12,46 Q12,20 32,14 Q52,20 52,46 Q52,54 32,54 Q12,54 12,46 Z"
        fill="url(#bossBody)"
      />
      {/* ハイライト */}
      <Ellipse cx={24} cy={28} rx={6} ry={4} fill="#FFFFFF" opacity={0.2} />
      {/* ツノ（左） */}
      <Path d="M20,20 L16,8 L24,16 Z" fill={defeated ? "#888" : "#8E44AD"} />
      <Circle cx={16} cy={8} r={2} fill={defeated ? "#AAA" : "#E74C3C"} />
      {/* ツノ（右） */}
      <Path d="M44,20 L48,8 L40,16 Z" fill={defeated ? "#888" : "#8E44AD"} />
      <Circle cx={48} cy={8} r={2} fill={defeated ? "#AAA" : "#E74C3C"} />
      {/* 目 */}
      {defeated ? (
        <>
          <Path d="M22,32 L28,38" stroke="#333" strokeWidth={2.5} />
          <Path d="M28,32 L22,38" stroke="#333" strokeWidth={2.5} />
          <Path d="M36,32 L42,38" stroke="#333" strokeWidth={2.5} />
          <Path d="M42,32 L36,38" stroke="#333" strokeWidth={2.5} />
        </>
      ) : (
        <>
          <Ellipse cx={25} cy={34} rx={5} ry={6} fill="#FFFFFF" />
          <Circle cx={26} cy={35} r={3} fill="#333" />
          <Circle cx={27} cy={34} r={1} fill="#FFF" />
          <Ellipse cx={39} cy={34} rx={5} ry={6} fill="#FFFFFF" />
          <Circle cx={40} cy={35} r={3} fill="#333" />
          <Circle cx={41} cy={34} r={1} fill="#FFF" />
        </>
      )}
      {/* 口 */}
      {defeated ? (
        <Path d="M26,44 Q32,41 38,44" stroke="#333" strokeWidth={1.5} fill="none" />
      ) : (
        <Path d="M26,43 Q32,48 38,43" stroke="#333" strokeWidth={1.5} fill="none" />
      )}
    </Svg>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    container: {
      borderRadius: 16,
      padding: 14,
      marginHorizontal: 12,
      marginBottom: 12,
      borderWidth: 1.5,
      borderColor: p.accent,
    },
    containerComplete: {
      borderColor: p.green,
    },
    header: {
      fontSize: rf(14),
      fontWeight: "bold",
      color: p.accentDark,
      textAlign: "center",
      marginBottom: 4,
    },
    titleWrap: {
      alignItems: "center",
      marginTop: 4,
      marginBottom: 12,
      paddingHorizontal: 8,
    },
    title: {
      fontSize: rf(16),
      fontWeight: "bold",
      color: p.textStrong,
      textAlign: "center",
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
      width: 24,
      height: 24,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    memberName: {
      fontSize: 12,
      fontWeight: "bold",
      color: p.textBase,
      minWidth: 50,
      maxWidth: 96,
      flexShrink: 0,
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
