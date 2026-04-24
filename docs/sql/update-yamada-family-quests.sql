-- 山田家（サンプル冒険団）のクエスト名をカイロソフト風に一括更新
--
-- 目的:
--   山田家の `otetsudai_tasks` レコードで、旧来の日常語クエスト名
--   （例: 「お風呂掃除」）を、カイロソフト風メインタイトル + 直接表現の
--   description（サブラベル）に置き換える。
--
-- 方針:
--   プランC（メインタイトル + サブラベル併記）に準拠。
--     title       = ゲーム風メインタイトル（例: 泡モンスター 討伐作戦）
--     description = 平易なサブラベル（例: おふろ そうじ）
--
-- 参照:
--   docs/kairosoft-quest-naming.md §採用決定版
--   src/data/presetQuests.ts
--
-- 実行方法:
--   Supabase Studio の SQL エディタで本ファイル全体をペースト→実行。
--   失敗しても rollback されるよう BEGIN ～ COMMIT で包む。
--
-- 注意:
--   旧題名は推定の別表記を含めて AND title IN (...) で照合する。
--   想定外の旧題名が残っていたら末尾の SELECT で未更新行を確認できる。

BEGIN;

-- ============================================================
-- 山田家の family_id を固定する
-- ============================================================
DO $$
DECLARE
  yamada_id UUID;
BEGIN
  SELECT id INTO yamada_id FROM otetsudai_families WHERE name = '山田家' LIMIT 1;
  IF yamada_id IS NULL THEN
    RAISE EXCEPTION '山田家が見つかりません。family_name を確認してください。';
  END IF;
  -- 一時テーブルに保持（以降の UPDATE で参照）
  CREATE TEMP TABLE IF NOT EXISTS _yamada_ctx (family_id UUID) ON COMMIT DROP;
  DELETE FROM _yamada_ctx;
  INSERT INTO _yamada_ctx VALUES (yamada_id);
END $$;

-- ============================================================
-- 16家事の UPDATE（旧題名パターン → 新メイン + 新サブ）
-- ============================================================

-- 🛁 風呂掃除
UPDATE otetsudai_tasks SET title = '泡モンスター 討伐作戦', description = 'おふろ そうじ'
WHERE family_id = (SELECT family_id FROM _yamada_ctx)
  AND title IN ('お風呂掃除', 'おふろそうじ', 'おふろ そうじ', '風呂掃除', 'お風呂', 'おふろ', '浴室掃除');

-- 🍽 食器洗い
UPDATE otetsudai_tasks SET title = '油汚れドラゴン 討伐作戦', description = 'しょっき あらい'
WHERE family_id = (SELECT family_id FROM _yamada_ctx)
  AND title IN ('食器洗い', 'しょっきあらい', 'しょっき あらい', '皿洗い', 'お皿洗い', '食器', 'さら あらい');

-- 🧺 洗濯物たたみ
UPDATE otetsudai_tasks SET title = '衣類王国 平定計画', description = 'せんたくもの たたみ'
WHERE family_id = (SELECT family_id FROM _yamada_ctx)
  AND title IN ('洗濯物たたみ', 'せんたくものたたみ', 'せんたくもの たたみ', '洗濯たたみ', '洗濯物を たたむ', '洗濯物');

-- 🧹 掃除機がけ
UPDATE otetsudai_tasks SET title = 'サイクロン発動 大作戦', description = 'そうじき かけ'
WHERE family_id = (SELECT family_id FROM _yamada_ctx)
  AND title IN ('掃除機がけ', 'そうじきかけ', 'そうじき かけ', '掃除機', '床掃除', 'ゆか そうじ');

-- 🗑 ゴミ出し
UPDATE otetsudai_tasks SET title = 'ゴミの魔物 排除任務', description = 'ゴミを だす'
WHERE family_id = (SELECT family_id FROM _yamada_ctx)
  AND title IN ('ゴミ出し', 'ごみ出し', 'ゴミだし', 'ごみだし', 'ゴミすて', 'ゴミを すてる');

-- 🚪 玄関掃除
UPDATE otetsudai_tasks SET title = '開運の門 磨き上げ任務', description = 'げんかん みがき'
WHERE family_id = (SELECT family_id FROM _yamada_ctx)
  AND title IN ('玄関掃除', 'げんかんそうじ', 'げんかん そうじ', '玄関そうじ', '玄関');

-- 👟 靴揃え
UPDATE otetsudai_tasks SET title = '靴の騎士団 整列任務', description = 'くつ ならべ'
WHERE family_id = (SELECT family_id FROM _yamada_ctx)
  AND title IN ('靴揃え', 'くつそろえ', 'くつ そろえ', '靴並べ', 'くつならべ', 'くつ ならべ', '靴');

