/**
 * 山田家サンプルデータのリセット
 * ログアウト時にデフォルト状態に初期化する
 */
import { supabase } from "./supabase";

const SAMPLE_FAMILY_NAME = "山田家";

export async function resetSampleFamily() {
  // 山田家を取得
  const { data: family } = await supabase
    .from("otetsudai_families")
    .select("id")
    .eq("name", SAMPLE_FAMILY_NAME)
    .maybeSingle();
  if (!family) return;

  const familyId = family.id;

  // メンバー取得
  const { data: members } = await supabase
    .from("otetsudai_users")
    .select("id")
    .eq("family_id", familyId);
  const memberIds = (members || []).map((m: { id: string }) => m.id);

  if (memberIds.length > 0) {
    // ウォレット取得
    const { data: wallets } = await supabase
      .from("otetsudai_wallets")
      .select("id")
      .in("child_id", memberIds);
    const walletIds = (wallets || []).map((w: { id: string }) => w.id);

    if (walletIds.length > 0) {
      // 取引履歴・支出リクエスト・投資注文をクリア
      await supabase.from("otetsudai_transactions").delete().in("wallet_id", walletIds);
      await supabase.from("otetsudai_spend_requests").delete().in("wallet_id", walletIds);
      await supabase.from("otetsudai_invest_orders").delete().in("wallet_id", walletIds);

      // ウォレットをデフォルト残高にリセット
      for (const wid of walletIds) {
        await supabase.from("otetsudai_wallets").update({
          spending_balance: 100,
          saving_balance: 50,
          invest_balance: 0,
          save_ratio: 30,
          invest_ratio: 0,
          split_ratio: 30,
        }).eq("id", wid);
      }
    }

    // クエストログ・バッジ・貯金目標・ショップ購入をクリア
    await supabase.from("otetsudai_task_logs").delete().in("child_id", memberIds);
    await supabase.from("otetsudai_badges").delete().in("child_id", memberIds);
    await supabase.from("otetsudai_saving_goals").delete().in("child_id", memberIds);
    await supabase.from("otetsudai_shop_purchases").delete().in("child_id", memberIds);
  }

  // メッセージ・チャレンジをクリア
  await supabase.from("otetsudai_family_messages").delete().eq("family_id", familyId);
  await supabase.from("otetsudai_family_challenges").delete().eq("family_id", familyId);
}
