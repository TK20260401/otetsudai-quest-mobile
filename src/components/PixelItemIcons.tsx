import React from "react";
import Svg, { Rect, G } from "react-native-svg";
import IdleAnimationWrapper from "./IdleAnimationWrapper";

const PX = 4;
type PixelDef = [number, number, string];

function PixelGrid({ pixels, gridW, gridH, size }: { pixels: PixelDef[]; gridW: number; gridH: number; size: number }) {
  return (
    <Svg width={size} height={size * (gridH / gridW)} viewBox={`0 0 ${gridW * PX} ${gridH * PX}`}>
      <G>
        {pixels.map(([x, y, color], i) => (
          <Rect key={i} x={x * PX} y={y * PX} width={PX} height={PX} fill={color} />
        ))}
      </G>
    </Svg>
  );
}

// ============================================================
// 金貨 (8x8)
// ============================================================
const GOLD_COIN: PixelDef[] = [
  [2,0,"#DAA520"],[3,0,"#DAA520"],[4,0,"#DAA520"],[5,0,"#DAA520"],
  [1,1,"#FFD700"],[2,1,"#FFE066"],[3,1,"#FFE066"],[4,1,"#FFD700"],[5,1,"#FFD700"],[6,1,"#DAA520"],
  [0,2,"#FFD700"],[1,2,"#FFE066"],[2,2,"#FFFACD"],[3,2,"#FFE066"],[4,2,"#FFD700"],[5,2,"#FFD700"],[6,2,"#DAA520"],[7,2,"#B8860B"],
  [0,3,"#FFD700"],[1,3,"#FFE066"],[2,3,"#FFE066"],[3,3,"#DAA520"],[4,3,"#DAA520"],[5,3,"#FFD700"],[6,3,"#DAA520"],[7,3,"#B8860B"],
  [0,4,"#FFD700"],[1,4,"#FFD700"],[2,4,"#FFD700"],[3,4,"#DAA520"],[4,4,"#DAA520"],[5,4,"#FFD700"],[6,4,"#DAA520"],[7,4,"#B8860B"],
  [0,5,"#DAA520"],[1,5,"#FFD700"],[2,5,"#FFD700"],[3,5,"#FFD700"],[4,5,"#FFD700"],[5,5,"#DAA520"],[6,5,"#B8860B"],[7,5,"#B8860B"],
  [1,6,"#DAA520"],[2,6,"#DAA520"],[3,6,"#DAA520"],[4,6,"#DAA520"],[5,6,"#B8860B"],[6,6,"#B8860B"],
  [2,7,"#B8860B"],[3,7,"#B8860B"],[4,7,"#B8860B"],[5,7,"#B8860B"],
];

export function GoldCoinIcon({ size = 32, animated = false }: { size?: number; animated?: boolean }) {
  const svg = <PixelGrid pixels={GOLD_COIN} gridW={8} gridH={8} size={size} />;
  if (!animated) return svg;
  return <IdleAnimationWrapper type="spin">{svg}</IdleAnimationWrapper>;
}

// ============================================================
// 銀貨 (8x8)
// ============================================================
const SILVER_COIN: PixelDef[] = [
  [2,0,"#A0A8B0"],[3,0,"#A0A8B0"],[4,0,"#A0A8B0"],[5,0,"#A0A8B0"],
  [1,1,"#C0C8D0"],[2,1,"#D8DEE4"],[3,1,"#D8DEE4"],[4,1,"#C0C8D0"],[5,1,"#C0C8D0"],[6,1,"#A0A8B0"],
  [0,2,"#C0C8D0"],[1,2,"#D8DEE4"],[2,2,"#F0F2F4"],[3,2,"#D8DEE4"],[4,2,"#C0C8D0"],[5,2,"#C0C8D0"],[6,2,"#A0A8B0"],[7,2,"#808890"],
  [0,3,"#C0C8D0"],[1,3,"#D8DEE4"],[2,3,"#D8DEE4"],[3,3,"#A0A8B0"],[4,3,"#A0A8B0"],[5,3,"#C0C8D0"],[6,3,"#A0A8B0"],[7,3,"#808890"],
  [0,4,"#C0C8D0"],[1,4,"#C0C8D0"],[2,4,"#C0C8D0"],[3,4,"#A0A8B0"],[4,4,"#A0A8B0"],[5,4,"#C0C8D0"],[6,4,"#A0A8B0"],[7,4,"#808890"],
  [0,5,"#A0A8B0"],[1,5,"#C0C8D0"],[2,5,"#C0C8D0"],[3,5,"#C0C8D0"],[4,5,"#C0C8D0"],[5,5,"#A0A8B0"],[6,5,"#808890"],[7,5,"#808890"],
  [1,6,"#A0A8B0"],[2,6,"#A0A8B0"],[3,6,"#A0A8B0"],[4,6,"#A0A8B0"],[5,6,"#808890"],[6,6,"#808890"],
  [2,7,"#808890"],[3,7,"#808890"],[4,7,"#808890"],[5,7,"#808890"],
];

