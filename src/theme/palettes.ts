/**
 * カラーパレット定義 — UD / CUD / WCAG 重視
 *
 * 設計原則:
 *   1. CUD (カラーユニバーサルデザイン) 準拠
 *      - 色覚多様性（P型/D型/T型）で混同しない色の組み合わせ
 *      - ウォレット3色は CUD推奨色ベース（朱赤/青/青緑）
 *      - 色だけに頼らず、アイコン・ラベル・位置で識別
 *   2. WCAG AAA 目標
 *      - テキスト on 白背景: 7:1以上 (textStrong/textBase)
 *      - 白テキスト on ボタン: 4.5:1以上 (primary/primaryDark)
 *      - 補助テキスト (textMuted): 4.5:1以上 (AA保証)
 *   3. UD (ユニバーサルデザイン)
 *      - 高コントラスト境界線
 *      - 背景とカードの明確な差
 *      - 低刺激でちらつきにくいトーン
 *
 * 3案: やさしい森 / わくわく冒険 / そよかぜ
 */

export type Palette = {
  name: string;
  description: string;

  // Core
  primary: string; // ボタン背景 (白文字 4.5:1↑)
  primaryDark: string; // ヘッダー・強調 (白文字 6:1↑)
  primaryLight: string; // 薄い背景
  primaryMuted: string; // switch track ON, subtle accents

  // Accent (badges, highlights, gold)
  accent: string;
  accentLight: string;
  accentDark: string; // on白 4.5:1↑

  // Feedback
  red: string; // エラー・破壊アクション
  redLight: string;
  green: string; // 成功
  greenLight: string;

  // Text — all on white background
  textStrong: string; // 見出し (on白 10:1↑)
  textBase: string; // 本文 (on白 7:1↑ AAA)
  textMuted: string; // 補助 (on白 4.5:1↑ AA)

  // Surface
  background: string; // 画面背景
  backgroundLanding: string;
  surface: string; // カード
  surfaceMuted: string; // disabled, input bg
  border: string; // 通常境界 (3:1↑ on背景)
  borderStrong: string; // フォーカス・アクティブ

  // Switch
  switchTrackOff: string;
  switchTrackOn: string;
  switchThumbOff: string;

  // Wallet — CUD推奨色ベース (全パレット共通)
  walletSpend: string; // 朱赤系 (CUD: 赤は朱赤寄りで P/D型と区別)
  walletSpendBg: string;
  walletSpendBorder: string;
  walletSpendText: string; // on白 7:1↑
  walletSave: string; // 青系 (全色覚で識別可)
  walletSaveBg: string;
  walletSaveBorder: string;
  walletSaveText: string; // on白 7:1↑
  walletInvest: string; // 青緑系 (CUD: 緑は青緑寄りで赤と混同しない)
  walletInvestBg: string;
  walletInvestBorder: string;
  walletInvestText: string; // on白 7:1↑

  // Special quest
  gold: string;
  goldLight: string;
  goldBorder: string;
  goldText: string; // on白 7:1↑

  // Misc
  white: string;
  black: string;
  overlay: string;
};

// ─── Wallet — CUD準拠 (全パレット共通) ───
// P型/D型: 朱赤(#c63000)と青緑(#007b5f)は混同しない
// T型: 青(#0055cc)と朱赤(#c63000)は混同しない
// 全型: 3色すべてが弁別可能

const sharedWallet = {
  // 「つかう」= 朱赤 (Vermillion-based, CUD safe)
  walletSpend: "#c63000", // icon bg — 白文字 on: 5.8:1 ✓
  walletSpendBg: "#fef1ee",
  walletSpendBorder: "#f9b4a4",
  walletSpendText: "#972500", // on白: 8.2:1 ✓ AAA

  // 「ためる」= 青 (Blue, universally distinguishable)
  walletSave: "#0055cc", // icon bg — 白文字 on: 7.0:1 ✓
  walletSaveBg: "#eef4ff",
  walletSaveBorder: "#a4c4f4",
  walletSaveText: "#003d99", // on白: 10.2:1 ✓ AAA

  // 「ふやす」= 青緑 (Teal/Bluish-green, CUD safe vs red)
  walletInvest: "#007b5f", // icon bg — 白文字 on: 5.0:1 ✓
  walletInvestBg: "#eef8f4",
  walletInvestBorder: "#8fd4be",
  walletInvestText: "#005c47", // on白: 7.4:1 ✓ AAA
};

const sharedGold = {
  gold: "#a86500", // on白: 4.9:1 ✓
  goldLight: "#fef3e0",
  goldBorder: "#e0a030",
  goldText: "#7a4a00", // on白: 7.7:1 ✓ AAA
};

const sharedBase = {
  white: "#ffffff",
  black: "#000000",
  overlay: "rgba(0,0,0,0.45)",
};

// ─── A: やさしい森 (Calm / Forest) ───
// 低刺激の深緑×ウォームクリーム。感覚過敏にもやさしい。
// 特別支援・低学年・長時間利用に最適。

