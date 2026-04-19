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
│   │   ├── LandingScreen.tsx    # ランディング画面（ログインボタン+機能紹介）
│   │   ├── LoginScreen.tsx      # ログイン（家族選択→メンバー選択→PIN認証）
│   │   ├── ChildDashboardScreen.tsx  # 子どもダッシュボード
│   │   ├── ParentDashboardScreen.tsx # 親ダッシュボード
│   │   ├── WalletDetailScreen.tsx    # ウォレット詳細
│   │   ├── SpendRequestScreen.tsx    # つかうリクエスト
│   │   └── InvestScreen.tsx         # 投資画面（株の売買）
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

### デザインリニューアル（Phase 1-3完了）
- **Phase 1**: 全画面ルビ（振り仮名）対応。Alert.alertをカスタムモーダル+AutoRubyTextに置換
- **Phase 2**: CUD（カラーユニバーサルデザイン）準拠パレット3案設計。朱赤/青/青緑ウォレット色統一
- **Phase 3**: テーマシステム（ThemeProvider+useTheme）。3パレット（そよかぜ/やさしい森/わくわく冒険）切替対応

### UI/UX/CXブラッシュアップ
- タッチターゲット48pt+、AnimatedButton（スケール+haptics）
- アクセシビリティ（accessibilityLabel/Role全画面付与）
- useReducedMotion（OS設定連動アニメーション制御）
- BadgeUnlockModal（バッジ獲得演出）
- クエストクリア確認ダイアログ
- 全画面ローディング演出、タブアイコン、空状態カード改善
- ウォレット「💸つかう」ショートカット、装備カウント表示、金額読み上げ対応
- ウェルカムボーナス（初回100円付与）
- 週次サマリーカード（クエスト完了数・稼いだ金額）
- 連続ストリーク🔥表示（連続クエスト日数）
- テーマ切替UI（ヘッダー3色ボタン、AsyncStorage永続化）
- ログインエラー表示改善（カード形式）

## TestFlight配布

- Bundle ID: `com.tk20260401.otetsudaiquest`
- App Store Connect: 「おこづかいクエスト - マネー冒険」
- EAS Build → Transporter → TestFlightの手動フロー
- 内部テスト即利用可、外部テストBeta App Review審査済み

## 未実装（Phase 4〜8 予定）

