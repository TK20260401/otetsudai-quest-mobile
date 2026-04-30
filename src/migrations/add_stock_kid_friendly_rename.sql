-- 銘柄名・説明文の子供向け再リネーム（2026-04-30 追加調整）
-- 1. 検索エンジン → 検索（子供にエンジンが難しいため）
-- 2. NTT (9432.T): 電話の塔 → 大通信塔（NTT は携帯だけでなく総合通信業のため）
--    description: → メッセージを交換する商会（子供向け簡潔表現）

-- ============================================
-- 1. 検索エンジンの商会 → 検索の商会
-- ============================================
UPDATE otetsudai_stock_prices
  SET description_kids = REPLACE(description_kids, '検索エンジンの商会', '検索の商会')
  WHERE description_kids LIKE '%検索エンジンの商会%';

-- ============================================
-- 2. NTT (9432.T) の名前と説明文を直接 SET
--   既存の「電話の塔」名・「電話を作っている商会」等の説明を上書き
-- ============================================
UPDATE otetsudai_stock_prices
  SET name_ja = '大通信塔',
      description_kids = 'メッセージを交換する商会'
  WHERE symbol = '9432.T';

-- ============================================
-- 3. 銀行 → 黄金商会（世界観優先のリネーム）
--   description_kids 内の「銀行」を「黄金商会」に置換
-- ============================================
UPDATE otetsudai_stock_prices
  SET description_kids = REPLACE(description_kids, '銀行', '黄金商会')
  WHERE description_kids LIKE '%銀行%';

-- ============================================
-- 4. 銘柄名 内の 大金庫 → 大宝庫（8306.T MUFG）
--   既存「金貨の大金庫」→「金貨の大宝庫」
-- ============================================
UPDATE otetsudai_stock_prices
  SET name_ja = REPLACE(name_ja, '大金庫', '大宝庫')
  WHERE name_ja LIKE '%大金庫%';

-- ============================================
-- 確認用
-- ============================================
-- SELECT symbol, name_ja, description_kids FROM otetsudai_stock_prices
-- WHERE symbol = '9432.T'
--    OR description_kids LIKE '%検索%'
--    OR description_kids LIKE '%黄金商会%';