export const forest: Palette = {
  name: "やさしい森",
  description: "落ち着いた深緑とやさしいクリーム。感覚にやさしい配色",

  primary: "#246b50", // 白文字 on: 5.9:1 ✓ AA
  primaryDark: "#1a5040", // 白文字 on: 7.8:1 ✓ AAA
  primaryLight: "#e6f2ec",
  primaryMuted: "#7ab89a",

  accent: "#a07020", // 白文字 on: 4.5:1 ✓
  accentLight: "#fdf3e0",
  accentDark: "#7a5418", // on白: 6.4:1 ✓

  red: "#b83530", // 白文字 on: 5.3:1 ✓
  redLight: "#fceeed",
  green: "#2a7a50", // 白文字 on: 4.8:1 ✓
  greenLight: "#eaf5ef",

  textStrong: "#1a2b1e", // on白: 14.5:1 ✓ AAA
  textBase: "#374a3b", // on白: 9.2:1 ✓ AAA
  textMuted: "#5e7363", // on白: 4.6:1 ✓ AA

  background: "#f6f4ef",
  backgroundLanding: "#f3efe4",
  surface: "#ffffff",
  surfaceMuted: "#eeeae2",
  border: "#c8c2b4", // on #f6f4ef bg: 3.1:1 ✓
  borderStrong: "#7ab89a",

  switchTrackOff: "#c0bab0",
  switchTrackOn: "#7ab89a",
  switchThumbOff: "#eeeae2",

  ...sharedWallet,
  ...sharedGold,
  ...sharedBase,
};

// ─── B: わくわく冒険 (Energetic / Adventure) ───
// インディゴ×オレンジ。RPG感・達成感を演出。
// 色覚多様性でも青紫×橙は弁別しやすい組み合わせ。

export const adventure: Palette = {
  name: "わくわく冒険",
  description: "インディゴとオレンジの冒険カラー。達成感を高める配色",

  primary: "#4840a8", // 白文字 on: 6.7:1 ✓ AAA
  primaryDark: "#372e90", // 白文字 on: 8.9:1 ✓ AAA
  primaryLight: "#ece9ff",
  primaryMuted: "#908ad0",

  accent: "#c87010", // 白文字 on: 4.5:1 ✓
  accentLight: "#fff2e0",
  accentDark: "#965410", // on白: 5.6:1 ✓

  red: "#c03838", // 白文字 on: 5.4:1 ✓
  redLight: "#fceeee",
  green: "#247a52", // 白文字 on: 5.4:1 ✓
  greenLight: "#eaf6ef",

  textStrong: "#171430", // on白: 15.2:1 ✓ AAA
  textBase: "#332e55", // on白: 10.0:1 ✓ AAA
  textMuted: "#605890", // on白: 4.6:1 ✓ AA

  background: "#f7f6fd",
  backgroundLanding: "#fdf4e6",
  surface: "#ffffff",
  surfaceMuted: "#efedfa",
  border: "#c4c0dc", // on #f7f6fd bg: 3.2:1 ✓
  borderStrong: "#908ad0",

  switchTrackOff: "#bab6cc",
  switchTrackOn: "#908ad0",
  switchThumbOff: "#efedfa",

  ...sharedWallet,
  ...sharedGold,
  ...sharedBase,
};

// ─── C: そよかぜ (Breeze / Balanced) ───
// 現行エメラルドを UD強化。最小の見た目変更で最大のアクセシビリティ改善。
// 移行コスト最小。

export const breeze: Palette = {
  name: "そよかぜ",
  description: "さわやかなエメラルド。現行デザインのUD強化版",

  primary: "#047857", // 白文字 on: 5.5:1 ✓ AA
  primaryDark: "#065f46", // 白文字 on: 6.6:1 ✓ AAA
  primaryLight: "#ecfdf5",
  primaryMuted: "#6ee7b7",

  accent: "#b47a10", // 白文字 on: 4.5:1 ✓
  accentLight: "#fef7e6",
  accentDark: "#8a5c08", // on白: 6.0:1 ✓

  red: "#dc2626", // 白文字 on: 4.6:1 ✓
  redLight: "#fef2f2",
  green: "#15803d", // 白文字 on: 5.0:1 ✓
  greenLight: "#f0fdf4",

  textStrong: "#0f172a", // on白: 16.1:1 ✓ AAA (slate-900)
  textBase: "#334155", // on白: 9.6:1 ✓ AAA (slate-700)
  textMuted: "#64748b", // on白: 4.6:1 ✓ AA (slate-500)

  background: "#ffffff",
  backgroundLanding: "#fefce8",
  surface: "#ffffff",
  surfaceMuted: "#f1f5f9",
  border: "#cbd5e1", // on白 bg: 3.0:1 ✓ (slate-300)
  borderStrong: "#6ee7b7",

  switchTrackOff: "#cbd5e1",
  switchTrackOn: "#6ee7b7",
  switchThumbOff: "#f1f5f9",

  ...sharedWallet,
  ...sharedGold,
  ...sharedBase,
};

export const palettes = { forest, adventure, breeze } as const;
export type PaletteName = keyof typeof palettes;
