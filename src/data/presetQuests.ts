/**
 * プリセットクエスト定義
 *
 * 子供が「クエストを えらぶ」で選択できるクエストの一覧。
 * 各クエストはカイロソフト風の冒険系メインタイトル（mainTitle）と、
 * 知的障害のあるユーザーや低学年にも伝わる直接表現のサブラベル（subLabel）を持つ。
 *
 * 採用基準・根拠:
 *   → docs/kairosoft-quest-naming.md §採用決定版
 *
 * 運用方針:
 *   Phase 1: このハードコード定数を使用（即動く）
 *   Phase 2: docs/sql/preset-quests-migration.sql を Supabase に適用
 *   Phase 3: クライアントコードを DB 取得に切替
 *
 * 将来 DB 化したときに同じ形で動かせるよう、id を安定キーとする。
 */

export type PresetQuestCategory =
  | "cleaning"      // そうじ系
  | "kitchen"       // だいどころ系
  | "self_care"     // じぶんのこと
  | "errands"       // おつかい系
  | "self_growth"   // べんきょう系
  | "family_care";  // かぞく系

export type PresetQuest = {
  id: string;
  emoji: string;
  mainTitle: string;     // 例: 泡モンスター 討伐作戦
  subLabel: string;      // 例: おふろ そうじ
  category: PresetQuestCategory;
  suggestedReward: number; // 提案時のデフォルト報酬（円）
  defaultReason: string;   // 提案時のデフォルト理由（空でもOK）
};

export const PRESET_QUESTS: PresetQuest[] = [
  {
    id: "bath_cleaning",
    emoji: "🛁",
    mainTitle: "泡モンスター 討伐作戦",
    subLabel: "おふろ そうじ",
    category: "cleaning",
    suggestedReward: 50,
    defaultReason: "お風呂を きれいに したい",
  },
  {
    id: "dish_washing",
    emoji: "🍽",
    mainTitle: "油汚れドラゴン 討伐作戦",
    subLabel: "しょっき あらい",
    category: "kitchen",
    suggestedReward: 30,
    defaultReason: "冒険団マスターを 助けたい",
  },
  {
    id: "laundry_folding",
    emoji: "🧺",
    mainTitle: "衣類王国 平定計画",
    subLabel: "せんたくもの たたみ",
    category: "cleaning",
    suggestedReward: 30,
    defaultReason: "洋服を きれいに 整えたい",
  },
  {
    id: "vacuuming",
    emoji: "🧹",
    mainTitle: "サイクロン発動 大作戦",
    subLabel: "そうじき かけ",
    category: "cleaning",
    suggestedReward: 40,
    defaultReason: "部屋を ピカピカに したい",
  },
  {
    id: "trash_out",
    emoji: "🗑",
    mainTitle: "ゴミの魔物 排除任務",
    subLabel: "ゴミを だす",
    category: "errands",
    suggestedReward: 20,
    defaultReason: "おうちを きれいに たもちたい",
  },
  {
    id: "entrance_cleaning",
    emoji: "🚪",
    mainTitle: "開運の門 磨き上げ任務",
    subLabel: "げんかん みがき",
    category: "cleaning",
    suggestedReward: 30,
    defaultReason: "玄関を きれいに したい",
  },
  {
    id: "shoe_arrangement",
    emoji: "👟",
    mainTitle: "靴の騎士団 整列任務",
    subLabel: "くつ ならべ",
    category: "cleaning",
    suggestedReward: 10,
    defaultReason: "玄関を 整えたい",
  },
  {
    id: "tidying",
    emoji: "🧸",
    mainTitle: "部屋の魔王 討伐作戦",
    subLabel: "かたづけ",
    category: "cleaning",
    suggestedReward: 40,
    defaultReason: "自分の部屋を きれいに したい",
  },
  {
    id: "window_wiping",
    emoji: "🪟",
    mainTitle: "ガラスの結界 磨き上げ作戦",
    subLabel: "まど ふき",
    category: "cleaning",
    suggestedReward: 30,
    defaultReason: "お日様の光を たくさん 入れたい",
  },
  {
    id: "watering_plants",
    emoji: "🪴",
    mainTitle: "植物王国 守護任務",
    subLabel: "みず やり",
    category: "family_care",
    suggestedReward: 10,
    defaultReason: "植物を 元気に したい",
  },
  {
    id: "dog_walk",
    emoji: "🐶",
    mainTitle: "相棒勇者 巡回作戦",
    subLabel: "いぬの さんぽ",
    category: "family_care",
    suggestedReward: 30,
    defaultReason: "相棒と 冒険したい",
  },
  {
    id: "homework",
    emoji: "📚",
    mainTitle: "知識の結晶 収集作戦",
    subLabel: "しゅくだい",
    category: "self_growth",
    suggestedReward: 30,
    defaultReason: "勉強を がんばりたい",
  },
  {
    id: "cooking_help",
    emoji: "🍳",
    mainTitle: "料理勇者 見習い任務",
    subLabel: "りょうり てつだい",
    category: "kitchen",
    suggestedReward: 40,
    defaultReason: "料理を おぼえたい",
  },
  {
    id: "tooth_brushing",
    emoji: "🦷",
    mainTitle: "虫歯モンスター 撃退作戦",
    subLabel: "はみがき",
    category: "self_care",
    suggestedReward: 10,
    defaultReason: "歯を 大切に したい",
  },
  {
    id: "futon_folding",
    emoji: "🛏",
    mainTitle: "ふとん勇者 朝の作戦",
    subLabel: "ふとん たたみ",
    category: "self_care",
    suggestedReward: 20,
    defaultReason: "ベッドを きれいに 整えたい",
  },
  {
    id: "shoulder_massage",
    emoji: "💪",
    mainTitle: "肩こり モンスター撃退",
    subLabel: "かた もみ",
    category: "family_care",
    suggestedReward: 20,
    defaultReason: "家族を 元気に したい",
  },
];

/** カテゴリの表示ラベル（UIで使用） */
export const CATEGORY_LABELS: Record<PresetQuestCategory, string> = {
  cleaning: "そうじ系",
  kitchen: "だいどころ系",
  self_care: "じぶん の こと",
  errands: "おつかい系",
  self_growth: "べんきょう系",
  family_care: "かぞく系",
};
