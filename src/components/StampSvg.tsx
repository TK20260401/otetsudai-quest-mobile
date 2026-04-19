import React from "react";
import { View } from "react-native";
import {
  PixelStarIcon,
  PixelHeartIcon,
  PixelCrossedSwordsIcon,
  PixelMedalIcon,
  PixelFlameIcon,
  PixelCrownIcon,
  PixelConfettiIcon,
  PixelShieldIcon,
  PixelGiftIcon,
} from "./PixelIcons";

/**
 * スタンプID → ピクセルSVG の集約マッピング。
 *
 * 3種のスタンプデータ（stamps.ts / family-stamps.ts / child-stamps.ts）の
 * 絵文字表示を SVG に一元化する。既存 PixelIcons を再利用して設計コストを
 * 抑え、モチーフが足りないところは意味的に近い既存アイコンに寄せる。
 *
 * DB には id 文字列のみ保存されているため、将来絵文字フィールドを廃止して
 * svgKey に置き換えても後方互換は id → SVG マッピングを維持すれば保たれる。
 */

type IconComponent = (props: { size?: number }) => React.ReactElement;

// 全スタンプの id を SVG コンポーネントに対応づけ
const STAMP_MAP: Record<string, IconComponent> = {
  // 承認スタンプ（stamps.ts）
  great: PixelStarIcon,
  thankyou: PixelHeartIcon,
  ganbare: PixelCrossedSwordsIcon,
  perfect: PixelMedalIcon,
  heart: PixelHeartIcon,
  fire: PixelFlameIcon,
  crown: PixelCrownIcon,
  sparkle: PixelStarIcon,

  // ファミリースタンプ（family-stamps.ts・エール）
  cheer: PixelFlameIcon,
  thanks: PixelHeartIcon,
  // "great" / "love" と重複する id はここで上書きしない
  love: PixelHeartIcon,
  muscle: PixelCrossedSwordsIcon,
  highfive: PixelConfettiIcon,
  hug: PixelHeartIcon,
  salute: PixelShieldIcon,

  // 子スタンプ（child-stamps.ts）
  try_harder: PixelCrossedSwordsIcon,
  yay: PixelConfettiIcon,
  next_time: PixelFlameIcon,
  roger: PixelShieldIcon,
  // "thanks" / "love" は上と同じマッピングを再利用
};

export default function StampSvg({
  id,
  size = 20,
}: {
  id: string;
  size?: number;
}) {
  const Icon = STAMP_MAP[id];
  if (!Icon) {
    // 未マッピング id は 1px の透明 View でスロットだけ確保（フォールバック）
    return <View style={{ width: size, height: size }} />;
  }
  return <Icon size={size} />;
}

export function hasStampSvg(id: string): boolean {
  return id in STAMP_MAP;
}
