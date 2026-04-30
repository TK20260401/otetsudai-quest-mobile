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
-- 5. 江戸全部盛り: 1306.T (TOPIX ETF) を維持
--   一時 ^TPX (TOPIX 指数) に切替したが、Stooq 経由でも安定取得できず
--   ETF 価格(394円) のまま運用するためロールバック。Edge Function 側の
--   Stooq フォールバックは将来の指数銘柄追加用に残置。
-- ============================================
-- (旧 UPDATE は無効化。再実行時に ^TPX → 1306.T 復元するセーフティガード)
UPDATE otetsudai_stock_prices
  SET symbol = '1306.T'
  WHERE symbol = '^TPX';

-- ============================================
-- 7. typo 修正 + 馬車 → 車（ロケットシティ銘柄）
--   - 箸れスニーカー → 走れスニーカー (誤変換: 箸→走)
--   - 稲妻の馬車 → 稲妻の車 (子供向けに馬車を車へ)
-- ============================================
-- 注: NKE は実際の DB 値が 'はしれスニーカー'(全ひらがな) だったため、
-- REPLACE('箸れ','走れ') では空振り。直接 SET で漢字へ書き換える:
UPDATE otetsudai_stock_prices
  SET name_ja = '走れスニーカー'
  WHERE symbol = 'NKE';

UPDATE otetsudai_stock_prices
  SET name_ja = REPLACE(name_ja, '稲妻の馬車', '稲妻の車')
  WHERE name_ja LIKE '%稲妻の馬車%';

-- ============================================
-- 7-2. TSLA (Tesla): name_ja = 'Tesla'(英語) のままなので直接 SET
--   既存: name_ja='Tesla', description_kids='でんきじどうしゃの かいしゃ'
--   → 世界観統一・漢字+ルビ対応の名称に上書き
-- ============================================
UPDATE otetsudai_stock_prices
  SET name_ja = '稲妻の車',
      description_kids = '電気で走る車の商会',
      icon = '⚡'
  WHERE symbol = 'TSLA';
-- 注: TSLA と 7203.T(Toyota=🚗) の icon 被りを解消するため、
-- TSLA は ⚡ (稲妻の車の名前と整合) に変更

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
-- 8. お店 → 商会 (MCD/SBUX 等)
--   description_kids 内の「お店」を世界観統一の「商会」へ
-- ============================================
UPDATE otetsudai_stock_prices
  SET description_kids = REPLACE(description_kids, 'お店', '商会')
  WHERE description_kids LIKE '%お店%';

-- ============================================
-- 確認用
-- ============================================
-- SELECT symbol, name_ja, description_kids FROM otetsudai_stock_prices
-- WHERE symbol = '9432.T'
--    OR description_kids LIKE '%検索%'
--    OR description_kids LIKE '%黄金商会%';
