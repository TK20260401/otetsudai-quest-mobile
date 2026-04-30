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
-- 2. 電話の塔 (9984.T = SoftBank Group) の名前と説明文を直接 SET
--   既存の「電話の塔」名・「携帯電話の商会」等の説明を上書き
--   ※ 当初 9432.T(NTT) と想定したが、シードデータ実体は 9984.T(SBG) だった
-- ============================================
UPDATE otetsudai_stock_prices
  SET name_ja = '大通信塔',
      description_kids = 'メッセージを交換する商会'
  WHERE symbol = '9984.T';

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
-- 5. 江戸全部盛り(1306.T → ^TPX): TOPIX 指数本体に切替
--   1306.T は ETF 連動型で 394円表示だったが、ユーザーは指数本体(3,722等)を希望
--   Stooq 経由で ^TPX (TOPIX 指数) を取得するよう Edge Function 側で実装済み
-- ============================================
UPDATE otetsudai_stock_prices
  SET symbol = '^TPX'
  WHERE symbol = '1306.T';

-- ============================================
-- 7. typo 修正 + 馬車 → 車（ロケットシティ銘柄）
--   - 箸れスニーカー → 走れスニーカー (誤変換: 箸→走)
--   - 稲妻の馬車 → 稲妻の車 (子供向けに馬車を車へ)
-- ============================================
UPDATE otetsudai_stock_prices
  SET name_ja = REPLACE(name_ja, '箸れ', '走れ')
  WHERE name_ja LIKE '%箸れ%';

UPDATE otetsudai_stock_prices
  SET name_ja = REPLACE(name_ja, '稲妻の馬車', '稲妻の車')
  WHERE name_ja LIKE '%稲妻の馬車%';

-- ============================================
-- 6. 大通信塔の symbol を 9984.T (SoftBank Group) → 9432.T (NTT) に変更
--   ユーザー指示: 「NTTを更新します」(NTT 9432.T を本来の大通信塔として登録)
--   旧 9984.T のレコードはそのままシンボルだけ書き換えるため、name/description は維持
--   (大通信塔 / メッセージを交換する商会)
-- ============================================
UPDATE otetsudai_stock_prices
  SET symbol = '9432.T',
      name = 'NTT'
  WHERE symbol = '9984.T';

-- ============================================
-- 確認用
-- ============================================
-- SELECT symbol, name_ja, description_kids FROM otetsudai_stock_prices
-- WHERE symbol = '9432.T'
--    OR description_kids LIKE '%検索%'
--    OR description_kids LIKE '%黄金商会%';
