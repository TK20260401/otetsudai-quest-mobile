# Job Saga（ジョブサガ）モバイル版（React Native）

## 概要

[Job Saga](https://otetsudai-bank-beta.vercel.app/)のネイティブモバイルアプリ版（旧: おこづかいクエスト）。
お手伝い＝クエストを通じて「クエスト・ストック・冒険・ショップ」を体験できる子供向け教育フィンテックアプリ。
Web版（Next.js）と同じ Supabase バックエンドを共用し、iOS / Android の両プラットフォームで動作する。

> **ブランドガイドライン**: 表記ルール・ロゴ・タグラインの統一方針は [BRAND.md](./BRAND.md) を参照(両版共通の公式ガイドライン)。

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
│   │   ├── LandingScreen.tsx    # ランディング画面（ログインボタン+機能紹介）
│   │   ├── LoginScreen.tsx      # ログイン（家族選択→メンバー選択→PIN認証）
│   │   ├── ChildDashboardScreen.tsx  # 子どもダッシュボード
│   │   ├── ParentDashboardScreen.tsx # 親ダッシュボード
│   │   ├── WalletDetailScreen.tsx    # ウォレット詳細
│   │   ├── SpendRequestScreen.tsx    # ショップリクエスト
│   │   ├── InvestScreen.tsx         # 冒険ショップ（お宝の売買）
│   │   └── onboarding/
│   │       ├── WelcomeScreen.tsx    # ウェルカム画面
│   │       ├── NicknameScreen.tsx   # ニックネーム入力
│   │       ├── PinSetupScreen.tsx   # PIN設定（4桁・2段階確認）
│   │       ├── BackupWordsScreen.tsx # バックアップあいことば表示
│   │       └── index.ts            # バレルエクスポート
│   ├── theme/
│   │   ├── palettes.ts          # 3パレット定義（CUD/WCAG準拠）
│   │   ├── ThemeContext.tsx      # テーマProvider + useTheme
│   │   └── index.ts             # テーマエクスポート
│   ├── lib/
│   │   ├── supabase.ts          # Supabase クライアント初期化
│   │   ├── types.ts             # 型定義（Web版と同一）
│   │   ├── session.ts           # セッション管理（AsyncStorage）
│   │   ├── responsive.ts        # レスポンシブフォントサイズユーティリティ
│   │   ├── levels.ts            # レベルアップシステム（7段階）
│   │   ├── badges.ts            # バッジ判定・付与ロジック（5種類）
│   │   ├── task-icons.ts        # タスク名→アイコン絵文字マッピング
│   │   ├── stamps.ts            # 承認スタンプ定義（8種類）
│   │   └── useReducedMotion.ts  # OS設定連動アニメーション制御
│   ├── components/
│   │   ├── Ruby.tsx             # ルビ（振り仮名）コンポーネント群
│   │   ├── CharacterSvg.tsx     # レベル別キャラクターSVG
│   │   ├── LevelUpModal.tsx     # レベルアップ演出モーダル
│   │   ├── BadgeUnlockModal.tsx # バッジ獲得演出モーダル
│   │   ├── AnimatedButton.tsx   # アニメーション付きボタン
│   │   ├── AppAlert.tsx         # カスタムアラート（ルビ対応）
│   │   ├── ChildReactionModal.tsx # 子ども返信モーダル
│   │   ├── PriceRequestModal.tsx  # 値上げリクエストモーダル
│   │   ├── PixelIcons.tsx       # ピクセルアートSVGアイコン（38種）
│   │   └── PixelHeroSvg.tsx     # ドット絵キャラクター（戦士・魔法使い）
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

## 実装済み機能（Phase 1〜8）

| Phase | 内容 |
|-------|------|
| **Phase 1**<br>プロジェクト初期設定 + ログイン | <ul><li>Expo + TypeScript プロジェクト作成</li><li>Supabase 接続（Web版と同じDB共用）</li><li>セッション管理（AsyncStorage）</li><li>ログイン画面: 家族選択 → メンバー選択 → PIN入力（3ステップ）/ 管理者ログイン（メール + パスワード）</li><li>画面遷移（React Navigation）</li><li>常にログイン画面から開始する設定</li></ul> |
| **Phase 2**<br>子どもダッシュボード + クエスト完了 | <ul><li>レベル表示（ランク名 + 進捗バー + 次レベルまでの残額）</li><li>おやからのメッセージ（承認スタンプ + メッセージ 直近5件）</li><li>宝箱（ショップ/ストック/冒険 3分割表示、色分け）</li><li>バッジ一覧（獲得済みバッジ表示）</li><li>クエスト一覧（タスクアイコン + 報酬 + 「クリア！」ボタン）</li><li>冒険ログ（直近20件の取引履歴、タブ切替）</li><li>プルダウンで更新（スワイプリロード）</li><li>バッジ自動判定（クエスト完了時）</li></ul> |
| **Phase 3**<br>親ダッシュボード + クエスト承認・管理 | <ul><li>3タブ構成（承認 / クエスト / 子ども）</li><li>承認キュー: クエスト完了承認/却下（スタンプ8種 + メッセージ）/ ショップリクエスト承認/却下 / 宝箱3分割計算（save_ratio / invest_ratio）/ 取引履歴自動記録 / 却下理由選択4種</li><li>クエスト管理（新規作成・編集・削除・有効/無効切替）</li><li>こども一覧（ウォレット残高 + 分割比率表示）</li><li>管理者ログイン時は全家族のデータを横断表示</li><li>キーボード回避対応（KeyboardAvoidingView）</li></ul> |
| **Phase 3.5**<br>★特別クエストシステム<br>（モンハン風イベントクエスト） | <ul><li>通常クエストとは別枠の期間限定・高報酬クエスト</li><li>子ども画面: 金枠 + ★マーク + カウントダウン / 難易度（★〜★★★）/ 通常上に優先表示 / 期間外自動非表示 / 家族設定で表示制御</li><li>親画面: 「+ ★特別」ワンタッチ作成 / 難易度★1〜3 / カレンダー期間選択 / 最低報酬50円 / 金色背景区別</li><li>特別クエスト設定パネル: 全体ON/OFF + 難易度別（★/★★/★★★）ON/OFF</li><li>DB: <code>otetsudai_tasks</code> に <code>is_special</code>/<code>special_difficulty</code>/<code>start_date</code>/<code>end_date</code> 追加、<code>otetsudai_family_settings</code> 新規</li><li>比較: 通常 10円〜・常設 vs ★特別 50円〜・期限つき・難易度あり</li></ul> |
| **Phase 4**<br>宝箱詳細 + ショップリクエスト<br>（v0.12.0） | <ul><li>WalletDetailScreen（宝箱詳細: 全部のコイン + ポケットカード表示）</li><li>SpendRequestScreen（オーダー画面: 確認 → 親に送信）</li><li>3ポケットカードタップ遷移（買い物に使う→SpendRequest / 目標まで貯める→お宝マップ / 株でお金を増やす→冒険ショップ）</li></ul> |
| **Phase 5**<br>お宝マップ + バッジ・レベル詳細<br>（v0.19.0 / v0.21.0 / v0.26.0） | <ul><li>TrophyCaseModal（バッジ一覧・シルエット・獲得日時）</li><li>SkillTreeUI（5バッジSVG化、獲得済みのみアニメーション）</li><li>お宝マップモーダル（旧 貯金目標）: 目標額設定 → 達成時マイルストーン演出</li><li>SavingGoalMilestone（fill→burst→banner 3フェーズ、紙吹雪+spring文字）</li></ul> |
| **Phase 6**<br>冒険ショップ<br>（v0.20.0 / v0.26.0 / v0.27.0） | <ul><li>InvestScreen → 「冒険ショップ」リネーム、お宝の売買体験</li><li>22銘柄(ソニー/ユニクロ/サンリオ/オリエンタルランド/MSFT/GOOGL/AMZN/MCD 等)</li><li>用語子供語化: 「投資」→「お金の冒険」、「投資する」→「冒険する」、「投資家」→「冒険者」</li><li>100コロから冒険可能、冒険したいお宝のラインナップ表示</li></ul> |
| **Phase 7**<br>AIチャット（コインくん）<br>（v0.27.0） | <ul><li>CoinKunChat（金融教育向けAIキャラクター対話UI）</li></ul> |
| **Phase 8**<br>管理者画面 + ストア公開準備<br>（v0.14.0 / v0.25.0） | <ul><li>AdminScreen（全家族/ユーザー一覧、なりすましテストログイン、ウォレットリセット、ユーザー/家族削除）</li><li>admin用RLSポリシー7テーブル追加、<code>otetsudai_is_admin()</code> SECURITY DEFINER化</li><li>TestFlight配布（Bundle ID: <code>com.tk20260401.otetsudaiquest</code>）</li><li>App Store Connect登録（「Job Saga - マネー冒険」、外部テスト Beta App Review 審査済み）</li></ul> |
| **デザインリニューアル**<br>（Phase 1-3 完了） | <ul><li>Phase 1: 全画面ルビ（振り仮名）対応。Alert.alertをカスタムモーダル+AutoRubyTextに置換</li><li>Phase 2: CUD（カラーユニバーサルデザイン）準拠パレット3案設計。朱赤/青/青緑ウォレット色統一</li><li>Phase 3: テーマシステム（ThemeProvider+useTheme）。3パレット（そよかぜ/やさしい森/わくわく冒険）切替対応</li></ul> |
| **UI/UX/CX**<br>ブラッシュアップ | <ul><li>タッチターゲット48pt+、AnimatedButton（スケール+haptics）</li><li>アクセシビリティ（accessibilityLabel/Role 全画面付与）</li><li>useReducedMotion（OS 設定連動アニメーション制御）</li><li>BadgeUnlockModal（バッジ獲得演出）</li><li>クエストクリア確認ダイアログ</li><li>全画面ローディング演出、タブアイコン、空状態カード改善</li><li>宝箱「ショップ」ショートカット、装備カウント表示、金額読み上げ対応</li><li>ウェルカムボーナス（初回100円付与）</li><li>週次サマリーカード（クエスト完了数・稼いだ金額）</li><li>連続ストリーク🔥表示（連続クエスト日数）</li><li>テーマ切替UI（ヘッダー3色ボタン、AsyncStorage永続化）</li><li>ログインエラー表示改善（カード形式）</li></ul> |

## TestFlight配布

- Bundle ID: `com.tk20260401.otetsudaiquest`
- App Store Connect: 「Job Saga - マネー冒険」
- EAS Build → Transporter → TestFlightの手動フロー
- 内部テスト即利用可、外部テストBeta App Review審査済み

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v0.9.8 | 2026-04-15 | Web版ルビ修正、親画面ルビ除去、ヘッダー1行化 |
| v0.9.9 | 2026-04-15 | ウェルカムボーナス100円、週次サマリー、ルビ間隔修正 |
| v0.10.0 | 2026-04-15 | テーマ切替UI（3パレット: そよかぜ/やさしい森/わくわく冒険） |
| v0.10.1 | 2026-04-15 | ストリーク🔥、親サマリー、ログインエラー改善 |
| v0.10.2 | 2026-04-15 | Web版親サマリー、励ましメッセージ拡充、ランディング訴求、フッター・日付表示 |
| v1.0.0 (1) | 2026-04-15 | 初回EASビルド |
| v1.0.0 (3) | 2026-04-15 | ルビ配置修正、ランディング画面レスポンシブ |
| v1.0.0 (4) | 2026-04-15 | 環境変数修正（ホワイト画面解消）、ルビ間隔密着化 |
| v0.10.3 | 2026-04-16 | デザイン一貫性改善<ul><li>dead code削除、テーマボタンをパレット参照+タッチターゲット拡大</li><li>オーバーレイ/入力フィールド/ボタン/fontWeight統一</li><li>親カードシャドウ追加、インラインスタイルStyleSheet移行</li></ul> |
| v0.10.4 | 2026-04-16 | ルビ根本修正・親画面ルビ全解除<ul><li>tightStyle密着、ヘッダー重なり修正、セリフ改行修正</li><li>ランディングアイコン変更（💴/🧑）、親画面テキスト漢字化</li></ul> |
| v0.11.0 | 2026-04-16 | reducedMotion対応・スキルツリーUI・じぶんクエスト提案機能（子→親） |
| v0.12.0 | 2026-04-16 | TestFlightフィードバック#1対応<ul><li>貯金目標バリデーション、useFocusEffectでフリーズ修正</li><li>カレンダーspinner化、期限なし解除修正</li><li>投資画面(InvestScreen)新規、WalletDetail投資ボタン追加</li></ul> |
| v0.12.1 | 2026-04-16 | ルビ距離修正・辞書追加<ul><li>iOS marginTop:-2、辞書（東京/日本/有名/銀行/電車/携帯電話/飛行機/検索 等）</li><li>DB description_kids漢字化、💰→🪙統一、画面縦固定</li></ul> |
| v0.12.2 | 2026-04-16 | ログイン画面・ランディング改善<ul><li>おや/こどもモード選択、新規アカウント作成、「クエストをはじめる！」文言</li><li>親フォームアイコン統一、誰にプルダウン化、報酬直接編集、AppAlertプレーンText化</li></ul> |
| v0.12.3 | 2026-04-17 | 家族管理（削除機能・RLS）<ul><li>削除機能追加、RLSポリシー追加(admin SELECT/DELETE)</li><li>辞書「下→した」削除（誤変換防止）</li><li>バッジラベル漢字化（初めて/3日連続/1000円達成/貯金マスター）</li></ul> |
| v0.13.0 | 2026-04-17 | Sprint 3完了<ul><li>ファミリースタンプリレー（親⇔子・兄弟間エール送信、DB: otetsudai_family_messages）</li><li>ふやすの木（invest_balance連動SVG成長: たね→ふたば→わかぎ→たいぼく）</li><li>RLSセキュリティ修正（4テーブル有効化）</li></ul> |
| v0.14.0 | 2026-04-17 | Sprint 4完了<ul><li>保護者向け月次レポート（クエスト数/稼ぎ/ストリーク/レベル変化/貯金達成）</li><li>ファミリーダッシュボード（冒険の地図: メンバーLv表示+家族統計）</li><li>家族チャレンジウィーク（協力型週間目標、DB: otetsudai_family_challenges）</li></ul> |
| v0.14.0 (5) | 2026-04-17 | TestFlight v2配信。Sprint 3-4全機能＋ログイン改善＋家族管理＋未使用コード削除 |
| v0.14.1 | 2026-04-17 | ログイン/家族管理大幅改善<ul><li>ログイン後→家族管理画面（ダッシュボード/メンバー管理選択）</li><li>セッション記憶、PIN bcryptハッシュ保存、パスワード表示トグル+リセット</li><li>家族owner_auth_id紐付け（なりすまし防止）</li><li>子供の名前/PIN/アイコン編集・削除UI</li><li>親画面ひらがな→漢字統一、独立リポジトリ作成</li></ul> |
| v0.15.0 | 2026-04-17 | Habitica風ピクセルアートSVG導入<ul><li>PixelHeroSvg（戦士・魔法使い）＋PixelIcons 38種で全画面SVG置換</li><li>適用: ランディング/ログイン/子・親ダッシュ/ウォレット/投資/月次レポート/冒険の地図/家族チャレンジ/スタンプ送信/返信モーダル/貯金目標</li></ul> |
| v0.16.0 | 2026-04-18 | RPG演出強化<ul><li>LevelUpModal/BadgeUnlockModalのSVG化（ピクセルスパークル・メダルフレーム・RPGバナー）</li><li>FamilyChallengeCardにボスモンスターSVG</li><li>FamilyAdventureMapにワールドマップ背景、クエストクリアバナーRPG化</li></ul> |
| v0.17.0 | 2026-04-18 | Habitica風リッチRPG SVG 8機能<ul><li>アイテムSVG/QuestCardFrame(bronze/silver/gold)</li><li>HP・MP・EXPゲージ、装備ステータス(ATK/DEF/LCK)</li><li>宝箱演出/バトルシーン+小モンスター4種/報酬シーケンス/ダンジョンマップ</li></ul> |
| v0.18.0 | 2026-04-18 | Habitica風ペットシステム<ul><li>クエスト20%で卵ドロップ→3クエストで孵化→餌やり成長(baby→child→adult)</li><li>6種×4段階ピクセルアート、幸福度3日減衰、アクティブ切替</li><li>DB: otetsudai_pets</li></ul> |
| v0.19.0 | 2026-04-18 | ダンジョンテーマ全面移行<ul><li>テーマ: ダークパープル(#1f0f31)+ゴールド(#ffa623)、RpgCard/RpgButton/GameStatusHeader新設</li><li>優先度C全実装: PetManagementModal、TrophyCaseModal、DailyLoginModal（7日サイクル5〜50円）、ShopModal（称号8種）</li><li>親画面SVG枠化: 全カードをQuestCardFrameで統一</li><li>絵文字→SVG大規模置換: PixelIcons 22種追加、TaskIconSvg新設、モーダルヘッダーSVG化</li><li>ChildCharacterSvg 3択刷新: 男の子/女の子/どちらでもない（6x8ピクセル、Habitica方針）</li><li>認証・ナビ改善: 親口座非表示、起動時セッション自動ログイン廃止、🏠TOPボタン追加</li><li>DB migration 3本: otetsudai_pets/daily_logins/shop_purchases</li></ul> |
| v0.19.1 | 2026-04-19 | ダークモード視認性改善（WCAG AA準拠）<ul><li>dungeonパレット bg #1a0f2e / surface #2a1a3e / border #4a3a5e へ校正</li><li>text階層を3階層化（textStrong 15.2:1 / textBase 7.8:1 / textMuted 4.8:1）</li><li>textPlaceholder #8a7aa8 新設（surface比3.6:1）</li><li>全TextInput 25箇所に placeholderTextColor 統一適用</li><li>UX監査ドキュメント otetsudai-bank/docs/ux-audit-01.md 新規作成（30件）</li></ul> |
| v0.20.0 | 2026-04-19 | 大規模 UX/a11y 改善バッチ<ul><li>漢字+ルビ全面展開: RubyText noWrap prop、RubyPlaceholderInput 新設</li><li>スタンプ SVG 化: StampSvg.tsx、22 ID を PixelIcon にマッピング</li><li>漢字視認性根本修正: QuestCardFrame.content/p.white→p.surface 一括置換</li><li>固定 Quick Nav 3ボタン: 子ダッシュ最上部に🛒/🐷/📈 CTA（88px）</li><li>投資画面強化: 初回自動オープン、ボタン視認性改善（緑地 3:1→7:1）</li><li>銘柄拡充: 14→22銘柄（ソニー/ユニクロ/サンリオ/オリエンタルランド/MSFT/GOOGL/AMZN/MCD）</li><li>SVG a11y: PixelIcons 64種に個別日本語alt付与</li><li>アニメ基盤: src/components/animations/ 新設、CoinBurstAnimation/LevelUpBurst 実装</li><li>監査ドキュメント計2本配置</li></ul> |
| v0.21.0 | 2026-04-20 | SVGアニメーション全面導入＋残アニメ4点完了<ul><li>共通基盤: IdleAnimationWrapper（8種: bob/breathe/sway/bounce/flutter/pulse/spin/flicker）、WalletBalanceAnimation</li><li>W1 ウォレット残高: GameStatusHeader のカウントアップ＋シマー</li><li>P1 ペットアイドル: stage別アニメ、happiness&lt;30で速度半減</li><li>E1 卵孵化演出: crackフェーズ、6破片バースト、spring reveal</li><li>W2 貯金目標達成: SavingGoalMilestone（fill→burst→banner）</li><li>全9モバイルSVGコンポーネントに animated prop 追加</li></ul> |
| v0.22.0 | 2026-04-20 | ビジュアライゼーション強化＋UI/UXアクセシビリティ改善<ul><li>歩行アニメ: WalkAnimationWrapper（mode="walk" + legOffset脚分離）</li><li>マイクロインタラクション: TapFeedback（press 0.95→release 1.0 spring）</li><li>背景アンビエント: BackgroundAmbient（dungeon=トーチflicker+星pulse / outdoor=雲sway+木breathe / home=蝶flutter）</li><li>達成フィードバック三段階: キャラジャンプ、CelebrationBurst（紙吹雪12粒）</li><li>新規演出: CoinSplitAnimation/EggShake/ShakeView</li><li>ルビ・アクセシビリティ: palette.rubyColor 追加（4パレット WCAG AA 4.5:1以上）</li><li>UI統一: 戻るボタンデザイン統一、漢字化、placeholder漢字+ルビラベル化</li></ul> |
| v0.22.0 (9) | 2026-04-20 | 家族管理改善＋UI/UX品質向上<ul><li>家族管理画面: 全ひらがな→漢字化、戻るボタン金色枠線統一、親メンバー非表示</li><li>ChildCharacterSvg直接Animated実装: IdleAnimationWrapper依存排除</li><li>SkillTreeバッジSVG化: 5バッジSVG置換、獲得済みのみアニメーション</li><li>DailyLoginModal/SavingGoalModal漢字+ルビ化: placeholder ふりがな付き</li><li>WalletDetail 3カードタップ遷移: 使う/貯める/増やす</li><li>ピンチズーム全画面対応: minimumZoomScale=1 / maximumZoomScale=3</li><li>PIN入力改善: 4桁入力時自動ログイン、キーボード閉じるボタン</li><li>ルビ距離調整: rubyGap 関数導入（marginTop:-2 統一）</li></ul> |
| v0.23.0 | 2026-04-22 | 子供主体オンボーディング＋RLSセキュリティ強化＋Edge Function導入<ul><li>DBスキーマ移行: auth_id/backup_words/is_anonymous/registered_at 等追加</li><li>RLS完全刷新: 旧 USING(true) 排除、auth.uid() ベースの family_id フィルタに移行</li><li>Edge Function 5本デプロイ: create-child-account / join-family / join-family-by-words / recover-account / verify-pin</li><li>オンボーディング画面: Welcome / Nickname / PinSetup（2段階確認+shake）/ BackupWords</li><li>auth.ts 全面書き換え: signInAnonymously / createChildAccount 等</li><li>Web版同期: API ルート 5 ファイルの SERVICE_ROLE_KEY フォールバック削除</li></ul> |
| v0.24.0 | 2026-04-22 | ジョブサガ（Job Saga）リブランド＋章立てシステム＋親招待画面<ul><li>リブランド: 「おこづかいクエスト」→「ジョブサガ」、TOP は英語「Job Saga」、© 2026 Snafty inc.</li><li>LandingScreen B案: 金「はじめてのひと」+銀「つづきから」の 2 分離</li><li>InviteParentScreen 新規: あいことば+QR コード+テンプレ 3 トーン+OS シェアシート</li><li>「ふやす」ロック画面: has_parent=false 時に半透明モーダル</li><li>7日後ナッジ: 作成 7 日後・親未参加時のみポップアップ</li><li>DB: otetsudai_chapters（4 章マスタ）+ otetsudai_chapter_unlocks 新規</li></ul> |
| v0.25.0 | 2026-04-22 | Edge Function SHA-256 移行＋Admin 画面＋復旧画面＋漢字ルビ全面化<ul><li>Edge Function: bcrypt → SHA-256（Worker is not defined 対策）、verify_jwt=false 再デプロイ</li><li>AdminScreen 新規: 全家族/ユーザー一覧、なりすましテストログイン、ウォレットリセット、削除</li><li>RecoverAccountScreen 新規: バックアップ合言葉 3 語入力＋新 PIN 設定</li><li>InviteParentScreen 改善: 共有ボタン 5 種、テンプレ 3 トーン、編集可能プレビュー</li><li>LoginScreen 改善: 子供モード家族選択スキップ、親ログイン→直接ダッシュボード</li><li>漢字＋ルビ全面化: オンボーディング全画面、LoginScreen、DailyLoginModal</li></ul> |
| v0.25.1 | 2026-04-24 | UI 一貫性改善＋親画面ルビ除去<ul><li>Lv.1 greeting「冒険、始めるよ！」→「冒険者の強さ」にステータス見出し化</li><li>セリフ括弧「」→【】に変更</li><li>ParentDashboardScreen の全 RubyText/AutoRubyText をプレーン Text に置換</li></ul> |
| v0.26.0 | 2026-04-24 | 冒険世界観全面統一＋UI 品質向上<ul><li>通貨: 円→コロに全面置換</li><li>宝箱画面（旧お財布）: 「お財布→宝箱」、ポケットカード「稼ぐ/使う/貯める/増やす→クエスト/ショップ/ストック/冒険」</li><li>冒険ショップ（旧投資）: 「いくら投資する→いくら冒険する」、「100 円→100 コロ」</li><li>お宝マップモーダル（旧貯金目標）: 「貯金目標を作る→お宝マップを作る」、「金額→コイン」、「やめる→撤退」</li><li>戻るボタン統一: 全画面「ギルドに戻る」+PixelHouseIcon、ベースライン揃え</li><li>クエストカード 1 行表示: fontSize 13＋noWrap</li><li>DB: 山田家サンプルクエスト名をカイロソフト風に更新</li></ul> |
| v0.26.1 | 2026-04-24 | 宝箱画面 UI 調整<ul><li>「買いたい！」「使いたい！」→「オーダー！」に統一</li><li>冒険ログフィルタータブ「全部・クエスト・ショップ・ストック・冒険」表記統一</li></ul> |
| v0.27.0 | 2026-04-27 | 子供向け直感 UI 改善＋自動ログアウト復活＋漢字+ルビ全面化<ul><li>旧用語「ギルド」全排除: 「ギルドに戻る」→「← 戻る」+PixelHouseIcon</li><li>漢字+ルビ全面化（10 画面以上）: ShopModal/SpendRequest/PetModal/ParentDashboard/PresetQuestModal 等</li><li>Ruby 辞書 19 語追加: 購入/称号/図鑑/卵/孵/幸/匹/赤/残/許可/台所/磨/覚/保/詳/進化/上手/閉</li><li>InvestScreen 子供語化: 「投資」→「お金の冒険」、「投資する」→「冒険する」、「投資家」→「冒険者」</li><li>ChildDashboard アイコン補強: クエスト/冒険ログタブに Pixel アイコン追加</li><li>ボタン補助テキスト追加: PetModal/ShopModal/WalletDetail</li><li>自動ログアウト全画面リセット: onStartShouldSetResponderCapture でタッチ検知（30 分無操作タイマー）</li></ul> |
| v0.27.1 | 2026-04-27 | 視覚的ノイズ排除・ボーダー統一<ul><li>全画面のカード/行/モーダルから backgroundColor・shadow・elevation 一括削除</li><li>borderWidth:1.5・borderColor:palette.border に統一</li><li>対象: 12 コンポーネント</li><li>FamilyChallengeCard メンバーアイコン絵文字→CharacterSvg 化</li></ul> |
| v0.27.2 | 2026-04-27 | dungeon→forest テーマ切替（ダーク→ライトをデフォルト化）<ul><li>意図 (1) WCAG コントラスト: dungeon の border #4a3a5e は surface #2a1a3e 比 1.8:1 で AA 未達</li><li>意図 (2) 子供向けの認知負荷: 暗い紫背景は不安/疲労を誘発しやすい</li><li>意図 (3) 金融教育メタファーとの整合: 通帳・銀行・紙幣は紙白イメージ</li><li>意図 (4) ハイコントラスト機能との役割分離: monochrome トグルで grayscale 強化が可能</li><li>ラベル変更: TOP「白黒 ON/OFF」→「ハイコントラスト ON/OFF」</li><li>ボーダー第 A 段: ハードコード HEX → palette トークン置換 3 件</li></ul> |

## Web版との関係

- **バックエンド共用**: 同一の Supabase プロジェクト（同じDB・RLSポリシー）
- **型定義共用**: `lib/types.ts` はWeb版と同一の型定義
- **ビジネスロジック移植**: バッジ判定、レベル計算、スタンプ定義等はWeb版から移植
- **デザイン方針**: Web版のUIをネイティブUI向けに軽量化。アニメーション控えめ、フリーズ防止優先

## ストア公開

App Store / Google Play への公開を予定。現在は Expo Go での動作確認フェーズ。
