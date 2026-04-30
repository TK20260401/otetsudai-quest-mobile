-- Batch 3: 冒険ログ(transactions)タップでクリア機能 + 旧用語一括置換
-- 1. otetsudai_transactions に dismissed_at カラム追加
-- 2. 既存 description の旧用語を新用語に一括 UPDATE
--    （貯める→金庫 / 使う→取引 / 振替→移す / 移しかえ→移す）
-- 注意: B 案採用(DB 一括 UPDATE)。実行前にバックアップ推奨

-- ============================================
-- 1. dismissed_at カラム追加
-- ============================================
ALTER TABLE otetsudai_transactions
  ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ;

-- 部分インデックス: 未 dismiss のものだけインデックス対象
CREATE INDEX IF NOT EXISTS idx_transactions_dismissed
  ON otetsudai_transactions(child_id, dismissed_at)
  WHERE dismissed_at IS NULL;

-- ============================================
-- 2. description 旧用語を新用語に置換
-- ============================================
-- 「移しかえ」を先に置換（「移」を含むため順序重要）
UPDATE otetsudai_transactions
  SET description = REPLACE(description, '移しかえ', '移す')
  WHERE description LIKE '%移しかえ%';

-- 「振替」→「移す」
UPDATE otetsudai_transactions
  SET description = REPLACE(description, '振替', '移す')
  WHERE description LIKE '%振替%';

-- 「貯める」→「金庫」
UPDATE otetsudai_transactions
  SET description = REPLACE(description, '貯める', '金庫')
  WHERE description LIKE '%貯める%';

-- 「使う」→「取引」
UPDATE otetsudai_transactions
  SET description = REPLACE(description, '使う', '取引')
  WHERE description LIKE '%使う%';

-- 平仮名表記もカバー
UPDATE otetsudai_transactions
  SET description = REPLACE(description, 'つかう', '取引')
  WHERE description LIKE '%つかう%';

UPDATE otetsudai_transactions
  SET description = REPLACE(description, 'ためる', '金庫')
  WHERE description LIKE '%ためる%';

UPDATE otetsudai_transactions
  SET description = REPLACE(description, 'ふやす', '錬成')
  WHERE description LIKE '%ふやす%';

UPDATE otetsudai_transactions
  SET description = REPLACE(description, 'ふりかえ', '移す')
  WHERE description LIKE '%ふりかえ%';

-- ============================================
-- 3. 確認用クエリ（実行後に手動で確認）
-- ============================================
-- SELECT description, COUNT(*)
-- FROM otetsudai_transactions
-- GROUP BY description
-- ORDER BY COUNT(*) DESC LIMIT 20;
