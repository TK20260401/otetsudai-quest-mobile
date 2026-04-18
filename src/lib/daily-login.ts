/**
 * デイリーログインボーナス: 毎日初回起動で少額報酬、連続でボーナスアップ
 * 7日サイクル。Day1: 5円, Day2: 10円, Day3: 15円, Day4: 20円, Day5: 25円, Day6: 30円, Day7: 50円 → 翌週Day1リセット
 */
import { supabase } from "./supabase";

export type DailyLoginRecord = {
  id: string;
  child_id: string;
  last_login_date: string;
  current_streak: number;
  longest_streak: number;
  total_bonus_earned: number;
};

export type DailyBonusResult = {
  awarded: boolean;
  amount: number;
  streak: number;
  dayInCycle: number;
  alreadyClaimedToday: boolean;
};

export const BONUS_SCHEDULE = [5, 10, 15, 20, 25, 30, 50] as const;

export function getBonusAmountForDay(dayInCycle: number): number {
  const idx = Math.max(0, Math.min(6, dayInCycle - 1));
  return BONUS_SCHEDULE[idx];
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const d1 = new Date(a + "T00:00:00Z").getTime();
  const d2 = new Date(b + "T00:00:00Z").getTime();
  return Math.round((d2 - d1) / 86400000);
}

export async function getDailyLoginStatus(childId: string): Promise<{
  record: DailyLoginRecord | null;
  canClaimToday: boolean;
  nextDayInCycle: number;
  nextAmount: number;
}> {
  const today = isoDate(new Date());
  const { data } = await supabase
    .from("otetsudai_daily_logins")
    .select("*")
    .eq("child_id", childId)
    .maybeSingle();

  const record = (data as DailyLoginRecord | null) ?? null;

  if (!record) {
    return { record: null, canClaimToday: true, nextDayInCycle: 1, nextAmount: BONUS_SCHEDULE[0] };
  }

  const canClaim = record.last_login_date !== today;
  const diff = canClaim ? daysBetween(record.last_login_date, today) : 0;
  const nextStreak = canClaim
    ? diff === 1
      ? record.current_streak + 1
      : 1
    : record.current_streak;
  const nextDayInCycle = ((nextStreak - 1) % 7) + 1;
  return {
    record,
    canClaimToday: canClaim,
    nextDayInCycle,
    nextAmount: getBonusAmountForDay(nextDayInCycle),
  };
}

export async function claimDailyBonus(
  childId: string,
  walletId: string
): Promise<DailyBonusResult> {
  const today = isoDate(new Date());

  const { data: existing } = await supabase
    .from("otetsudai_daily_logins")
    .select("*")
    .eq("child_id", childId)
    .maybeSingle();
  const record = (existing as DailyLoginRecord | null) ?? null;

  if (record && record.last_login_date === today) {
    const dayInCycle = ((record.current_streak - 1) % 7) + 1;
    return {
      awarded: false,
      amount: 0,
      streak: record.current_streak,
      dayInCycle,
      alreadyClaimedToday: true,
    };
  }

  let nextStreak: number;
  if (!record) {
    nextStreak = 1;
  } else {
    const diff = daysBetween(record.last_login_date, today);
    nextStreak = diff === 1 ? record.current_streak + 1 : 1;
  }

  const dayInCycle = ((nextStreak - 1) % 7) + 1;
  const amount = getBonusAmountForDay(dayInCycle);

  const { data: wallet } = await supabase
    .from("otetsudai_wallets")
    .select("spending_balance")
    .eq("id", walletId)
    .single();
  const currentSpend = (wallet as { spending_balance: number } | null)?.spending_balance ?? 0;

  await supabase
    .from("otetsudai_wallets")
    .update({ spending_balance: currentSpend + amount })
    .eq("id", walletId);

  await supabase.from("otetsudai_transactions").insert({
    wallet_id: walletId,
    type: "earn",
    amount,
    description: `🎁 ログインボーナス Day${dayInCycle}（${nextStreak}日連続）`,
  });

  const longest = Math.max(record?.longest_streak ?? 0, nextStreak);
  const totalBonusEarned = (record?.total_bonus_earned ?? 0) + amount;

  if (record) {
    await supabase
      .from("otetsudai_daily_logins")
      .update({
        last_login_date: today,
        current_streak: nextStreak,
        longest_streak: longest,
        total_bonus_earned: totalBonusEarned,
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id);
  } else {
    await supabase.from("otetsudai_daily_logins").insert({
      child_id: childId,
      last_login_date: today,
      current_streak: nextStreak,
      longest_streak: longest,
      total_bonus_earned: totalBonusEarned,
    });
  }

  return {
    awarded: true,
    amount,
    streak: nextStreak,
    dayInCycle,
    alreadyClaimedToday: false,
  };
}
