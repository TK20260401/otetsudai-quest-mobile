# Job Saga ブランドガイドライン

> モバイル版・Web版・ストア掲載・ロゴ制作・ドキュメント作成時に参照する公式ブランドガイドライン。
> 両版で表記・ビジュアルを統一するため、このファイルを**単一の情報源（Single Source of Truth）**とする。

最終更新: 2026-04-23

---

## 1. 正式名称

**Job Saga**（読み: ジョブサガ）

旧名: おこづかいクエスト（2026年の章立てシステム導入時にリブランド）

---

## 2. 表記ルール（用途別）

| 用途 | 表記 | 理由 |
|------|------|------|
| App Store / Google Play / 公式サイト / プレスリリース | `Job Saga` | 正式表記。英単語間スペースあり |
| アプリ内UI（子供向け画面） | `ジョブサガ` | カタカナがもっとも可読性が高い（未就学児〜小学生対応） |
| ロゴマーク / スプラッシュ | `JobSaga` または `JOBSAGA` | 一語結合で視認性・デザイン性を優先 |
| ファビコン / アプリアイコン（小サイズ） | `JS` | 極小スペース用の略称 |
| 英日併記が必要な場面 | `Job Saga（ジョブサガ）` | 初出時・公式ドキュメント冒頭 |
| ひらがな必須の最年少層向け画面 | `じょぶさが` | 未就学児の可読性確保（必要な画面に限定） |

---

## 3. 使用禁止表記

ブランド一貫性のため以下は使用しない。

- ~~`JOB SAGA`~~（全大文字スペースあり）→ ロゴ用途のみ `JOBSAGA` を使用
- ~~`JOB Saga`~~ / ~~`Job SAGA`~~ / ~~`job saga`~~ → 大小混在・全小文字は不可
- ~~`Job.Saga`~~ / ~~`job/saga`~~ / ~~`Job-Saga`~~ → 記号区切りは使用しない
- ~~`おこづかいクエスト`~~ 単独表記 → `（旧名: おこづかいクエスト）` の形でのみ併記可

---

## 4. タグライン候補

ロゴ下・メタ説明・ストア説明文で使用。

| 用途 | タグライン |
|------|-----------|
| メインコピー | こどもの、はじめての冒険 |
| 機能訴求型 | おしごとで、ものがたりを。 |
| オンボーディング | Chapter 1 から始めよう |
| 英語版メタ説明 | *a family quest* |

---

## 5. 章立てシステムとの表記連携

章立てUIやチュートリアル、プロモ素材で物語性を強調する場合:

- `Job Saga: Ch.1` — 章番号を添える表記
- `Job Saga ⅠⅡⅢ` — ローマ数字で物語感を強調
- `JobSaga∞` — 無限に続く物語を示すアイコン用表記

---

## 6. カラー / タイポグラフィ

### カラーパレット

3パレット体制（CUD／WCAG AA準拠）を採用。

- 定義ファイル（モバイル版）: `src/theme/palettes.ts`
- 定義ファイル（Web版）: `otetsudai-bank` の Tailwind 設定およびテーマ定義
- 詳細: Web版 README の「テーマカラー」セクションを参照

### タイポグラフィ

- 日本語: システムフォント（iOS: ヒラギノ角ゴ、Android: Noto Sans JP、Web: system-ui）
- 英数字: システムフォント準拠
- 子供向け画面では**全漢字にルビ必須**（`<Ruby />` コンポーネント使用）

---

## 7. ロゴアセット管理

- 保管場所: `assets/brand/`（モバイル版）、`public/brand/`（Web版）※ 未整備の場合は新規作成
- 推奨ファイル命名: `jobsaga-logo-{色バリエーション}-{サイズ}.{svg|png}`
  - 例: `jobsaga-logo-color-512.png`, `jobsaga-logo-mono-white.svg`
- 最小表示サイズ: 幅 64px 以上（これ未満では `JS` 略称アイコンに切替）

---

## 8. 適用チェックリスト

新機能追加・リリース前に以下を確認する。

- [ ] App Store Connect / Google Play Consoleの表示名は `Job Saga`
- [ ] アプリ内の見出し・タイトルは `ジョブサガ`
- [ ] ロゴSVG / PNGアセットは `JobSaga` 形式
- [ ] 旧名 `おこづかいクエスト` 単独表記が残っていないかgrepで全ファイル確認
- [ ] 英語版UI / メタタグは `Job Saga` で統一
- [ ] 子供向け画面では全漢字にルビが付いているか（`<Ruby />` 使用確認）

