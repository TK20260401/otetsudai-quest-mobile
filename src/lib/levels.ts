export type Level = {
  level: number;
  title: string;
  icon: string;
  minAmount: number;
};

export const LEVELS: Level[] = [
  { level: 1, title: "ぼうけんしゃ", icon: "🗡️", minAmount: 0 },
  { level: 2, title: "みならいきし", icon: "🛡️", minAmount: 1000 },
  { level: 3, title: "クエストナイト", icon: "⚔️", minAmount: 3000 },
  { level: 4, title: "シルバーマスター", icon: "🥈", minAmount: 5000 },
  { level: 5, title: "ゴールドマスター", icon: "🥇", minAmount: 10000 },
  { level: 6, title: "プラチナヒーロー", icon: "💎", minAmount: 30000 },
  { level: 7, title: "でんせつのゆうしゃ", icon: "👑", minAmount: 50000 },
];

export function getCurrentLevel(totalEarned: number): Level {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (totalEarned >= level.minAmount) {
      current = level;
    } else {
      break;
    }
  }
  return current;
}

export function getLevelProgress(totalEarned: number) {
  const current = getCurrentLevel(totalEarned);
  const currentIndex = LEVELS.indexOf(current);
  const next =
    currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : null;

  if (!next) {
    return { current, next: null, progress: 100, remaining: 0 };
  }

  const range = next.minAmount - current.minAmount;
  const earned = totalEarned - current.minAmount;
  const progress = Math.min(Math.round((earned / range) * 100), 100);
  const remaining = next.minAmount - totalEarned;

  return { current, next, progress, remaining };
}
