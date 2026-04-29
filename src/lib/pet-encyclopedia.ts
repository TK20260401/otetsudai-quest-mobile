/**
 * ペット図鑑ロジック
 * 既存の otetsudai_pets テーブルから、各ペット種について
 * 「どこまで育てた／見たことがあるか」を導出する。新DB不要。
 */
import { supabase } from "./supabase";
import { PET_TYPES, type PetType, type GrowthStage } from "./pets";

export type EncyclopediaEntry = {
  petType: PetType;
  highestStage: GrowthStage | null; // null = 未発見
  totalCount: number; // この種類のペットを何匹見たか（重複含む）
  firstSeenAt: string | null; // 初回発見日時（ISO）
};

const STAGE_RANK: Record<GrowthStage, number> = {
  egg: 1,
  baby: 2,
  child: 3,
  adult: 4,
};

// 図鑑では「孵化（赤ちゃん）以降」のみを発見扱いにする
// 卵のままのペットは姿が見えていないので未発見と同じ扱い
const VISIBLE_STAGES: GrowthStage[] = ["baby", "child", "adult"];

export async function getEncyclopedia(childId: string): Promise<EncyclopediaEntry[]> {
  const { data, error } = await supabase
    .from("otetsudai_pets")
    .select("pet_type, growth_stage, created_at")
    .eq("child_id", childId)
    .order("created_at", { ascending: true });

  if (error || !data) {
    return PET_TYPES.map((petType) => ({
      petType,
      highestStage: null,
      totalCount: 0,
      firstSeenAt: null,
    }));
  }

  return PET_TYPES.map((petType) => {
    const matched = data.filter(
      (row: any) =>
        row.pet_type === petType &&
        VISIBLE_STAGES.includes(row.growth_stage as GrowthStage)
    );
    if (matched.length === 0) {
      return { petType, highestStage: null, totalCount: 0, firstSeenAt: null };
    }
    const highest = matched.reduce<GrowthStage>((acc: GrowthStage, row: any) => {
      const stage = row.growth_stage as GrowthStage;
      return STAGE_RANK[stage] > STAGE_RANK[acc] ? stage : acc;
    }, "baby");
    return {
      petType,
      highestStage: highest,
      totalCount: matched.length,
      firstSeenAt: matched[0].created_at,
    };
  });
}

/** 図鑑コンプリート率（adult 到達種数 / 全種数） */
export function calcCompletionRate(entries: EncyclopediaEntry[]): number {
  const completed = entries.filter((e) => e.highestStage === "adult").length;
  return Math.round((completed / entries.length) * 100);
}

/** 図鑑バッジ判定: 何種類見たか */
export function getDiscoveryBadge(entries: EncyclopediaEntry[]): {
  seen: number;
  total: number;
  fullyGrown: number;
} {
  const seen = entries.filter((e) => e.highestStage !== null).length;
  const fullyGrown = entries.filter((e) => e.highestStage === "adult").length;
  return { seen, total: entries.length, fullyGrown };
}
