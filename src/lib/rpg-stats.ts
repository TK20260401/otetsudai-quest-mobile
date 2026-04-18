/**
 * RPGステータス算出ロジック
 * 既存データから派生。新規DBフィールド不要。
 */

export type RpgStats = {
  atk: number;
  def: number;
  lck: number;
  hp: number;   // 0-100 (%)
  mp: number;   // 連続貯金週数
  exp: number;  // 0-100 (%)
};

export type DungeonFloor = {
  floor: number;
  type: "normal" | "boss" | "treasure";
  progress: number; // 0-9 (current floor progress)
};

export function calculateRpgStats(params: {
  level: number;
  totalQuests: number;
  badgeCount: number;
  streakDays: number;
  daysActiveInLast7: number;
  savingStreakWeeks: number;
  expProgress: number;
}): RpgStats {
  return {
    atk: params.level * 10 + Math.min(params.totalQuests, 100),
    def: params.level * 8 + params.badgeCount * 5,
    lck: params.streakDays * 3,
    hp: Math.round((params.daysActiveInLast7 / 7) * 100),
    mp: params.savingStreakWeeks,
    exp: params.expProgress,
  };
}

export function getDungeonFloor(totalFamilyQuests: number): DungeonFloor {
  const floor = Math.floor(totalFamilyQuests / 10) + 1;
  const progress = totalFamilyQuests % 10;
  let type: DungeonFloor["type"] = "normal";
  if (floor % 5 === 0) type = "boss";
  else if (floor % 3 === 0) type = "treasure";
  return { floor, type, progress };
}

export function getQuestCardTier(task: { recurrence: string; is_special?: boolean }): "bronze" | "silver" | "gold" {
  if (task.is_special) return "gold";
  if (task.recurrence === "weekly") return "silver";
  return "bronze";
}