-- 🧸 片付け
UPDATE otetsudai_tasks SET title = '部屋の魔王 討伐作戦', description = 'かたづけ'
WHERE family_id = (SELECT family_id FROM _yamada_ctx)
  AND title IN ('片付け', 'かたづけ', '部屋の片付け', 'へやの かたづけ', '整理整頓');

-- 🪟 窓拭き
UPDATE otetsudai_tasks SET title = 'ガラスの結界 磨き上げ作戦', description = 'まど ふき'
WHERE family_id = (SELECT family_id FROM _yamada_ctx)
  AND title IN ('窓拭き', 'まどふき', 'まど ふき', '窓ふき', '窓掃除');

-- 🪴 水やり
UPDATE otetsudai_tasks SET title = '植物王国 守護任務', description = 'みず やり'
WHERE family_id = (SELECT family_id FROM _yamada_ctx)
  AND title IN ('水やり', 'みずやり', 'みず やり', '花の水やり', '植物の水やり');

-- 🐶 犬の散歩
UPDATE otetsudai_tasks SET title = '相棒勇者 巡回作戦', description = 'いぬの さんぽ'
WHERE family_id = (SELECT family_id FROM _yamada_ctx)
  AND title IN ('犬の散歩', 'いぬのさんぽ', 'いぬの さんぽ', 'ワンコ散歩', 'ペットの散歩', '散歩');

-- 📚 宿題
UPDATE otetsudai_tasks SET title = '知識の結晶 収集作戦', description = 'しゅくだい'
WHERE family_id = (SELECT family_id FROM _yamada_ctx)
  AND title IN ('宿題', 'しゅくだい', '宿題をする', 'べんきょう', '勉強');

-- 🍳 料理手伝い
UPDATE otetsudai_tasks SET title = '料理勇者 見習い任務', description = 'りょうり てつだい'
WHERE family_id = (SELECT family_id FROM _yamada_ctx)
  AND title IN ('料理手伝い', 'りょうりてつだい', 'りょうり てつだい', '料理の手伝い', 'ごはん作り', '料理');

-- 🦷 歯磨き
UPDATE otetsudai_tasks SET title = '虫歯モンスター 撃退作戦', description = 'はみがき'
WHERE family_id = (SELECT family_id FROM _yamada_ctx)
  AND title IN ('歯磨き', 'はみがき', '歯みがき', 'ハミガキ');

-- 🛏 布団たたみ
UPDATE otetsudai_tasks SET title = 'ふとん勇者 朝の作戦', description = 'ふとん たたみ'
WHERE family_id = (SELECT family_id FROM _yamada_ctx)
  AND title IN ('布団たたみ', 'ふとんたたみ', 'ふとん たたみ', 'ベッドメイク', 'ふとんをたたむ');

-- 💪 肩もみ
UPDATE otetsudai_tasks SET title = '肩こり モンスター撃退', description = 'かた もみ'
WHERE family_id = (SELECT family_id FROM _yamada_ctx)
  AND title IN ('肩もみ', 'かたもみ', 'かた もみ', '肩たたき', 'かたたたき', 'マッサージ');

-- ============================================================
-- 未更新行の確認（実行後に目視でチェック）
-- ============================================================

-- 以下を実行して、まだ旧題名のまま残っているクエストを確認できる。
-- 必要なら本スクリプトに UPDATE を追加して再実行する。

SELECT t.id, t.title, t.description, t.created_at
FROM otetsudai_tasks t
WHERE t.family_id = (SELECT family_id FROM _yamada_ctx)
  AND t.title NOT IN (
    '泡モンスター 討伐作戦',
    '油汚れドラゴン 討伐作戦',
    '衣類王国 平定計画',
    'サイクロン発動 大作戦',
    'ゴミの魔物 排除任務',
    '開運の門 磨き上げ任務',
    '靴の騎士団 整列任務',
    '部屋の魔王 討伐作戦',
    'ガラスの結界 磨き上げ作戦',
    '植物王国 守護任務',
    '相棒勇者 巡回作戦',
    '知識の結晶 収集作戦',
    '料理勇者 見習い任務',
    '虫歯モンスター 撃退作戦',
    'ふとん勇者 朝の作戦',
    '肩こり モンスター撃退'
  )
ORDER BY t.created_at;

COMMIT;

-- ============================================================
-- ロールバックしたい場合（実行前であれば BEGIN 後に ROLLBACK; で戻せる）
-- 実行後に元に戻したいケースは、
--   docs/sql/update-yamada-family-quests.revert.sql
-- を別途用意して手動で再生成が必要（旧題名は本ファイルからも推測可能）。
-- ============================================================