---

## 9. 参照

- Web版README: `../otetsudai-bank/README.md`
- モバイル版README: `./README.md`
- テーマ定義: `./src/theme/palettes.ts`
- ルビコンポーネント: `./src/components/Ruby.tsx`
- アクセシビリティ統括: `./src/accessibility/AccessibilityContext.tsx`

---

## 9.5 アクセシビリティ方針

### 3層設計

| 層 | 担当 | Job Sagaでの扱い |
|----|------|------------------|
| OS標準 | VoiceOver／TalkBack／Switch Control／ズーム／拡大鏡 | 委譲する。アプリ側は`accessibilityLabel`等の属性を正しく付与してサポート |
| アプリ独自 | 子供が自分で切替える一次アクセシビリティ | 3トグル実装（ルビ／白黒／フォントサイズ） |
| 属性サポート | `accessibilityLabel`／`accessibilityRole`／`accessibilityState`／`hitSlop` | 全TouchableOpacity／Pressableで付与を目指す |

### アプリ独自3トグル（右上フローティング）

| トグル | 値 | 実装参照 | 備考 |
|--------|-----|----------|------|
| ルビ | ON／OFF | `useAccessibility().rubyVisible` | 独自機能。OS非対応のため必須 |
| 白黒モード | ON／OFF | `useAccessibility().monochrome` | paletteを輝度保持グレースケール化（`toGrayscalePalette`） |
| 文字サイズ | 小（0.9）／中（1.0）／大（1.2）／特大（1.4） | `useAccessibility().fontScale`および`fontScaleValue` | Ruby系コンポーネントおよび`useScaledFont()`経由の箇所に適用 |

設定は`AsyncStorage`キー`accessibility_settings`にJSON形式で永続化。
旧キー`ruby_visible`は起動時に自動移行。

### Dynamic Type連携

`applyGlobalTextScaling()`を起動時に1回呼び、全`Text`／`TextInput`の
デフォルトに`allowFontScaling: true`と`maxFontSizeMultiplier: 1.3`を適用。
OSのフォントサイズ設定とアプリのfontScaleは乗算的に重なるが、OS側×アプリ側の
上限は1.3でクリップしレイアウト崩れを抑止する。

### タッチターゲット

- 最小44pt×44pt（iOS HIG／WCAG 2.5.5 Level AAA準拠）
- `hitSlop`で見た目を変えずに当たり判定を拡大

### ルール（必須）

1. 全テキストは漢字＋ルビ必須。平仮名だけのテキストは禁止（低学年に読める最低品質ライン）
2. 色だけで意味を伝えない。白黒モードで破綻しないよう、常にアイコン／ラベル／位置を併用
3. ダークモード×白黒×特大の3同時ONでもレイアウトを維持

### フォローアップ（未完了の監査項目）

以下の画面・コンポーネントは`accessibilityLabel`が未整備。今後のブラッシュアップで対応する。

- `src/screens/AdminScreen.tsx`（管理者画面。社内向けのため優先度低）
- `src/screens/onboarding/*.tsx`（オンボーディング系）
- `src/components/EggDropAnimation.tsx`（装飾アニメーション）
- `src/components/TapFeedback.tsx`（タップエフェクト。装飾のためlabel不要の可能性）
- `src/components/CoinKunChat.tsx`（一部ボタン未対応）
- `src/components/RewardSequence.tsx`（アニメーション画面）

---

## 10. 用語集（Glossary）

子ども向け画面とデータ生成では「冒険団」表記に統一。
法的文書・管理者画面は「家族」を維持。

| 概念 | 子ども/親UI表記 | 管理者/法的表記 | 備考 |
|------|-----------------|-----------------|------|
| 家族グループ | 冒険団（ぼうけんだん） | 家族 | DB上のカラム名は `otetsudai_families` のまま |
| 親（保護者） | 冒険団マスター | 親 | 子ども向けUI全体で統一 |
| 家族メンバー | 冒険団メンバー | 家族メンバー | |
| 家族チャレンジ | 冒険団チャレンジ | 家族チャレンジ | 機能名 |
| 自動生成名 | `${nickname}の冒険団` | 同左 | create-child-account Edge Function |

---

## 11. 更新履歴

| 日付 | 変更内容 |
|------|---------|
| 2026-04-23 | 初版作成。表記ルール・禁止表記・タグライン・チェックリストを整備 |
| 2026-04-23 | 用語集追加。家族→冒険団リブランド反映 |
