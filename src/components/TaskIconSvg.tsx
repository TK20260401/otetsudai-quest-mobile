import React from "react";
import {
  PixelDogIcon,
  PixelCatIcon,
  PixelBathIcon,
  PixelPlateIcon,
  PixelBroomIcon,
  PixelBedIcon,
  PixelCarIcon,
  PixelShirtIcon,
  PixelShoesIcon,
  PixelFlowerIcon,
  PixelPotIcon,
  PixelBackpackIcon,
  PixelToothbrushIcon,
  PixelLaundryIcon,
  PixelSpongeIcon,
  PixelWindowIcon,
  PixelToiletIcon,
  PixelRecycleIcon,
  PixelTrashIcon,
  PixelSeedlingIcon,
  PixelBookIcon,
  PixelCartIcon,
  PixelDoorIcon,
  PixelStarIcon,
  PixelFlameIcon,
  PixelChatIcon,
} from "./PixelIcons";

type IconComp = React.ComponentType<{ size?: number }>;

/**
 * タスク名のキーワード → SVG アイコンマッピング
 * 先頭から順にマッチング（先勝ち）
 */
const TASK_ICON_MAP: [string[], IconComp][] = [
  [["食器", "皿洗い", "皿あらい", "おさら"], PixelPlateIcon],
  [["料理", "ごはん", "ご飯", "夕飯", "朝食", "昼食", "夕食", "調理"], PixelPotIcon],
  [["配膳", "はいぜん"], PixelPlateIcon],
  [["テーブル拭", "テーブルふ", "台拭", "台ふ", "拭き"], PixelSpongeIcon],
  [["洗濯物たたみ", "洗濯たたみ", "洗濯物畳", "せんたくたたみ"], PixelShirtIcon],
  [["洗濯", "せんたく"], PixelLaundryIcon],
  [["アイロン"], PixelFlameIcon],
  [["床掃除", "掃除機", "そうじき", "ほうき"], PixelBroomIcon],
  [["お風呂", "おふろ", "風呂", "浴室"], PixelBathIcon],
  [["トイレ"], PixelToiletIcon],
  [["窓拭き", "窓ふき", "まどふき", "窓"], PixelWindowIcon],
  [["片付け", "かたづけ", "整理整頓", "整理"], PixelBackpackIcon],
  [["ゴミ出し", "ごみ出し", "ゴミだし", "ごみだし", "ゴミ"], PixelTrashIcon],
  [["分別", "ぶんべつ", "リサイクル"], PixelRecycleIcon],
  [["水やり", "みずやり", "花", "植物"], PixelFlowerIcon],
  [["草むしり", "くさむしり", "草取り", "雑草"], PixelSeedlingIcon],
  [["ペット", "犬", "いぬ", "散歩", "さんぽ"], PixelDogIcon],
  [["猫", "ねこ"], PixelCatIcon],
  [["買い物", "かいもの", "おつかい"], PixelCartIcon],
  [["宿題", "しゅくだい", "勉強", "べんきょう", "読書", "どくしょ", "本"], PixelBookIcon],
  [["時間割", "じかんわり", "ランドセル", "学校準備", "がっこう"], PixelBackpackIcon],
  [["靴揃え", "くつそろえ", "靴並べ", "くつならべ", "靴"], PixelShoesIcon],
  [["布団", "ふとん", "ベッド", "ねる"], PixelBedIcon],
  [["歯みがき", "歯磨き", "はみがき"], PixelToothbrushIcon],
  [["肩たたき", "かたたたき", "マッサージ"], PixelChatIcon],
  [["玄関", "げんかん"], PixelDoorIcon],
  [["車", "くるま", "洗車"], PixelCarIcon],
];

/**
 * タスクタイトルから対応するSVGアイコンを選択してレンダリング
 * マッチしない場合は PixelStarIcon（汎用クエスト星）をフォールバック
 */
export default function TaskIconSvg({ title, size = 28 }: { title: string; size?: number }) {
  for (const [keywords, Icon] of TASK_ICON_MAP) {
    if (keywords.some((kw) => title.includes(kw))) {
      return <Icon size={size} />;
    }
  }
  return <PixelStarIcon size={size} />;
}
