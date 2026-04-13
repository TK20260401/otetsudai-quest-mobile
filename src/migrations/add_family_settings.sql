-- 家族単位の特別クエスト設定テーブル
CREATE TABLE IF NOT EXISTS otetsudai_family_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES otetsudai_families(id),
  special_quest_enabled boolean DEFAULT true,
  special_quest_star1_enabled boolean DEFAULT true,
  special_quest_star2_enabled boolean DEFAULT true,
  special_quest_star3_enabled boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(family_id)
);

-- RLS
ALTER TABLE otetsudai_family_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family_settings_select" ON otetsudai_family_settings
  FOR SELECT USING (true);

CREATE POLICY "family_settings_insert" ON otetsudai_family_settings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "family_settings_update" ON otetsudai_family_settings
  FOR UPDATE USING (true);
