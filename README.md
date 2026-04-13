# おこづかいクエスト モバイル版（React Native）

## 概要

[おこづかいクエスト](https://otetsudai-bank-beta.vercel.app/)のネイティブモバイルアプリ版。
Web版（Next.js）と同じ Supabase バックエンドを共用し、iOS / Android の両プラットフォームで動作する。

## 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | React Native + Expo SDK 54 |
| 言語 | TypeScript |
| バックエンド | Supabase（Web版と共用） |
| ナビゲーション | React Navigation (Native Stack) |
| セッション管理 | AsyncStorage |
| 対応OS | iOS / Android |

## ディレクトリ構成

```
otetsudai-quest-mobile/
├── App.tsx                      # エントリーポイント
├── app.json                     # Expo設定
├── .env                         # 環境変数（git管理外）
├── src/
│   ├── navigation/
│   │   └── AppNavigator.tsx     # 画面遷移（Login → Child/Parent Dashboard）
│   ├── screens/
│   │   ├── LoginScreen.tsx      # ログイン（家族選択→メンバー選択→PIN認証）
│   │   ├── ChildDashboardScreen.tsx  # 子どもダッシュボード
│   │   └── ParentDashboardScreen.tsx # 親ダッシュボード
│   ├── lib/
│   │   ├── supabase.ts          # Supabase クライアント初期化
│   │   ├── types.ts             # 型定義（Web版と同一）
│   │   ├── session.ts           # セッション管理（AsyncStorage）
│   │   ├── responsive.ts         # レスポンシブフォントサイズユーティリティ
│   │   ├── colors.ts            # テーマカラー定義（特別クエスト金色含む）
│   │   ├── levels.ts            # レベルアップシステム（7段階）
│   │   ├── badges.ts            # バッジ判定・付与ロジック（5種類）
│   │   ├── task-icons.ts        # タスク名→アイコン絵文字マッピング
│   │   └── stamps.ts            # 承認スタンプ定義（8種類）
│   ├── components/
│   │   ├── CharacterSvg.tsx     # レベル別キャラクターSVG
│   │   ├── LevelUpModal.tsx     # レベルアップ演出モーダル
│   │   ├── ChildReactionModal.tsx # 子ども返信モーダル
│   │   └── PriceRequestModal.tsx  # 値上げリクエストモーダル
│   ├── migrations/
│   │   ├── add_special_quest.sql      # 特別クエストカラム追加
│   │   ├── add_pricing_and_reaction.sql # 値上げ・返信機能追加
│   │   └── add_family_settings.sql    # 家族設定テーブル追加
│   └── services/
│       └── auth.ts              # 認証サービス（PIN照合・ログイン）
```

## セットアップ手順

### 1. 依存パッケージのインストール

```bash
cd otetsudai-quest-mobile
npm install
```

### 2. 環境変数の設定

`.env` ファイルをプロジェクトルートに作成：

```
EXPO_PUBLIC_SUPABASE_URL=<Supabase URL>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<Supabase Anon Key>
```

Web版（`otetsudai-bank/.env.local`）の値をそのまま使用。プレフィックスを `NEXT_PUBLIC_` → `EXPO_PUBLIC_` に変更する。

### 3. 開発サーバーの起動

```bash
npx expo start --tunnel
```

スマホの「Expo Go」アプリでQRコードを読み取ると実機で確認可能。

## 実装済み機能（Phase 1〜3）

### Phase 1: プロジェクト初期設定 + ログイン
- Expo + TypeScript プロジェクト作成
- Supabase 接続（Web版と同じDB共用）
- セッション管理（AsyncStorage）
- ログイン画面
  - 家族選択 → メンバー選択 → PIN入力（3ステップ）
  - 管理者ログイン（メール + パスワード）
- 画面遷移（React Navigation）
- 常にログイン画面から開始する設定

### Phase 2: 子どもダッシュボード + クエスト完了
- レベル表示（ランク名 + 進捗バー + 次レベルまでの残額）
- おやからのメッセージ（承認スタンプ + メッセージ 直近5件）
- おさいふ（つかう/ためる/ふやす 3分割表示、色分け）
- バッジ一覧（獲得済みバッジ表示）
- クエスト一覧（タスクアイコン + 報酬 + 「クリア！」ボタン）
- りれき（直近20件の取引履歴、タブ切替）
- プルダウンで更新（スワイプリロード）
- バッジ自動判定（クエスト完了時）

### Phase 3: 親ダッシュボード + クエスト承認・管理
- 3タブ構成（承認 / クエスト / 子ども）
- 承認キュー
  - クエスト完了の承認/却下（スタンプ8種 + メッセージ入力）
  - つかいたいリクエストの承認/却下
  - ウォレット3分割計算（save_ratio / invest_ratio に基づく自動分配）
  - 取引履歴の自動記録
  - 却下時の理由選択（4種類）
- クエスト管理
  - 新規作成（名前・報酬・繰り返し・担当者選択）
  - 編集・削除・有効/無効切替
- こども一覧（ウォレット残高 + 分割比率表示）
- 管理者ログイン時は全家族のデータを横断表示
- キーボード回避対応（KeyboardAvoidingView）

### Phase 3.5: ★特別クエストシステム（モンハン風イベントクエスト）
- 通常クエストとは別枠の期間限定・高報酬クエスト
- 子ども画面
  - 金枠 + ★マーク + 残り日数カウントダウン表示
  - 難易度表示（★〜★★★）
  - 通常クエストの上に優先表示
  - 期間外の特別クエストは自動非表示
  - 家族設定に基づく表示/非表示制御
- 親画面
  - 「+ ★特別」ボタンでワンタッチ作成
  - 難易度（★1〜3）選択
  - カレンダーによる開始日・終了日選択
  - 最低報酬 50円バリデーション
  - 特別クエストは「繰り返し」設定不要（自動で1回）
  - タスク一覧で金色背景で視覚区別
  - **特別クエスト設定パネル**: 全体ON/OFF + 難易度別（★/★★/★★★）ON/OFFトグル
    - OFFにした難易度のクエストは親画面でグレーアウト、子ども画面で非表示
- DB変更:
  - `otetsudai_tasks` に `is_special`, `special_difficulty`, `start_date`, `end_date` カラム追加
  - `otetsudai_family_settings` テーブル新規作成（家族単位の設定）

| 比較 | 通常クエスト | ★特別クエスト |
|------|------------|--------------|
| 報酬 | 10円〜 | 50円〜（上限なし） |
| 期間 | 常設 / daily / weekly | 期限つき（開始日・終了日） |
| 表示 | 通常リスト | 金枠 + ★ + カウントダウン |
| 難易度 | なし | ★〜★★★ |
| 例 | おさらあらい、ゴミだし | 年末大掃除、お庭の草むしり |

## 未実装（Phase 4〜8 予定）

| Phase | 内容 |
|-------|------|
| Phase 4 | ウォレット詳細 + つかうリクエスト |
| Phase 5 | ちょきん目標 + バッジ・レベル詳細 |
| Phase 6 | 投資シミュレーション |
| Phase 7 | AIチャット（コインくん） |
| Phase 8 | 管理者画面 + ストア公開準備 |

## Web版との関係

- **バックエンド共用**: 同一の Supabase プロジェクト（同じDB・RLSポリシー）
- **型定義共用**: `lib/types.ts` はWeb版と同一の型定義
- **ビジネスロジック移植**: バッジ判定、レベル計算、スタンプ定義等はWeb版から移植
- **デザイン方針**: Web版のUIをネイティブUI向けに軽量化。アニメーション控えめ、フリーズ防止優先

## ストア公開

App Store / Google Play への公開を予定。現在は Expo Go での動作確認フェーズ。
