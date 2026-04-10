import { supabase } from "./supabase";

export const BADGE_DEFINITIONS: Record<
  string,
  { emoji: string; label: string; description: string }
> = {
  first_task: {
    emoji: "⚔️",
    label: "はじめてのクエスト",
    description: "はじめてクエストをクリアしたよ！",
  },
  streak_3: {
    emoji: "🔥",
    label: "3にちれんぞく",
    description: "3日つづけてクエストクリア！",
  },
  earned_1000: {
    emoji: "💰",
    label: "1000えんたっせい",
    description: "あわせて1000えんかせいだよ！",
  },
  saving_master: {
    emoji: "🐷",
    label: "ちょきんマスター",
    description: "ちょきんもくひょうたっせい！",
  },
  quest_master: {
    emoji: "🏆",
    label: "クエストマスター",
    description: "50かいクエストをクリア！すごい！",
  },
};

export async function checkAndAwardBadges(
  childId: string
): Promise<string[]> {
  const newBadges: string[] = [];

  const { data: existing } = await supabase
    .from("otetsudai_badges")
    .select("badge_type")
    .eq("child_id", childId);
  const earned = new Set(
    (existing || []).map((b: { badge_type: string }) => b.badge_type)
  );

  const { data: logs } = await supabase
    .from("otetsudai_task_logs")
    .select("*, task:otetsudai_tasks(reward_amount)")
    .eq("child_id", childId)
    .eq("status", "approved")
    .order("approved_at", { ascending: true });
  const approvedLogs = logs || [];

  if (!earned.has("first_task") && approvedLogs.length >= 1) {
    newBadges.push("first_task");
  }

  if (!earned.has("earned_1000")) {
    const totalEarned = approvedLogs.reduce(
      (sum: number, l: { task?: { reward_amount: number } }) =>
        sum + (l.task?.reward_amount || 0),
      0
    );
    if (totalEarned >= 1000) newBadges.push("earned_1000");
  }

  if (!earned.has("streak_3") && approvedLogs.length >= 3) {
    const dates = [
      ...new Set(
        approvedLogs.map((l: { approved_at: string }) =>
          new Date(l.approved_at).toISOString().slice(0, 10)
        )
      ),
    ].sort();
    for (let i = 0; i <= dates.length - 3; i++) {
      const d1 = new Date(dates[i] as string);
      const d2 = new Date(dates[i + 1] as string);
      const d3 = new Date(dates[i + 2] as string);
      if (
        d2.getTime() - d1.getTime() === 86400000 &&
        d3.getTime() - d2.getTime() === 86400000
      ) {
        newBadges.push("streak_3");
        break;
      }
    }
  }

  if (!earned.has("saving_master")) {
    const { data: goals } = await supabase
      .from("otetsudai_saving_goals")
      .select("is_achieved")
      .eq("child_id", childId)
      .eq("is_achieved", true);
    if (goals && goals.length > 0) newBadges.push("saving_master");
  }

  if (!earned.has("quest_master") && approvedLogs.length >= 50) {
    newBadges.push("quest_master");
  }

  for (const badge of newBadges) {
    await supabase
      .from("otetsudai_badges")
      .insert({ child_id: childId, badge_type: badge })
      .select();
  }

  return newBadges;
}
