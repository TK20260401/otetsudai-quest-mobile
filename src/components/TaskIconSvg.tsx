import React from "react";
import IdleAnimationWrapper, { type IdleAnimationType } from "./IdleAnimationWrapper";
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
 * タスク名のキーワード → SVG アイコン + アニメーション種別
 * 先頭から順にマッチング（先勝ち）
 */
const TASK_ICON_MAP: [string[], IconComp, IdleAnimationType][] = [
  [["食器", "皿洗い", "皿あらい", "おさら"], PixelPlateIcon, "spin"],       // 皿回し
  [["料理", "ごはん", "ご飯", "夕飯", "朝食", "昼食", "夕食", "調理"], PixelPotIcon, "flicker"], // 煮える
  [["配膳", "はいぜん"], PixelPlateIcon, "bob"],
  [["テーブル拭", "テーブルふ", "台拭", "台ふ", "拭き"], PixelSpongeIcon, "sway"],  // 拭き動作
  [["洗濯物たたみ", "洗濯たたみ", "洗濯物畳", "せんたくたたみ"], PixelShirtIcon, "bob"],
  [["洗濯", "せんたく"], PixelLaundryIcon, "spin"],    // 洗濯機回転
  [["アイロン"], PixelFlameIcon, "flicker"],
  [["床掃除", "掃除機", "そうじき", "ほうき"], PixelBroomIcon, "sway"],  // 掃く動作
  [["お風呂", "おふろ", "風呂", "浴室"], PixelBathIcon, "breathe"],     // 湯気
  [["トイレ"], PixelToiletIcon, "pulse"],
  [["窓拭き", "窓ふき", "まどふき", "窓"], PixelWindowIcon, "sway"],
  [["片付け", "かたづけ", "整理整頓", "整理"], PixelBackpackIcon, "bounce"],
  [["ゴミ出し", "ごみ出し", "ゴミだし", "ごみだし", "ゴミ"], PixelTrashIcon, "bob"],
  [["分別", "ぶんべつ", "リサイクル"], PixelRecycleIcon, "spin"],
  [["水やり", "みずやり", "花", "植物"], PixelFlowerIcon, "breathe"],   // 成長
  [["草むしり", "くさむしり", "草取り", "雑草"], PixelSeedlingIcon, "sway"],
  [["ペット", "犬", "いぬ", "散歩", "さんぽ"], PixelDogIcon, "bounce"], // 跳ねる
  [["猫", "ねこ"], PixelCatIcon, "sway"],              // しっぽ振り
  [["買い物", "かいもの", "おつかい"], PixelCartIcon, "bob"],
  [["宿題", "しゅくだい", "勉強", "べんきょう", "読書", "どくしょ", "本"], PixelBookIcon, "pulse"],
  [["時間割", "じかんわり", "ランドセル", "学校準備", "がっこう"], PixelBackpackIcon, "bounce"],
  [["靴揃え", "くつそろえ", "靴並べ", "くつならべ", "靴"], PixelShoesIcon, "bob"],
  [["布団", "ふとん", "ベッド", "ねる"], PixelBedIcon, "breathe"],     // 寝息
  [["歯みがき", "歯磨き", "はみがき"], PixelToothbrushIcon, "sway"],   // 磨く動作
  [["肩たたき", "かたたたき", "マッサージ"], PixelChatIcon, "bounce"],
  [["玄関", "げんかん"], PixelDoorIcon, "bob"],
  [["車", "くるま", "洗車"], PixelCarIcon, "sway"],
];

/**
 * タスクタイトルから対応するSVGアイコンを選択してレンダリング
 * マッチしない場合は PixelStarIcon（汎用クエスト星）をフォールバック
 */
export default function TaskIconSvg({ title, size = 28, animated = true }: { title: string; size?: number; animated?: boolean }) {
  for (const [keywords, Icon, anim] of TASK_ICON_MAP) {
    if (keywords.some((kw) => title.includes(kw))) {
      if (!animated) return <Icon size={size} />;
      return (
        <IdleAnimationWrapper type={anim} intensity="subtle">
          <Icon size={size} />
        </IdleAnimationWrapper>
      );
    }
  }
  if (!animated) return <PixelStarIcon size={size} />;
  return (
    <IdleAnimationWrapper type="pulse" intensity="subtle">
      <PixelStarIcon size={size} />
    </IdleAnimationWrapper>
  );
}
