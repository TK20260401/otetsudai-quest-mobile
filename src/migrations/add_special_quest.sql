-- ★特別クエストシステム: otetsudai_tasks テーブルに特別クエスト用カラム追加
ALTER TABLE otetsudai_tasks
  ADD COLUMN IF NOT EXISTS is_special boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS special_difficulty integer,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date;

-- 特別クエスト用インデックス
CREATE INDEX IF NOT EXISTS idx_tasks_special ON otetsudai_tasks (is_special, is_active)
  WHERE is_special = true;
