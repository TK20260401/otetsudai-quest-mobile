import type React from "react";
import {
  PixelBathIcon,
  PixelPlateIcon,
  PixelLaundryIcon,
  PixelBroomIcon,
  PixelTrashIcon,
  PixelDoorIcon,
  PixelShoesIcon,
  PixelTeddyIcon,
  PixelWindowIcon,
  PixelPotIcon,
  PixelDogIcon,
  PixelBookIcon,
  PixelCookingPanIcon,
  PixelToothbrushIcon,
  PixelBedIcon,
  PixelMuscleIcon,
} from "../components/PixelIcons";

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
 * アイコン方針:
 *   プラットフォーム依存の絵文字を避け、PixelIcons.tsx の SVG ピクセルアイコンで
 *   視覚を統一する。
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
  icon: React.ComponentType<{ size?: number }>;
  mainTitle: string;     // 例: 泡モンスター 討伐作戦
  subLabel: string;      // 例: おふろ そうじ
  category: PresetQuestCategory;
  suggestedReward: number; // 提案時のデフォルト報酬（コロ）
  defaultReason: string;   // 提案時のデフォルト理由（空でもOK）
};

export const PRESET_QUESTS: PresetQuest[] = [
  {
    id: "bath_cleaning",
    icon: PixelBathIcon,
    mainTitle: "泡モンスター 討伐作戦",
    subLabel: "お風呂掃除",
    category: "cleaning",
    suggestedReward: 50,
    defaultReason: "お風呂をきれいにしたい",
  },
  {
    id: "dish_washing",
    icon: PixelPlateIcon,
    mainTitle: "油汚れドラゴン 討伐作戦",
    subLabel: "食器洗い",
    category: "kitchen",
    suggestedReward: 30,
    defaultReason: "冒険団マスターを助けたい",
  },
  {
    id: "laundry_folding",
    icon: PixelLaundryIcon,
    mainTitle: "衣類王国 平定計画",
    subLabel: "洗濯物たたみ",
    category: "cleaning",
    suggestedReward: 30,
    defaultReason: "洋服をきれいに整えたい",
  },
  {
    id: "vacuuming",
    icon: PixelBroomIcon,
    mainTitle: "サイクロン発動 大作戦",
    subLabel: "掃除機かけ",
    category: "cleaning",
    suggestedReward: 40,
    defaultReason: "部屋をピカピカにしたい",
  },
  {
    id: "trash_out",
    icon: PixelTrashIcon,
    mainTitle: "ゴミの魔物 排除任務",
    subLabel: "ゴミ出し",
    category: "errands",
    suggestedReward: 20,
    defaultReason: "おうちをきれいに保ちたい",
  },
  {
    id: "entrance_cleaning",
    icon: PixelDoorIcon,
    mainTitle: "開運の門 磨き上げ任務",
    subLabel: "玄関磨き",
    category: "cleaning",
    suggestedReward: 30,
    defaultReason: "玄関をきれいにしたい",
  },
  {
    id: "shoe_arrangement",
    icon: PixelShoesIcon,
    mainTitle: "靴の騎士団 整列任務",
    subLabel: "靴並べ",
    category: "cleaning",
    suggestedReward: 10,
    defaultReason: "玄関を整えたい",
  },
  {
    id: "tidying",
    icon: PixelTeddyIcon,
    mainTitle: "部屋の魔王 討伐作戦",
    subLabel: "片付け",
    category: "cleaning",
    suggestedReward: 40,
    defaultReason: "自分の部屋をきれいにしたい",
  },
  {
    id: "window_wiping",
    icon: PixelWindowIcon,
    mainTitle: "ガラスの結界 磨き上げ作戦",
    subLabel: "窓拭き",
    category: "cleaning",
    suggestedReward: 30,
    defaultReason: "お日様の光をたくさん入れたい",
  },
  {
    id: "watering_plants",
    icon: PixelPotIcon,
    mainTitle: "植物王国 守護任務",
    subLabel: "水やり",
    category: "family_care",
    suggestedReward: 10,
    defaultReason: "植物を元気にしたい",
  },
  {
    id: "dog_walk",
    icon: PixelDogIcon,
    mainTitle: "相棒勇者 巡回作戦",
    subLabel: "犬の散歩",
    category: "family_care",
    suggestedReward: 30,
    defaultReason: "相棒と冒険したい",
  },
  {
    id: "homework",
    icon: PixelBookIcon,
    mainTitle: "知識の結晶 収集作戦",
    subLabel: "宿題",
    category: "self_growth",
    suggestedReward: 30,
    defaultReason: "勉強を頑張りたい",
  },
  {
    id: "cooking_help",
    icon: PixelCookingPanIcon,
    mainTitle: "料理勇者 見習い任務",
    subLabel: "料理手伝い",
    category: "kitchen",
    suggestedReward: 40,
    defaultReason: "料理を覚えたい",
  },
  {
    id: "tooth_brushing",
    icon: PixelToothbrushIcon,
    mainTitle: "虫歯モンスター 撃退作戦",
    subLabel: "歯磨き",
    category: "self_care",
    suggestedReward: 10,
    defaultReason: "歯を大切にしたい",
  },
  {
    id: "futon_folding",
    icon: PixelBedIcon,
    mainTitle: "ふとん勇者 朝の作戦",
    subLabel: "布団たたみ",
    category: "self_care",
    suggestedReward: 20,
    defaultReason: "ベッドをきれいに整えたい",
  },
  {
    id: "shoulder_massage",
    icon: PixelMuscleIcon,
    mainTitle: "肩こり モンスター撃退",
    subLabel: "肩もみ",
    category: "family_care",
    suggestedReward: 20,
    defaultReason: "家族を元気にしたい",
  },
];

/** カテゴリの表示ラベル（UIで使用） */
export const CATEGORY_LABELS: Record<PresetQuestCategory, string> = {
  cleaning: "掃除系",
  kitchen: "台所系",
  self_care: "自分のこと",
  errands: "お使い系",
  self_growth: "勉強系",
  family_care: "家族系",
};
