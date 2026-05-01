/**
 * ショップ: 称号（タイトル）購入システム
 * spending_balance で購入。装備中タイトルはキャラクター横に表示される。
 */
import { supabase } from "./supabase";

export type ShopRarity = "common" | "rare" | "epic" | "legendary";

export type ShopItem = {
  id: string;
  label: string;
  description: string;
  price: number;
  rarity: ShopRarity;
  emoji: string;
};

export const SHOP_ITEMS: ShopItem[] = [
  { id: "rookie",     label: "駆け出し冒険者", description: "初めの一歩！",         price: 50,  rarity: "common",    emoji: "🎒" },
  { id: "forest_sage", label: "森の賢者",      description: "森の知恵を授かった",   price: 100, rarity: "common",    emoji: "🌲" },
  { id: "fire_mage",  label: "炎の魔導士",    description: "めらめら 燃える！",   price: 150, rarity: "rare",      emoji: "🔥" },
  { id: "thunder",    label: "雷の戦士",      description: "ピカッ！ドカン！",     price: 150, rarity: "rare",      emoji: "⚡" },
  { id: "ice_knight", label: "氷の騎士",      description: "冷たい 眼差し",       price: 200, rarity: "rare",      emoji: "❄️" },
  { id: "dragon",     label: "竜の末裔",      description: "竜の血を引く者",       price: 300, rarity: "epic",      emoji: "🐉" },
  { id: "hero",       label: "星の勇者",      description: "世界を救う運命",       price: 400, rarity: "epic",      emoji: "⭐" },
  { id: "time",       label: "時の旅人",      description: "時間を操る",           price: 500, rarity: "legendary", emoji: "⏳" },
];

export type PurchaseRecord = {
  id: string;
  child_id: string;
  item_id: string;
  purchased_at: string;
  is_equipped: boolean;
};

export function getItem(itemId: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === itemId);
}

export const RARITY_COLORS: Record<ShopRarity, { text: string; bg: string; border: string }> = {
  common:    { text: "#a090c0", bg: "#36205d", border: "#4f2a93" },
  rare:      { text: "#5dade2", bg: "#1a2a3e", border: "#2980b9" },
  epic:      { text: "#b79bff", bg: "#3d2663", border: "#6b4cdb" },
  legendary: { text: "#ffd700", bg: "#3d2663", border: "#f9c33b" },
};

export async function getPurchases(childId: string): Promise<PurchaseRecord[]> {
  const { data } = await supabase
    .from("otetsudai_shop_purchases")
    .select("*")
    .eq("child_id", childId)
    .order("purchased_at", { ascending: false });
  return (data as PurchaseRecord[]) || [];
}

export async function getEquippedTitle(childId: string): Promise<ShopItem | null> {
  const { data } = await supabase
    .from("otetsudai_shop_purchases")
    .select("item_id")
    .eq("child_id", childId)
    .eq("is_equipped", true)
    .maybeSingle();
  if (!data) return null;
  return getItem((data as { item_id: string }).item_id) ?? null;
}

export async function purchaseItem(
  childId: string,
  walletId: string,
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  const item = getItem(itemId);
  if (!item) return { success: false, error: "アイテムが みつかりません" };

  const { data: existing } = await supabase
    .from("otetsudai_shop_purchases")
    .select("id")
    .eq("child_id", childId)
    .eq("item_id", itemId)
    .maybeSingle();
  if (existing) return { success: false, error: "もう もっているよ" };

  const { data: wallet } = await supabase
    .from("otetsudai_wallets")
    .select("spending_balance")
    .eq("id", walletId)
    .single();
  const currentSpend = (wallet as { spending_balance: number } | null)?.spending_balance ?? 0;
  if (currentSpend < item.price) {
    return { success: false, error: "お金が たりないよ" };
  }

  await supabase
    .from("otetsudai_wallets")
    .update({ spending_balance: currentSpend - item.price })
    .eq("id", walletId);

  await supabase.from("otetsudai_transactions").insert({
    wallet_id: walletId,
    type: "spend",
    amount: item.price,
    description: `🏪 ショップ購入: ${item.label}`,
  });

  await supabase.from("otetsudai_shop_purchases").insert({
    child_id: childId,
    item_id: itemId,
  });

  return { success: true };
}

export async function equipItem(childId: string, itemId: string): Promise<void> {
  await supabase
    .from("otetsudai_shop_purchases")
    .update({ is_equipped: false })
    .eq("child_id", childId);
  await supabase
    .from("otetsudai_shop_purchases")
    .update({ is_equipped: true })
    .eq("child_id", childId)
    .eq("item_id", itemId);
}

export async function unequipAll(childId: string): Promise<void> {
  await supabase
    .from("otetsudai_shop_purchases")
    .update({ is_equipped: false })
    .eq("child_id", childId);
}
