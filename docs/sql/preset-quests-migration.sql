-- Preset Quests テーブル作成マイグレーション
--
-- 目的:
--   子供が「クエストを えらぶ」で選択できるプリセットクエスト一覧を管理する。
--   現状は src/data/presetQuests.ts にハードコードされているが、将来的に
--   このテーブルに移行し、親側管理画面や運営者側で編集可能にする。
--
-- 参照:
--   docs/kairosoft-quest-naming.md §採用決定版
--   src/data/presetQuests.ts
--
-- 実行方法:
--   Supabase Studio の SQL エディタで実行、または
--   `supabase db push` でマイグレーションとして適用。

-- ============================================================
-- 1. テーブル作成
-- ============================================================

CREATE TABLE IF NOT EXISTS preset_quests (
  id            TEXT PRIMARY KEY,            -- 安定キー (例: "bath_cleaning")
  emoji         TEXT NOT NULL,               -- アイコン絵文字
  main_title    TEXT NOT NULL,               -- ゲーム風メインタイトル
  sub_label     TEXT NOT NULL,               -- ひらがな直接表現のサブラベル
  category      TEXT NOT NULL,               -- カテゴリ (cleaning/kitchen/etc)
  suggested_reward  INTEGER NOT NULL CHECK (suggested_reward >= 0),
  default_reason    TEXT DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,  -- 表示順
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- カテゴリ値のホワイトリスト（CHECK制約で将来拡張可能に）
ALTER TABLE preset_quests
  ADD CONSTRAINT preset_quests_category_check
  CHECK (category IN ('cleaning', 'kitchen', 'self_care', 'errands', 'self_growth', 'family_care'));

-- 表示順・絞り込み用インデックス
CREATE INDEX IF NOT EXISTS idx_preset_quests_active_order
  ON preset_quests (is_active, display_order) WHERE is_active = true;

-- ============================================================
-- 2. 初期シードデータ (16件)
-- ============================================================

INSERT INTO preset_quests (id, emoji, main_title, sub_label, category, suggested_reward, default_reason, display_order) VALUES
  ('bath_cleaning',      '🛁', '泡モンスター 討伐作戦',       'おふろ そうじ',         'cleaning',     50, 'お風呂を きれいに したい',              1),
  ('dish_washing',       '🍽', '油汚れドラゴン 討伐作戦',     'しょっき あらい',       'kitchen',      30, '冒険団マスターを 助けたい',             2),
  ('laundry_folding',    '🧺', '衣類王国 平定計画',           'せんたくもの たたみ',   'cleaning',     30, '洋服を きれいに 整えたい',              3),
  ('vacuuming',          '🧹', 'サイクロン発動 大作戦',       'そうじき かけ',         'cleaning',     40, '部屋を ピカピカに したい',              4),
  ('trash_out',          '🗑', 'ゴミの魔物 排除任務',         'ゴミを だす',           'errands',      20, 'おうちを きれいに たもちたい',          5),
  ('entrance_cleaning',  '🚪', '開運の門 磨き上げ任務',       'げんかん みがき',       'cleaning',     30, '玄関を きれいに したい',                6),
  ('shoe_arrangement',   '👟', '靴の騎士団 整列任務',         'くつ ならべ',           'cleaning',     10, '玄関を 整えたい',                       7),
  ('tidying',            '🧸', '部屋の魔王 討伐作戦',         'かたづけ',              'cleaning',     40, '自分の部屋を きれいに したい',          8),
  ('window_wiping',      '🪟', 'ガラスの結界 磨き上げ作戦',   'まど ふき',             'cleaning',     30, 'お日様の光を たくさん 入れたい',        9),
  ('watering_plants',    '🪴', '植物王国 守護任務',           'みず やり',             'family_care',  10, '植物を 元気に したい',                 10),
  ('dog_walk',           '🐶', '相棒勇者 巡回作戦',           'いぬの さんぽ',         'family_care',  30, '相棒と 冒険したい',                    11),
  ('homework',           '📚', '知識の結晶 収集作戦',         'しゅくだい',            'self_growth',  30, '勉強を がんばりたい',                  12),
  ('cooking_help',       '🍳', '料理勇者 見習い任務',         'りょうり てつだい',     'kitchen',      40, '料理を おぼえたい',                    13),
  ('tooth_brushing',     '🦷', '虫歯モンスター 撃退作戦',     'はみがき',              'self_care',    10, '歯を 大切に したい',                   14),
  ('futon_folding',      '🛏', 'ふとん勇者 朝の作戦',         'ふとん たたみ',         'self_care',    20, 'ベッドを きれいに 整えたい',           15),
  ('shoulder_massage',   '💪', '肩こり モンスター撃退',       'かた もみ',             'family_care',  20, '家族を 元気に したい',                 16)
ON CONFLICT (id) DO UPDATE SET
  emoji            = EXCLUDED.emoji,
  main_title       = EXCLUDED.main_title,
  sub_label        = EXCLUDED.sub_label,
  category         = EXCLUDED.category,
  suggested_reward = EXCLUDED.suggested_reward,
  default_reason   = EXCLUDED.default_reason,
  display_order    = EXCLUDED.display_order,
  updated_at       = NOW();

-- ============================================================
-- 3. RLS (Row Level Security) ポリシー
-- ============================================================

ALTER TABLE preset_quests ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが有効なプリセットを読み取り可能
CREATE POLICY "preset_quests_read_active"
  ON preset_quests FOR SELECT
  USING (is_active = true);

-- 管理者のみ書き込み可能（将来、親側管理UIから編集可にする場合はポリシー追加）
CREATE POLICY "preset_quests_admin_write"
  ON preset_quests FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================
-- 4. updated_at 自動更新トリガ
-- ============================================================

CREATE OR REPLACE FUNCTION update_preset_quests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_preset_quests_updated_at ON preset_quests;
CREATE TRIGGER trg_preset_quests_updated_at
  BEFORE UPDATE ON preset_quests
  FOR EACH ROW
  EXECUTE FUNCTION update_preset_quests_updated_at();

-- ============================================================
-- 完了
-- ============================================================
-- 適用後の確認:
--   SELECT id, main_title, sub_label, suggested_reward FROM preset_quests ORDER BY display_order;
-- 16行返れば成功。
