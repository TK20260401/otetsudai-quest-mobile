/**
 * ペットシステム: Habitica風ペット育成ロジック
 */
import { supabase } from "./supabase";
import type { Pet } from "./types";

export const PET_TYPES = ["dragon", "phoenix", "unicorn", "cat", "dog", "rabbit"] as const;
export type PetType = (typeof PET_TYPES)[number];
export type GrowthStage = "egg" | "baby" | "child" | "adult";

export const PET_TYPE_INFO: Record<PetType, { nameJa: string; emoji: string }> = {
  dragon:  { nameJa: "竜", emoji: "🐉" },
  phoenix: { nameJa: "鳳凰", emoji: "🔥" },
  unicorn: { nameJa: "ユニコーン", emoji: "🦄" },
  cat:     { nameJa: "猫", emoji: "🐱" },
  dog:     { nameJa: "犬", emoji: "🐶" },
  rabbit:  { nameJa: "うさぎ", emoji: "🐰" },
};

export const GROWTH_THRESHOLDS = { egg: 0, baby: 3, child: 10, adult: 25 };
export const EGG_DROP_CHANCE = 0.2;
export const HATCH_QUESTS_REQUIRED = 3;
export const HAPPINESS_DECAY_DAYS = 3;
export const HAPPINESS_DECAY_AMOUNT = 10;

export type PetQuestResult = {
  eggDropped: PetType | null;
  hatchReady: boolean;
  petGrew: boolean;
  newStage: GrowthStage | null;
};

/** 20%の確率でランダムな卵タイプを返す */
export function rollForEggDrop(): PetType | null {
  if (Math.random() >= EGG_DROP_CHANCE) return null;
  return PET_TYPES[Math.floor(Math.random() * PET_TYPES.length)];
}

/** 卵を取得 */
export async function acquireEgg(childId: string, familyId: string, petType: PetType): Promise<void> {
  const { data: existing } = await supabase
    .from("otetsudai_pets")
    .select("id")
    .eq("child_id", childId)
    .eq("is_active", true)
    .limit(1);

  const isFirst = !existing || existing.length === 0;

  await supabase.from("otetsudai_pets").insert({
    child_id: childId,
    family_id: familyId,
    pet_type: petType,
    growth_stage: "egg",
    is_active: isFirst,
    happiness: 100,
  });
}

/** 孵化可能か判定 */
export function checkHatchReady(pet: Pet): boolean {
  return pet.growth_stage === "egg" && pet.quests_since_acquired >= HATCH_QUESTS_REQUIRED;
}

/** 卵を孵化 */
export async function hatchEgg(petId: string): Promise<void> {
  await supabase.from("otetsudai_pets").update({
    growth_stage: "baby",
    hatched_at: new Date().toISOString(),
    fed_count: 0,
    last_fed_at: new Date().toISOString(),
  }).eq("id", petId);
}

/** fed_countからgrowth_stageを算出 */
export function getGrowthStage(fedCount: number): GrowthStage {
  if (fedCount >= GROWTH_THRESHOLDS.adult) return "adult";
  if (fedCount >= GROWTH_THRESHOLDS.child) return "child";
  if (fedCount >= GROWTH_THRESHOLDS.baby) return "baby";
  return "egg";
}

/** ペットに餌やり */
export async function feedPet(petId: string, currentFedCount: number): Promise<GrowthStage> {
  const newFedCount = currentFedCount + 1;
  const newStage = getGrowthStage(newFedCount);

  await supabase.from("otetsudai_pets").update({
    fed_count: newFedCount,
    growth_stage: newStage,
    happiness: 100,
    last_fed_at: new Date().toISOString(),
  }).eq("id", petId);

  return newStage;
}

/** 幸福度を計算（遅延評価） */
export function calculateHappiness(pet: Pet): number {
  if (!pet.last_fed_at || pet.growth_stage === "egg") return pet.happiness;
  const daysSinceFed = Math.floor((Date.now() - new Date(pet.last_fed_at).getTime()) / 86400000);
  if (daysSinceFed <= HAPPINESS_DECAY_DAYS) return Math.min(pet.happiness, 100);
  const decay = (daysSinceFed - HAPPINESS_DECAY_DAYS) * HAPPINESS_DECAY_AMOUNT;
  return Math.max(0, 100 - decay);
}

/** アクティブペットを取得 */
export async function getActivePet(childId: string): Promise<Pet | null> {
  const { data } = await supabase
    .from("otetsudai_pets")
    .select("*")
    .eq("child_id", childId)
    .eq("is_active", true)
    .limit(1);
  return data?.[0] || null;
}

/** 全ペットを取得 */
export async function getAllPets(childId: string): Promise<Pet[]> {
  const { data } = await supabase
    .from("otetsudai_pets")
    .select("*")
    .eq("child_id", childId)
    .order("created_at", { ascending: false });
  return data || [];
}

/** ペットの名前を変更 */
export async function namePet(petId: string, name: string): Promise<void> {
  await supabase.from("otetsudai_pets").update({ name }).eq("id", petId);
}

/** アクティブペットを切替 */
export async function setActivePet(childId: string, petId: string): Promise<void> {
  await supabase.from("otetsudai_pets").update({ is_active: false }).eq("child_id", childId);
  await supabase.from("otetsudai_pets").update({ is_active: true }).eq("id", petId);
}

/** クエスト完了時のペット処理（メイン統合ポイント） */
export async function processQuestCompletionForPets(
  childId: string,
  familyId: string
): Promise<PetQuestResult> {
  const result: PetQuestResult = { eggDropped: null, hatchReady: false, petGrew: false, newStage: null };

  // 卵ペットのincubation進行
  const { data: eggs } = await supabase
    .from("otetsudai_pets")
    .select("*")
    .eq("child_id", childId)
    .eq("growth_stage", "egg");

  if (eggs && eggs.length > 0) {
    for (const egg of eggs) {
      await supabase.from("otetsudai_pets").update({
        quests_since_acquired: egg.quests_since_acquired + 1,
      }).eq("id", egg.id);
    }
    // 孵化チェック（アクティブな卵のみ）
    const activeEgg = eggs.find((e: Pet) => e.is_active);
    if (activeEgg && activeEgg.quests_since_acquired + 1 >= HATCH_QUESTS_REQUIRED) {
      result.hatchReady = true;
    }
  }

  // アクティブペットに餌やり（孵化済みのみ）
  const activePet = await getActivePet(childId);
  if (activePet && activePet.growth_stage !== "egg") {
    const oldStage = activePet.growth_stage;
    const newStage = await feedPet(activePet.id, activePet.fed_count);
    if (newStage !== oldStage) {
      result.petGrew = true;
      result.newStage = newStage;
    }
  }

  // 卵ドロップ判定
  const dropped = rollForEggDrop();
  if (dropped) {
    await acquireEgg(childId, familyId, dropped);
    result.eggDropped = dropped;
  }

  return result;
}
