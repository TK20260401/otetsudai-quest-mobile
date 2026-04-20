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
import IdleAnimationWrapper, { type IdleAnimationType } from "./IdleAnimationWrapper";

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

type StampEntry = { icon: IconComponent; anim: IdleAnimationType };

// 全スタンプの id を SVG + アニメーションに対応づけ
const STAMP_MAP: Record<string, StampEntry> = {
  // 承認スタンプ
  great:      { icon: PixelStarIcon,          anim: "pulse" },    // ⭐キラキラ
  thankyou:   { icon: PixelHeartIcon,         anim: "breathe" },  // ❤️ドキドキ
  ganbare:    { icon: PixelCrossedSwordsIcon, anim: "sway" },     // ⚔️振り
  perfect:    { icon: PixelMedalIcon,         anim: "spin" },     // 🏅回転
  heart:      { icon: PixelHeartIcon,         anim: "breathe" },  // ❤️ドキドキ
  fire:       { icon: PixelFlameIcon,         anim: "flicker" },  // 🔥メラメラ
  crown:      { icon: PixelCrownIcon,         anim: "pulse" },    // 👑キラキラ
  sparkle:    { icon: PixelStarIcon,          anim: "pulse" },    // ✨キラキラ

  // ファミリースタンプ（エール）
  cheer:      { icon: PixelFlameIcon,         anim: "flicker" },  // 🔥応援
  thanks:     { icon: PixelHeartIcon,         anim: "breathe" },
  love:       { icon: PixelHeartIcon,         anim: "breathe" },
  muscle:     { icon: PixelCrossedSwordsIcon, anim: "bounce" },   // 💪バウンス
  highfive:   { icon: PixelConfettiIcon,      anim: "flutter" },  // 🎉ひらひら
  hug:        { icon: PixelHeartIcon,         anim: "breathe" },
  salute:     { icon: PixelShieldIcon,        anim: "bob" },      // 🫡うなずき

  // 子スタンプ
  try_harder: { icon: PixelCrossedSwordsIcon, anim: "bounce" },
  yay:        { icon: PixelConfettiIcon,      anim: "flutter" },
  next_time:  { icon: PixelFlameIcon,         anim: "flicker" },
  roger:      { icon: PixelShieldIcon,        anim: "bob" },
};

export default function StampSvg({
  id,
  size = 20,
  animated = true,
}: {
  id: string;
  size?: number;
  animated?: boolean;
}) {
  const entry = STAMP_MAP[id];
  if (!entry) {
    return <View style={{ width: size, height: size }} />;
  }
  const { icon: Icon, anim } = entry;
  if (!animated) return <Icon size={size} />;
  return (
    <IdleAnimationWrapper type={anim}>
      <Icon size={size} />
    </IdleAnimationWrapper>
  );
}

export function hasStampSvg(id: string): boolean {
  return id in STAMP_MAP;
}