export function SilverCoinIcon({ size = 32, animated = false }: { size?: number; animated?: boolean }) {
  const svg = <PixelGrid pixels={SILVER_COIN} gridW={8} gridH={8} size={size} />;
  if (!animated) return svg;
  return <IdleAnimationWrapper type="spin">{svg}</IdleAnimationWrapper>;
}

// ============================================================
// 銅貨 (8x8)
// ============================================================
const BRONZE_COIN: PixelDef[] = [
  [2,0,"#8B5E3C"],[3,0,"#8B5E3C"],[4,0,"#8B5E3C"],[5,0,"#8B5E3C"],
  [1,1,"#A0704C"],[2,1,"#C08860"],[3,1,"#C08860"],[4,1,"#A0704C"],[5,1,"#A0704C"],[6,1,"#8B5E3C"],
  [0,2,"#A0704C"],[1,2,"#C08860"],[2,2,"#D8A878"],[3,2,"#C08860"],[4,2,"#A0704C"],[5,2,"#A0704C"],[6,2,"#8B5E3C"],[7,2,"#6B4430"],
  [0,3,"#A0704C"],[1,3,"#C08860"],[2,3,"#C08860"],[3,3,"#8B5E3C"],[4,3,"#8B5E3C"],[5,3,"#A0704C"],[6,3,"#8B5E3C"],[7,3,"#6B4430"],
  [0,4,"#A0704C"],[1,4,"#A0704C"],[2,4,"#A0704C"],[3,4,"#8B5E3C"],[4,4,"#8B5E3C"],[5,4,"#A0704C"],[6,4,"#8B5E3C"],[7,4,"#6B4430"],
  [0,5,"#8B5E3C"],[1,5,"#A0704C"],[2,5,"#A0704C"],[3,5,"#A0704C"],[4,5,"#A0704C"],[5,5,"#8B5E3C"],[6,5,"#6B4430"],[7,5,"#6B4430"],
  [1,6,"#8B5E3C"],[2,6,"#8B5E3C"],[3,6,"#8B5E3C"],[4,6,"#8B5E3C"],[5,6,"#6B4430"],[6,6,"#6B4430"],
  [2,7,"#6B4430"],[3,7,"#6B4430"],[4,7,"#6B4430"],[5,7,"#6B4430"],
];

export function BronzeCoinIcon({ size = 32, animated = false }: { size?: number; animated?: boolean }) {
  const svg = <PixelGrid pixels={BRONZE_COIN} gridW={8} gridH={8} size={size} />;
  if (!animated) return svg;
  return <IdleAnimationWrapper type="spin">{svg}</IdleAnimationWrapper>;
}

// ============================================================
// ルビー (7x7)
// ============================================================
const RUBY: PixelDef[] = [
  [2,0,"#E74C3C"],[3,0,"#C0392B"],[4,0,"#E74C3C"],
  [1,1,"#FF6B6B"],[2,1,"#E74C3C"],[3,1,"#C0392B"],[4,1,"#E74C3C"],[5,1,"#C0392B"],
  [0,2,"#FF6B6B"],[1,2,"#FF6B6B"],[2,2,"#E74C3C"],[3,2,"#C0392B"],[4,2,"#C0392B"],[5,2,"#A93226"],[6,2,"#922B21"],
  [0,3,"#E74C3C"],[1,3,"#FF6B6B"],[2,3,"#E74C3C"],[3,3,"#C0392B"],[4,3,"#A93226"],[5,3,"#922B21"],[6,3,"#7B241C"],
  [1,4,"#E74C3C"],[2,4,"#C0392B"],[3,4,"#A93226"],[4,4,"#922B21"],[5,4,"#7B241C"],
  [2,5,"#C0392B"],[3,5,"#A93226"],[4,5,"#922B21"],
  [3,6,"#922B21"],
];

export function RubyIcon({ size = 28, animated = false }: { size?: number; animated?: boolean }) {
  const svg = <PixelGrid pixels={RUBY} gridW={7} gridH={7} size={size} />;
  if (!animated) return svg;
  return <IdleAnimationWrapper type="pulse">{svg}</IdleAnimationWrapper>;
}

// ============================================================
// サファイア (7x7)
// ============================================================
const SAPPHIRE: PixelDef[] = [
  [2,0,"#3498DB"],[3,0,"#2980B9"],[4,0,"#3498DB"],
  [1,1,"#5DADE2"],[2,1,"#3498DB"],[3,1,"#2980B9"],[4,1,"#3498DB"],[5,1,"#2980B9"],
  [0,2,"#5DADE2"],[1,2,"#5DADE2"],[2,2,"#3498DB"],[3,2,"#2980B9"],[4,2,"#2980B9"],[5,2,"#2471A3"],[6,2,"#1A5276"],
  [0,3,"#3498DB"],[1,3,"#5DADE2"],[2,3,"#3498DB"],[3,3,"#2980B9"],[4,3,"#2471A3"],[5,3,"#1A5276"],[6,3,"#154360"],
  [1,4,"#3498DB"],[2,4,"#2980B9"],[3,4,"#2471A3"],[4,4,"#1A5276"],[5,4,"#154360"],
  [2,5,"#2980B9"],[3,5,"#2471A3"],[4,5,"#1A5276"],
  [3,6,"#1A5276"],
];