| Phase | 内容 |
|-------|------|
| Phase 4 | ウォレット詳細 + つかうリクエスト |
| Phase 5 | ちょきん目標 + バッジ・レベル詳細 |
| Phase 6 | 投資シミュレーション |
| Phase 7 | AIチャット（コインくん） |
| Phase 8 | 管理者画面 + ストア公開準備 |

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v1.0.0 (1) | 2026-04-15 | 初回EASビルド |
| v1.0.0 (3) | 2026-04-15 | ルビ配置修正、ランディング画面レスポンシブ |
| v1.0.0 (4) | 2026-04-15 | 環境変数修正（ホワイト画面解消）、ルビ間隔密着化 |
| v0.14.0 (5) | 2026-04-17 | TestFlight v2配信。Sprint 3-4全機能＋ログイン改善＋家族管理＋未使用コード削除 |
| v0.9.8 | 2026-04-15 | Web版ルビ修正、親画面ルビ除去、ヘッダー1行化 |
| v0.9.9 | 2026-04-15 | ウェルカムボーナス100円、週次サマリー、ルビ間隔修正 |
| v0.10.0 | 2026-04-15 | テーマ切替UI（3パレット: そよかぜ/やさしい森/わくわく冒険） |
| v0.10.1 | 2026-04-15 | ストリーク🔥、親サマリー、ログインエラー改善 |
| v0.10.2 | 2026-04-15 | Web版親サマリー、励ましメッセージ拡充、ランディング訴求追加、フッター追加、日付表示 |
| v0.10.3 | 2026-04-16 | デザイン一貫性改善: dead code削除、テーマボタンをパレット参照+タッチターゲット拡大、オーバーレイ/入力フィールド/ボタン/fontWeight統一、親カードシャドウ追加、インラインスタイルStyleSheet移行 |
| v0.10.4 | 2026-04-16 | ルビ根本修正（tightStyle密着）、親画面ルビ全解除、ヘッダー重なり修正、セリフ改行修正、ランディングアイコン変更（💴/🧑）、親画面テキスト漢字化 |
| v0.11.0 | 2026-04-16 | reducedMotion対応（LevelUpModal/BadgeUnlockModal）、スキルツリーUI、じぶんクエスト提案機能（子→親） |
| v0.12.0 | 2026-04-16 | TestFlightフィードバック#1対応: 貯金目標バリデーション、useFocusEffectでフリーズ修正、カレンダーspinner化、期限なし解除修正、投資画面(InvestScreen)新規追加、WalletDetail投資ボタン追加 |
| v0.12.1 | 2026-04-16 | ルビ距離修正(iOS: marginTop:-2)、辞書追加(東京/日本/有名/多/運営/音楽/一番/銀行/電車/携帯電話/飛行機/検索等)、DB description_kids漢字化、💰→🪙統一、画面縦固定 |
| v0.12.2 | 2026-04-16 | ログイン画面: おや/こどもモード選択、新規アカウント作成、「クエストをはじめる！」文言、ランディング説明文改善、親フォームアイコン統一、誰にプルダウン化、報酬直接編集、AppAlertプレーンText化 |
| v0.12.3 | 2026-04-17 | 家族管理: 削除機能追加、RLSポリシー追加(admin SELECT/DELETE)、辞書「下→した」削除(誤変換防止)、バッジラベル漢字化(初めて/3日連続/1000円達成/貯金マスター) |
| v0.13.0 | 2026-04-17 | Sprint 3完了。ファミリースタンプリレー（親⇔子・兄弟間エール送信、パーティチャット風UI、DB: otetsudai_family_messages）、ふやすの木（invest_balanceに応じたSVG木成長メタファー: たね→ふたば→わかぎ→たいぼく）。Web版同時対応。RLSセキュリティ修正（4テーブル有効化） |
| v0.14.0 | 2026-04-17 | Sprint 4完了。保護者向け月次レポート（クエスト数/稼ぎ/ストリーク/レベル変化/貯金達成/自動コメント）、ファミリーダッシュボード（冒険の地図: メンバーLv表示+家族統計）、家族チャレンジウィーク（協力型週間目標: メンバー進捗バー+達成ボーナス、DB: otetsudai_family_challenges）。Web版同時対応 |
| v0.14.1 | 2026-04-17 | ログイン/家族管理大幅改善。ログイン後→家族管理画面（ダッシュボード/メンバー管理選択）、セッション記憶（次回自動ログイン）、PIN bcryptハッシュ保存、パスワード表示トグル+リセット機能、家族owner_auth_id紐付け（なりすまし防止）、子供の名前/PIN/アイコン編集・削除UI、親画面ひらがな→漢字統一、キーボード対応改善、独立リポジトリ作成 |
| v0.15.0 | 2026-04-17 | Habitica風ピクセルアートSVG導入。PixelHeroSvg（戦士・魔法使い）＋PixelIcons（38種）で全画面の絵文字アイコンをドット絵SVGに置換。ランディング/ログイン/子ダッシュ/親ダッシュ/ウォレット/投資/月次レポート/冒険の地図/家族チャレンジ/スタンプ送信/返信モーダル/貯金目標。Web版同時対応 |
| v0.16.0 | 2026-04-18 | RPG演出強化。LevelUpModal/BadgeUnlockModalのSVG化（ピクセルスパークル・メダルフレーム・RPGバナー）、FamilyChallengeCardにボスモンスターSVG、FamilyAdventureMapにワールドマップ背景、クエストクリアバナーRPG化 |
| v0.17.0 | 2026-04-18 | Habitica風リッチRPG SVG 8機能。アイテムSVG/QuestCardFrame(bronze/silver/gold)/HP・MP・EXPゲージ/装備ステータス(ATK/DEF/LCK)/宝箱演出/バトルシーン+小モンスター4種/報酬シーケンス/ダンジョンマップ。rpg-stats.ts |
| v0.18.0 | 2026-04-18 | Habitica風ペットシステム。クエスト20%で卵ドロップ→3クエストで孵化→餌やり成長(baby→child→adult)。6種×4段階ピクセルアート。幸福度3日減衰、アクティブ切替、卵ドロップ演出。DB: otetsudai_pets |
| v0.19.0 | 2026-04-18 | **ダンジョンテーマ全面移行**: ダークパープル(#1f0f31)+ゴールド(#ffa623)、RpgCard/RpgButton/GameStatusHeader新設、全画面p.whiteをp.surface化。**優先度C全実装**: PetManagementModal(名前・アクティブ切替)、TrophyCaseModal(バッジ一覧・シルエット・獲得日時)、DailyLoginModal(7日サイクル5〜50円・自動起動)、ShopModal(称号8種・装備表示・キャラ横バッジ)。**親画面SVG枠化**: クエスト/承認/値上げ/提案/最近承認の全カードをQuestCardFrameで統一。**絵文字→SVG大規模置換**: PixelIcons 22種新規追加(犬/猫/風呂/皿/ほうき/ベッド/車/シャツ/靴/花/鍋/ランドセル/歯ブラシ/トロフィー/ショップ/肉球/洗濯/スポンジ/窓/トイレ/家族/リサイクル)、TaskIconSvg新設(タスク名→SVG自動マッピング)、Parent/Child Dashboardの🪙/🧒/✏️/⏳/📝を全PixelIcon化、モーダルヘッダー🎁🏆🏪🐾もSVG化。**ChildCharacterSvg 3択刷新**: 8種emoji picker→男の子/女の子/どちらでもない(6x8ピクセルアート、Habitica方針準拠)、DBキー保存(boy/girl/other)+legacy resolver。**認証・ナビ改善**: こどもモード「だれかな？」で親口座非表示(role=child filter・PIN試行事故防止)、起動時セッション自動ログイン廃止(QR起動時も必ずLanding)、GameStatusHeaderに「🏠TOP」戻るボタン追加(枠線付き視認性UP)。**インフラ**: DB migration 3本実行済(otetsudai_pets/daily_logins/shop_purchases)、app.json version未更新のためTestFlight配信は次セッション |
| v0.19.1 | 2026-04-19 | **ダークモード視認性改善（WCAG AA準拠）**: dungeonパレットのbg #1a0f2e / surface #2a1a3e / border #4a3a5eへ校正、text階層をtextStrong #f5f0ff(15.2:1)・textBase #c8b8e0(7.8:1)・textMuted #9a88b8(4.8:1)で3階層化、プレースホルダー専用 `textPlaceholder` #8a7aa8（surface比3.6:1の透かしレンジ）をPalette型に新設。全TextInput 25箇所（LoginScreenの8・ChildDashboardの3・ParentDashboardの5・他12）に `placeholderTextColor={palette.textPlaceholder}` を統一適用、`styles.input`/`pinInput`に `color: p.textStrong` を補完し入力済みテキストが黒背景で不可視化する事故を予防。UX監査ドキュメント otetsudai-bank/docs/ux-audit-01.md を新規作成（情報デザイン4原則/画面設計/UX 5段階/コード設計 の4軸で計30件をfile:line付きで列挙） |
| v0.21.0 | 2026-04-20 | **SVGアニメーション全面導入＋残アニメ4点完了**。**共通基盤**: IdleAnimationWrapper(RN Animated.loop 8種: bob/breathe/sway/bounce/flutter/pulse/spin/flicker)＋WalletBalanceAnimation(数値カウントアップ+ゴールドシマー)を新設、useReducedMotion完全対応。**W1 ウォレット残高アニメ**: GameStatusHeaderのゴールド表示をWalletBalanceAnimationに置換、残高変動時にカウントアップ＋シマー。**P1 ペットアイドルアニメ**: PetSvgにstage別アニメ(egg=pulse/baby=bounce/child=bob/adult=breathe)、happiness<30で速度半減。**E1 卵孵化演出強化**: EggDropAnimationにcrackフェーズ追加(振動→6破片バースト→ペットSVG spring reveal)、テキストを「{ペット名}が うまれた！」に変更。**W2 貯金目標達成アニメ**: SavingGoalMilestone新設(fill→burst→banner 3フェーズ、紙吹雪＋spring文字)。**SVGアイドルアニメ全適用**: PixelMonsterSvg(slime=bob/bat=flutter/goblin=sway/mushroom=breathe)、CharacterSvg/ChildCharacterSvg(sway)、PixelIcons 5種(coin=spin/flame=flicker/star=pulse/hourglass=spin/confetti=flutter)、PixelItemIcons 6種(コイン=spin/宝石=pulse)、MoneyTree(breathe)。全9モバイルSVGコンポーネントにanimated propを追加。Web版同時対応 |
| v0.20.0 | 2026-04-19 | **大規模 UX/a11y 改善バッチ**。**漢字+ルビ全面展開**: 子画面・値上げリクエスト・自分クエスト提案モーダル等で hiragana→漢字+ルビ 変換、`RubyText noWrap` prop で 1行強制＋adjustsFontSizeToFit 自動縮小、`RubyPlaceholderInput` 新設で TextInput placeholder にも漢字+ルビをオーバーレイ表示可能化。**スタンプ SVG 化**: `StampSvg.tsx` 新設、親エール/承認/子返信 計22 IDを既存 PixelIcon にマッピング、4表示箇所を emoji→SVG 置換。**漢字視認性根本修正**: `QuestCardFrame.content` 白ハードコードを `palette.surface` に、`ChildDashboard` 他 9 箇所の `p.white`→`p.surface` 一括置換。**固定 Quick Nav 3ボタン**: 子ダッシュ最上部に大サイズ（88px min-height）の 🛒買いもの/🐷貯金/📈株 CTA を配置、飽和色＋白ボーダー＋影で即認知。**投資画面強化**: InvestScreen 初回自動オープン、戻るボタンをゴールド primaryLight 太枠化、「株を買いたい！」ボタンを白→黒文字（緑地 3:1→7:1）＋accent太枠＋強い影で視認性改善、SafeAreaView edges 明示。**銘柄拡充**: `20260419_stock_prices_v3.sql` 新規作成で +8 銘柄（ソニー/ユニクロ/サンリオ/オリエンタルランド/MSFT/GOOGL/AMZN/MCD）、14→22 銘柄に。**SVG a11y**: `PixelGrid` に `label` prop 追加、PixelIcons 64 種に個別日本語 alt（コイン/犬/花/本等）付与、VoiceOver/TalkBack 対応。**アニメ基盤**: `src/components/animations/` 新設、Q1 `CoinBurstAnimation`（クエスト完了時 12枚コイン放射状burst）と L1 `LevelUpBurst`（3層 radial ring + LEVEL UP! spring bounce + 白フラッシュ）を実装、RN 標準 Animated API + `AccessibilityInfo.isReduceMotionEnabled()` 尊重。**その他**: GameStatusHeader「TOP」→「もどる」統一、家族チャレンジランダムタイトル漢字化、Ruby.tsx に baseColor fallback（漢字色沈み予防）、ローディング「よみこみちゅう」等を漢字+ルビ化、`shapeRendering` prop（react-native-svg 非対応）削除で render error 修正。**監査**: UX監査・株カテゴリ監査ドキュメント計2本を `otetsudai-bank/docs/` に配置。備考: 銘柄拡充 SQL は Supabase ダッシュボード経由で別途反映必要、残アニメ4点（W1/P1/E1/W2）は remaining_tasks.md に記載、明日着手予定 |

## Web版との関係

- **バックエンド共用**: 同一の Supabase プロジェクト（同じDB・RLSポリシー）
- **型定義共用**: `lib/types.ts` はWeb版と同一の型定義
- **ビジネスロジック移植**: バッジ判定、レベル計算、スタンプ定義等はWeb版から移植
- **デザイン方針**: Web版のUIをネイティブUI向けに軽量化。アニメーション控えめ、フリーズ防止優先

## ストア公開

App Store / Google Play への公開を予定。現在は Expo Go での動作確認フェーズ。
