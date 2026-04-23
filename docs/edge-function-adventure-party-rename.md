# Edge Function 改修指示書: 家族名自動生成 →「冒険団」リブランド

## 対象

Supabase Edge Function: `create-child-account`
（本リポジトリ外。Supabase ダッシュボードまたは別リポから管理）

## 変更内容

### 変更箇所: 家族名自動生成ロジック

子どもがニックネーム登録時に `otetsudai_families.name` へ自動挿入される値を変更する。

| 項目 | 変更前 | 変更後 |
|------|--------|--------|
| 家族名テンプレート | `${nickname}のかぞく` | `${nickname}の冒険団` |

### コード例（該当箇所を特定して置換）

```diff
- const familyName = `${nickname}のかぞく`;
+ const familyName = `${nickname}の冒険団`;
```

## 既存データについて

既存レコードは以下のマイグレーションで一括リネーム **適用済み**:

```sql
UPDATE otetsudai_families
SET name = REPLACE(name, 'のかぞく', 'の冒険団')
WHERE name LIKE '%のかぞく';
```

3件更新済み。Edge Function のデプロイ前後で既存データの追加対応は不要。

## デプロイ後の動作確認手順

1. テスト用の子どもアカウントを新規作成する
2. `otetsudai_families` テーブルを確認し、新規レコードの `name` が `${nickname}の冒険団` になっていることを検証
3. アプリ側で新規登録フローを通し、画面表示が「〇〇の冒険団」であることを確認
4. `Ruby.tsx` の `RUBY_DICT` に `["冒険団", "ぼうけんだん"]` が登録済みのため、ルビ表示も自動で適用される

## 注意事項

- DB カラム名 (`otetsudai_families`) やスキーマの変更は不要
- Edge Function 内の他のロジック（ユーザー作成、ウォレット初期化等）には変更なし