export function SapphireIcon({ size = 28, animated = false }: { size?: number; animated?: boolean }) {
  const svg = <PixelGrid pixels={SAPPHIRE} gridW={7} gridH={7} size={size} />;
  if (!animated) return svg;
  return <IdleAnimationWrapper type="pulse">{svg}</IdleAnimationWrapper>;
}

// ============================================================
// エメラルド (7x7)
// ============================================================
const EMERALD: PixelDef[] = [
  [2,0,"#2ECC71"],[3,0,"#27AE60"],[4,0,"#2ECC71"],
  [1,1,"#58D68D"],[2,1,"#2ECC71"],[3,1,"#27AE60"],[4,1,"#2ECC71"],[5,1,"#27AE60"],
  [0,2,"#58D68D"],[1,2,"#58D68D"],[2,2,"#2ECC71"],[3,2,"#27AE60"],[4,2,"#27AE60"],[5,2,"#1E8449"],[6,2,"#196F3D"],
  [0,3,"#2ECC71"],[1,3,"#58D68D"],[2,3,"#2ECC71"],[3,3,"#27AE60"],[4,3,"#1E8449"],[5,3,"#196F3D"],[6,3,"#145A32"],
  [1,4,"#2ECC71"],[2,4,"#27AE60"],[3,4,"#1E8449"],[4,4,"#196F3D"],[5,4,"#145A32"],
  [2,5,"#27AE60"],[3,5,"#1E8449"],[4,5,"#196F3D"],
  [3,6,"#196F3D"],
];

export function EmeraldIcon({ size = 28, animated = false }: { size?: number; animated?: boolean }) {
  const svg = <PixelGrid pixels={EMERALD} gridW={7} gridH={7} size={size} />;
  if (!animated) return svg;
  return <IdleAnimationWrapper type="pulse">{svg}</IdleAnimationWrapper>;
}

// ============================================================
// 金の鍵 (6x8)
// ============================================================
const GOLD_KEY: PixelDef[] = [
  [1,0,"#FFD700"],[2,0,"#FFE066"],
  [0,1,"#FFD700"],[1,1,"#FFE066"],[2,1,"#FFFACD"],[3,1,"#FFD700"],
  [0,2,"#DAA520"],[1,2,"#FFD700"],[2,2,"#FFE066"],[3,2,"#DAA520"],
  [1,3,"#DAA520"],[2,3,"#FFD700"],
  [2,4,"#DAA520"],
  [2,5,"#DAA520"],[3,5,"#B8860B"],
  [2,6,"#DAA520"],[3,6,"#B8860B"],[4,6,"#B8860B"],
  [2,7,"#B8860B"],[3,7,"#B8860B"],
];

export function GoldKeyIcon({ size = 28 }: { size?: number }) {
  return <PixelGrid pixels={GOLD_KEY} gridW={6} gridH={8} size={size} />;
}

// ============================================================
// 宝袋 (8x8)
// ============================================================
const TREASURE_BAG: PixelDef[] = [
  [3,0,"#8B5E3C"],[4,0,"#8B5E3C"],
  [2,1,"#A0704C"],[3,1,"#C08860"],[4,1,"#C08860"],[5,1,"#A0704C"],
  [2,2,"#DAA520"],[3,2,"#FFD700"],[4,2,"#FFD700"],[5,2,"#DAA520"],
  [1,3,"#8B5E3C"],[2,3,"#A0704C"],[3,3,"#C08860"],[4,3,"#C08860"],[5,3,"#A0704C"],[6,3,"#8B5E3C"],
  [1,4,"#6B4430"],[2,4,"#8B5E3C"],[3,4,"#A0704C"],[4,4,"#A0704C"],[5,4,"#8B5E3C"],[6,4,"#6B4430"],
  [1,5,"#6B4430"],[2,5,"#8B5E3C"],[3,5,"#FFD700"],[4,5,"#DAA520"],[5,5,"#8B5E3C"],[6,5,"#6B4430"],
  [1,6,"#6B4430"],[2,6,"#6B4430"],[3,6,"#8B5E3C"],[4,6,"#8B5E3C"],[5,6,"#6B4430"],[6,6,"#6B4430"],
  [2,7,"#5C3A1E"],[3,7,"#6B4430"],[4,7,"#6B4430"],[5,7,"#5C3A1E"],
];

export function TreasureBagIcon({ size = 32 }: { size?: number }) {
  return <PixelGrid pixels={TREASURE_BAG} gridW={8} gridH={8} size={size} />;
}
