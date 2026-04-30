-- 銘柄 (otetsudai_stock_prices) の世界観統一 一括 UPDATE
-- 仕様確認シート 2026-04-30 第2弾 + 追加調整
-- 株 → お宝、東京 → 江戸、日本 → サムライタウン、アメリカ → ロケットシティ、会社 → 商会

-- 注意: 順序重要。アメリカ/日本/東京 は名詞単独で他語を含むため最初に処理。
-- 「会社」を「商会」に変更（先の「冒険商会」案ではなく単に「商会」へ更新）。

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
-- 3. 日本 → サムライタウン
-- ============================================
UPDATE otetsudai_stock_prices
  SET name_ja = REPLACE(name_ja, '日本', 'サムライタウン')
  WHERE name_ja LIKE '%日本%';

UPDATE otetsudai_stock_prices
  SET description_kids = REPLACE(description_kids, '日本', 'サムライタウン')
  WHERE description_kids LIKE '%日本%';

-- ============================================
-- 4. 株 → お宝
-- ============================================
UPDATE otetsudai_stock_prices
  SET name_ja = REPLACE(name_ja, '株', 'お宝')
  WHERE name_ja LIKE '%株%';

UPDATE otetsudai_stock_prices
  SET description_kids = REPLACE(description_kids, '株', 'お宝')
  WHERE description_kids LIKE '%株%';

-- ============================================
-- 5. 会社 → 商会
-- ============================================
UPDATE otetsudai_stock_prices
  SET description_kids = REPLACE(description_kids, '会社', '商会')
  WHERE description_kids LIKE '%会社%';

-- ============================================
-- 確認用クエリ（実行後）
-- ============================================
-- SELECT symbol, name_ja, description_kids FROM otetsudai_stock_prices ORDER BY symbol;
-- 旧用語が残っていないか:
-- SELECT symbol, name_ja, description_kids FROM otetsudai_stock_prices
-- WHERE name_ja ~ '東京|アメリカ|日本|株' OR description_kids ~ '東京|アメリカ|日本|株|会社';
-- → 0 行返れば成功
