-- 銘柄 (otetsudai_stock_prices) の世界観統一 一括 UPDATE
-- 仕様確認シート 2026-04-30 第2弾 Q2-Q5 採用結果に基づく
-- 株 → お宝、会社 → 冒険商会、東京 → 江戸、アメリカ → ロケットシティ

-- 注意: 順序重要（"アメリカ" を含む語が "ロケットシティ" を含むことがあるため、
-- まず "アメリカ" を置換してから他の語を処理）

-- ============================================
-- 1. 東京 → 江戸
-- ============================================
UPDATE otetsudai_stock_prices
  SET name_ja = REPLACE(name_ja, '東京', '江戸')
  WHERE name_ja LIKE '%東京%';

UPDATE otetsudai_stock_prices
  SET description_kids = REPLACE(description_kids, '東京', '江戸')
  WHERE description_kids LIKE '%東京%';

-- ============================================
-- 2. アメリカ → ロケットシティ
-- ============================================
UPDATE otetsudai_stock_prices
  SET name_ja = REPLACE(name_ja, 'アメリカ', 'ロケットシティ')
  WHERE name_ja LIKE '%アメリカ%';

UPDATE otetsudai_stock_prices
  SET description_kids = REPLACE(description_kids, 'アメリカ', 'ロケットシティ')
  WHERE description_kids LIKE '%アメリカ%';

-- ============================================
-- 3. 株 → お宝
-- ============================================
UPDATE otetsudai_stock_prices
  SET name_ja = REPLACE(name_ja, '株', 'お宝')
  WHERE name_ja LIKE '%株%';

UPDATE otetsudai_stock_prices
  SET description_kids = REPLACE(description_kids, '株', 'お宝')
  WHERE description_kids LIKE '%株%';

-- ============================================
-- 4. 会社 → 冒険商会
-- ============================================
UPDATE otetsudai_stock_prices
  SET description_kids = REPLACE(description_kids, '会社', '冒険商会')
  WHERE description_kids LIKE '%会社%';

-- ============================================
-- 確認用クエリ（実行後）
-- ============================================
-- SELECT symbol, name_ja, description_kids FROM otetsudai_stock_prices ORDER BY symbol;
-- 旧用語が残っていないか:
-- SELECT symbol, name_ja, description_kids FROM otetsudai_stock_prices
-- WHERE name_ja ~ '東京|アメリカ|株' OR description_kids ~ '東京|アメリカ|株|会社';
-- → 0 行返れば成功
