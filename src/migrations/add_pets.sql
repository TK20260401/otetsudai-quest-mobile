-- ペットシステム: Habitica風ペット育成機能
CREATE TABLE IF NOT EXISTS otetsudai_pets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  child_id uuid NOT NULL REFERENCES otetsudai_users(id) ON DELETE CASCADE,
  family_id uuid NOT NULL REFERENCES otetsudai_families(id) ON DELETE CASCADE,
  pet_type text NOT NULL CHECK (pet_type IN ('dragon','phoenix','unicorn','cat','dog','rabbit')),
  name text,
  growth_stage text NOT NULL DEFAULT 'egg' CHECK (growth_stage IN ('egg','baby','child','adult')),
  hatched_at timestamptz,
  fed_count integer NOT NULL DEFAULT 0,
  happiness integer NOT NULL DEFAULT 100 CHECK (happiness BETWEEN 0 AND 100),
  is_active boolean NOT NULL DEFAULT false,
  quests_since_acquired integer NOT NULL DEFAULT 0,
  last_fed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pets_child ON otetsudai_pets (child_id);
CREATE INDEX IF NOT EXISTS idx_pets_active ON otetsudai_pets (child_id, is_active) WHERE is_active = true;

ALTER TABLE otetsudai_pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pets_select" ON otetsudai_pets FOR SELECT USING (true);
CREATE POLICY "pets_insert" ON otetsudai_pets FOR INSERT WITH CHECK (true);
CREATE POLICY "pets_update" ON otetsudai_pets FOR UPDATE USING (true);
CREATE POLICY "pets_delete" ON otetsudai_pets FOR DELETE USING (true);
