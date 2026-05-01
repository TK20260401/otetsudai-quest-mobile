import React from "react";
import Svg, { Rect, G } from "react-native-svg";
import type { PetType, GrowthStage } from "../lib/pets";
import IdleAnimationWrapper, { type IdleAnimationType } from "./IdleAnimationWrapper";

const PX = 3;
type PixelDef = [number, number, string];

type Props = {
  type: PetType;
  stage: GrowthStage;
  happiness?: number;
  size?: number;
  animated?: boolean;
};

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
// 共通: たまご (8x8)
// ============================================================
const EGG: PixelDef[] = [
  [3,0,"#DAA520"],[4,0,"#DAA520"],
  [2,1,"#FFD700"],[3,1,"#FFE066"],[4,1,"#FFE066"],[5,1,"#DAA520"],
  [1,2,"#FFD700"],[2,2,"#FFE066"],[3,2,"#FFFACD"],[4,2,"#FFE066"],[5,2,"#FFD700"],[6,2,"#DAA520"],
  [1,3,"#DAA520"],[2,3,"#FFD700"],[3,3,"#FFE066"],[4,3,"#FFD700"],[5,3,"#DAA520"],[6,3,"#B8860B"],
  [1,4,"#DAA520"],[2,4,"#FFD700"],[3,4,"#FFD700"],[4,4,"#DAA520"],[5,4,"#DAA520"],[6,4,"#B8860B"],
  [1,5,"#B8860B"],[2,5,"#DAA520"],[3,5,"#DAA520"],[4,5,"#DAA520"],[5,5,"#B8860B"],[6,5,"#B8860B"],
  [2,6,"#B8860B"],[3,6,"#B8860B"],[4,6,"#B8860B"],[5,6,"#B8860B"],
  [3,7,"#8B6914"],[4,7,"#8B6914"],
];

// ============================================================
// 竜 (dragon)
// ============================================================
const DRAGON_BABY: PixelDef[] = [
  [3,0,"#2ECC71"],[4,0,"#27AE60"],
  [2,1,"#2ECC71"],[3,1,"#58D68D"],[4,1,"#2ECC71"],[5,1,"#27AE60"],
  [1,2,"#27AE60"],[2,2,"#FFF"],[3,2,"#333"],[4,2,"#FFF"],[5,2,"#333"],[6,2,"#27AE60"],
  [1,3,"#2ECC71"],[2,3,"#2ECC71"],[3,3,"#E74C3C"],[4,3,"#2ECC71"],[5,3,"#2ECC71"],[6,3,"#1E8449"],
  [2,4,"#27AE60"],[3,4,"#2ECC71"],[4,4,"#2ECC71"],[5,4,"#27AE60"],
  [1,5,"#1E8449"],[2,5,"#27AE60"],[3,5,"#27AE60"],[4,5,"#27AE60"],[5,5,"#27AE60"],[6,5,"#1E8449"],
  [2,6,"#27AE60"],[5,6,"#27AE60"],
  [1,7,"#1E8449"],[2,7,"#1E8449"],[5,7,"#1E8449"],[6,7,"#1E8449"],
];

const DRAGON_CHILD: PixelDef[] = [
  [1,0,"#2ECC71"],[4,0,"#27AE60"],[7,0,"#2ECC71"],
  [3,1,"#58D68D"],[4,1,"#2ECC71"],[5,1,"#27AE60"],
  [2,2,"#2ECC71"],[3,2,"#58D68D"],[4,2,"#2ECC71"],[5,2,"#2ECC71"],[6,2,"#27AE60"],
  [1,3,"#27AE60"],[2,3,"#FFF"],[3,3,"#333"],[4,3,"#2ECC71"],[5,3,"#FFF"],[6,3,"#333"],[7,3,"#27AE60"],
  [1,4,"#2ECC71"],[2,4,"#2ECC71"],[3,4,"#E74C3C"],[4,4,"#E74C3C"],[5,4,"#2ECC71"],[6,4,"#2ECC71"],[7,4,"#1E8449"],
  [2,5,"#27AE60"],[3,5,"#2ECC71"],[4,5,"#2ECC71"],[5,5,"#2ECC71"],[6,5,"#27AE60"],
  [1,6,"#1E8449"],[2,6,"#27AE60"],[3,6,"#27AE60"],[4,6,"#FFD700"],[5,6,"#27AE60"],[6,6,"#27AE60"],[7,6,"#1E8449"],
  [2,7,"#27AE60"],[3,7,"#27AE60"],[5,7,"#27AE60"],[6,7,"#27AE60"],
  [1,8,"#1E8449"],[2,8,"#1E8449"],[6,8,"#1E8449"],[7,8,"#1E8449"],
  [7,5,"#27AE60"],[8,5,"#1E8449"],[9,5,"#1E8449"],
];

const DRAGON_ADULT: PixelDef[] = [
  [2,0,"#2ECC71"],[5,0,"#27AE60"],[9,0,"#2ECC71"],
  [1,1,"#58D68D"],[2,1,"#2ECC71"],[3,1,"#27AE60"],
  [3,2,"#58D68D"],[4,2,"#2ECC71"],[5,2,"#58D68D"],[6,2,"#27AE60"],
  [2,3,"#2ECC71"],[3,3,"#58D68D"],[4,3,"#2ECC71"],[5,3,"#2ECC71"],[6,3,"#2ECC71"],[7,3,"#27AE60"],
  [1,4,"#27AE60"],[2,4,"#FFF"],[3,4,"#333"],[4,4,"#2ECC71"],[5,4,"#2ECC71"],[6,4,"#FFF"],[7,4,"#333"],[8,4,"#27AE60"],
  [1,5,"#2ECC71"],[2,5,"#2ECC71"],[3,5,"#E74C3C"],[4,5,"#E74C3C"],[5,5,"#E74C3C"],[6,5,"#2ECC71"],[7,5,"#2ECC71"],[8,5,"#1E8449"],
  [2,6,"#27AE60"],[3,6,"#2ECC71"],[4,6,"#2ECC71"],[5,6,"#2ECC71"],[6,6,"#2ECC71"],[7,6,"#27AE60"],
  [0,7,"#FFD700"],[1,7,"#1E8449"],[2,7,"#27AE60"],[3,7,"#FFD700"],[4,7,"#27AE60"],[5,7,"#FFD700"],[6,7,"#27AE60"],[7,7,"#27AE60"],[8,7,"#1E8449"],
  [2,8,"#27AE60"],[3,8,"#27AE60"],[4,8,"#27AE60"],[5,8,"#27AE60"],[6,8,"#27AE60"],[7,8,"#27AE60"],
  [1,9,"#1E8449"],[2,9,"#1E8449"],[3,9,"#1E8449"],[6,9,"#1E8449"],[7,9,"#1E8449"],[8,9,"#1E8449"],
  [8,6,"#27AE60"],[9,6,"#1E8449"],[10,6,"#1E8449"],[11,6,"#145A32"],
  [9,7,"#1E8449"],[10,7,"#145A32"],
];

// ============================================================
// 鳳凰 (phoenix)
// ============================================================
const PHOENIX_BABY: PixelDef[] = [
  [3,0,"#E74C3C"],[4,0,"#C0392B"],
  [2,1,"#FF6B6B"],[3,1,"#E74C3C"],[4,1,"#C0392B"],[5,1,"#922B21"],
  [1,2,"#C0392B"],[2,2,"#FFF"],[3,2,"#333"],[4,2,"#FFF"],[5,2,"#333"],[6,2,"#922B21"],
  [1,3,"#E74C3C"],[2,3,"#FF6B6B"],[3,3,"#FFD700"],[4,3,"#E74C3C"],[5,3,"#C0392B"],[6,3,"#922B21"],
  [2,4,"#C0392B"],[3,4,"#E74C3C"],[4,4,"#C0392B"],[5,4,"#922B21"],
  [1,5,"#922B21"],[2,5,"#C0392B"],[3,5,"#C0392B"],[4,5,"#C0392B"],[5,5,"#C0392B"],[6,5,"#7B241C"],
  [2,6,"#922B21"],[5,6,"#922B21"],
  [1,7,"#7B241C"],[2,7,"#7B241C"],[5,7,"#7B241C"],[6,7,"#7B241C"],
];

const PHOENIX_CHILD: PixelDef[] = [
  [4,0,"#FF6B6B"],[5,0,"#E74C3C"],
  [3,1,"#FF6B6B"],[4,1,"#FFD700"],[5,1,"#FF6B6B"],[6,1,"#E74C3C"],
  [2,2,"#E74C3C"],[3,2,"#FF6B6B"],[4,2,"#E74C3C"],[5,2,"#C0392B"],[6,2,"#922B21"],
  [1,3,"#C0392B"],[2,3,"#FFF"],[3,3,"#333"],[4,3,"#E74C3C"],[5,3,"#FFF"],[6,3,"#333"],[7,3,"#922B21"],
  [0,4,"#FFD700"],[1,4,"#E74C3C"],[2,4,"#FF6B6B"],[3,4,"#FFD700"],[4,4,"#FFD700"],[5,4,"#E74C3C"],[6,4,"#C0392B"],[7,4,"#922B21"],[8,4,"#FFD700"],
  [1,5,"#C0392B"],[2,5,"#E74C3C"],[3,5,"#E74C3C"],[4,5,"#E74C3C"],[5,5,"#C0392B"],[6,5,"#922B21"],
  [2,6,"#922B21"],[3,6,"#C0392B"],[4,6,"#C0392B"],[5,6,"#922B21"],[6,6,"#7B241C"],
  [2,7,"#922B21"],[3,7,"#922B21"],[5,7,"#922B21"],[6,7,"#922B21"],
  [1,8,"#7B241C"],[2,8,"#7B241C"],[6,8,"#7B241C"],[7,8,"#7B241C"],
];

const PHOENIX_ADULT: PixelDef[] = [
  [5,0,"#FFD700"],[6,0,"#FF8C00"],
  [4,1,"#FF6B6B"],[5,1,"#FFD700"],[6,1,"#FF6B6B"],[7,1,"#E74C3C"],
  [3,2,"#FF6B6B"],[4,2,"#FFD700"],[5,2,"#FF6B6B"],[6,2,"#E74C3C"],[7,2,"#C0392B"],
  [2,3,"#E74C3C"],[3,3,"#FF6B6B"],[4,3,"#E74C3C"],[5,3,"#C0392B"],[6,3,"#922B21"],[7,3,"#922B21"],
  [1,4,"#C0392B"],[2,4,"#FFF"],[3,4,"#333"],[4,4,"#E74C3C"],[5,4,"#E74C3C"],[6,4,"#FFF"],[7,4,"#333"],[8,4,"#922B21"],
  [0,5,"#FFD700"],[1,5,"#E74C3C"],[2,5,"#FF6B6B"],[3,5,"#FFD700"],[4,5,"#FFD700"],[5,5,"#FFD700"],[6,5,"#E74C3C"],[7,5,"#C0392B"],[8,5,"#922B21"],[9,5,"#FFD700"],
  [1,6,"#C0392B"],[2,6,"#E74C3C"],[3,6,"#E74C3C"],[4,6,"#FF6B6B"],[5,6,"#E74C3C"],[6,6,"#E74C3C"],[7,6,"#C0392B"],[8,6,"#922B21"],
  [0,7,"#FFD700"],[1,7,"#FF8C00"],[2,7,"#922B21"],[3,7,"#C0392B"],[4,7,"#C0392B"],[5,7,"#C0392B"],[6,7,"#922B21"],[7,7,"#7B241C"],[8,7,"#FF8C00"],[9,7,"#FFD700"],
  [2,8,"#922B21"],[3,8,"#922B21"],[4,8,"#922B21"],[5,8,"#922B21"],[6,8,"#922B21"],
  [2,9,"#7B241C"],[3,9,"#7B241C"],[5,9,"#7B241C"],[6,9,"#7B241C"],
];

// ============================================================
// ユニコーン (unicorn)
// ============================================================
const UNICORN_BABY: PixelDef[] = [
  [4,0,"#FFD700"],
  [3,1,"#E8F0FF"],[4,1,"#FFD700"],[5,1,"#D8DEE4"],
  [2,1,"#E8F0FF"],[3,1,"#E8F0FF"],[4,1,"#FFD700"],[5,1,"#D8DEE4"],
  [1,2,"#D8DEE4"],[2,2,"#FFF"],[3,2,"#5DADE2"],[4,2,"#FFF"],[5,2,"#5DADE2"],[6,2,"#C0C8D0"],
  [1,3,"#E8F0FF"],[2,3,"#D8DEE4"],[3,3,"#E88"],[4,3,"#D8DEE4"],[5,3,"#D8DEE4"],[6,3,"#C0C8D0"],
  [2,4,"#D8DEE4"],[3,4,"#E8F0FF"],[4,4,"#E8F0FF"],[5,4,"#D8DEE4"],
  [1,5,"#C0C8D0"],[2,5,"#D8DEE4"],[3,5,"#D8DEE4"],[4,5,"#D8DEE4"],[5,5,"#D8DEE4"],[6,5,"#C0C8D0"],
  [2,6,"#C0C8D0"],[5,6,"#C0C8D0"],
  [1,7,"#A0A8B0"],[2,7,"#A0A8B0"],[5,7,"#A0A8B0"],[6,7,"#A0A8B0"],
];

const UNICORN_CHILD: PixelDef[] = [
  [5,0,"#FFD700"],
  [4,1,"#FFE066"],[5,1,"#FFD700"],
  [3,2,"#E8F0FF"],[4,2,"#E8F0FF"],[5,2,"#D8DEE4"],[6,2,"#D8DEE4"],
  [2,3,"#E8F0FF"],[3,3,"#E8F0FF"],[4,3,"#D8DEE4"],[5,3,"#D8DEE4"],[6,3,"#C0C8D0"],
  [1,4,"#D8DEE4"],[2,4,"#FFF"],[3,4,"#5DADE2"],[4,4,"#D8DEE4"],[5,4,"#FFF"],[6,4,"#5DADE2"],[7,4,"#C0C8D0"],
  [1,5,"#E8F0FF"],[2,5,"#D8DEE4"],[3,5,"#E88"],[4,5,"#E88"],[5,5,"#D8DEE4"],[6,5,"#D8DEE4"],[7,5,"#C0C8D0"],
  [2,6,"#D8DEE4"],[3,6,"#E8F0FF"],[4,6,"#E8F0FF"],[5,6,"#E8F0FF"],[6,6,"#D8DEE4"],
  [1,7,"#C0C8D0"],[2,7,"#D8DEE4"],[3,7,"#D8DEE4"],[4,7,"#9B59B6"],[5,7,"#D8DEE4"],[6,7,"#D8DEE4"],[7,7,"#C0C8D0"],
  [2,8,"#C0C8D0"],[3,8,"#C0C8D0"],[5,8,"#C0C8D0"],[6,8,"#C0C8D0"],
  [1,9,"#A0A8B0"],[2,9,"#A0A8B0"],[6,9,"#A0A8B0"],[7,9,"#A0A8B0"],
];

const UNICORN_ADULT: PixelDef[] = UNICORN_CHILD; // 拡張版は後で

// ============================================================
// 猫 (cat)
// ============================================================
const CAT_BABY: PixelDef[] = [
  [1,0,"#F5CBA7"],[6,0,"#F5CBA7"],
  [1,1,"#FDDCB5"],[2,1,"#F5CBA7"],[5,1,"#F5CBA7"],[6,1,"#FDDCB5"],
  [1,2,"#F5CBA7"],[2,2,"#FFF"],[3,2,"#333"],[4,2,"#FFF"],[5,2,"#333"],[6,2,"#F5CBA7"],
  [1,3,"#FDDCB5"],[2,3,"#F5CBA7"],[3,3,"#E88"],[4,3,"#F5CBA7"],[5,3,"#F5CBA7"],[6,3,"#FDDCB5"],
  [2,4,"#F5CBA7"],[3,4,"#FDDCB5"],[4,4,"#FDDCB5"],[5,4,"#F5CBA7"],
  [1,5,"#D4A574"],[2,5,"#F5CBA7"],[3,5,"#F5CBA7"],[4,5,"#F5CBA7"],[5,5,"#F5CBA7"],[6,5,"#D4A574"],
  [2,6,"#D4A574"],[5,6,"#D4A574"],
  [1,7,"#C08860"],[2,7,"#C08860"],[5,7,"#C08860"],[6,7,"#C08860"],
];

const CAT_CHILD: PixelDef[] = CAT_BABY; // 少し大きめは後で
const CAT_ADULT: PixelDef[] = CAT_BABY;

// ============================================================
// 犬 (dog)
// ============================================================
const DOG_BABY: PixelDef[] = [
  [2,0,"#8B5E3C"],[3,0,"#A0704C"],[4,0,"#A0704C"],[5,0,"#8B5E3C"],
  [1,1,"#A0704C"],[2,1,"#C08860"],[3,1,"#A0704C"],[4,1,"#A0704C"],[5,1,"#C08860"],[6,1,"#8B5E3C"],
  [1,2,"#8B5E3C"],[2,2,"#FFF"],[3,2,"#333"],[4,2,"#FFF"],[5,2,"#333"],[6,2,"#8B5E3C"],
  [1,3,"#A0704C"],[2,3,"#A0704C"],[3,3,"#333"],[4,3,"#A0704C"],[5,3,"#A0704C"],[6,3,"#8B5E3C"],
  [2,4,"#8B5E3C"],[3,4,"#A0704C"],[4,4,"#A0704C"],[5,4,"#8B5E3C"],
  [1,5,"#6B4430"],[2,5,"#8B5E3C"],[3,5,"#8B5E3C"],[4,5,"#8B5E3C"],[5,5,"#8B5E3C"],[6,5,"#6B4430"],
  [2,6,"#6B4430"],[5,6,"#6B4430"],
  [1,7,"#5C3A1E"],[2,7,"#5C3A1E"],[5,7,"#5C3A1E"],[6,7,"#5C3A1E"],
];

const DOG_CHILD: PixelDef[] = DOG_BABY;
const DOG_ADULT: PixelDef[] = DOG_BABY;

// ============================================================
// うさぎ (rabbit)
// ============================================================
const RABBIT_BABY: PixelDef[] = [
  [2,0,"#F5CBA7"],[5,0,"#F5CBA7"],
  [2,1,"#FFB3B3"],[3,1,"#F5CBA7"],[4,1,"#F5CBA7"],[5,1,"#FFB3B3"],
  [2,2,"#F5CBA7"],[3,2,"#FDDCB5"],[4,2,"#FDDCB5"],[5,2,"#F5CBA7"],
  [1,3,"#F5CBA7"],[2,3,"#FFF"],[3,3,"#E74C3C"],[4,3,"#FFF"],[5,3,"#E74C3C"],[6,3,"#F5CBA7"],
  [1,4,"#FDDCB5"],[2,4,"#F5CBA7"],[3,4,"#FFB3B3"],[4,4,"#F5CBA7"],[5,4,"#F5CBA7"],[6,4,"#FDDCB5"],
  [2,5,"#F5CBA7"],[3,5,"#FDDCB5"],[4,5,"#FDDCB5"],[5,5,"#F5CBA7"],
  [1,6,"#D4A574"],[2,6,"#F5CBA7"],[3,6,"#F5CBA7"],[4,6,"#F5CBA7"],[5,6,"#F5CBA7"],[6,6,"#D4A574"],
  [2,7,"#D4A574"],[3,7,"#FFF"],[4,7,"#D4A574"],[5,7,"#D4A574"],
];

const RABBIT_CHILD: PixelDef[] = RABBIT_BABY;
const RABBIT_ADULT: PixelDef[] = RABBIT_BABY;

// ============================================================
// マスターデータ
// ============================================================
type PetPixelData = { pixels: PixelDef[]; gridW: number; gridH: number };

const PET_DATA: Record<string, Record<string, PetPixelData>> = {
  dragon: {
    egg: { pixels: EGG, gridW: 8, gridH: 8 },
    baby: { pixels: DRAGON_BABY, gridW: 8, gridH: 8 },
    child: { pixels: DRAGON_CHILD, gridW: 10, gridH: 10 },
    adult: { pixels: DRAGON_ADULT, gridW: 12, gridH: 10 },
  },
  phoenix: {
    egg: { pixels: EGG, gridW: 8, gridH: 8 },
    baby: { pixels: PHOENIX_BABY, gridW: 8, gridH: 8 },
    child: { pixels: PHOENIX_CHILD, gridW: 10, gridH: 10 },
    adult: { pixels: PHOENIX_ADULT, gridW: 10, gridH: 10 },
  },
  unicorn: {
    egg: { pixels: EGG, gridW: 8, gridH: 8 },
    baby: { pixels: UNICORN_BABY, gridW: 8, gridH: 8 },
    child: { pixels: UNICORN_CHILD, gridW: 10, gridH: 10 },
    adult: { pixels: UNICORN_ADULT, gridW: 10, gridH: 10 },
  },
  cat: {
    egg: { pixels: EGG, gridW: 8, gridH: 8 },
    baby: { pixels: CAT_BABY, gridW: 8, gridH: 8 },
    child: { pixels: CAT_CHILD, gridW: 8, gridH: 8 },
    adult: { pixels: CAT_ADULT, gridW: 8, gridH: 8 },
  },
  dog: {
    egg: { pixels: EGG, gridW: 8, gridH: 8 },
    baby: { pixels: DOG_BABY, gridW: 8, gridH: 8 },
    child: { pixels: DOG_CHILD, gridW: 8, gridH: 8 },
    adult: { pixels: DOG_ADULT, gridW: 8, gridH: 8 },
  },
  rabbit: {
    egg: { pixels: EGG, gridW: 8, gridH: 8 },
    baby: { pixels: RABBIT_BABY, gridW: 8, gridH: 8 },
    child: { pixels: RABBIT_CHILD, gridW: 8, gridH: 8 },
    adult: { pixels: RABBIT_ADULT, gridW: 8, gridH: 8 },
  },
};

const STAGE_IDLE_TYPE: Record<GrowthStage, IdleAnimationType> = {
  egg: "bob",
  baby: "bob",
  child: "bob",
  adult: "bob",
};

export default function PetSvg({ type, stage, happiness = 100, size = 48, animated = false }: Props) {
  const data = PET_DATA[type]?.[stage] || PET_DATA[type]?.egg || { pixels: EGG, gridW: 8, gridH: 8 };
  // 低幸福度でグレーアウト
  const opacity = happiness < 30 ? 0.6 : 1;
  const svg = (
    <Svg width={size} height={size * (data.gridH / data.gridW)} viewBox={`0 0 ${data.gridW * PX} ${data.gridH * PX}`} opacity={opacity}>
      <G>
        {data.pixels.map(([x, y, color], i) => (
          <Rect key={i} x={x * PX} y={y * PX} width={PX} height={PX} fill={happiness < 30 ? desaturate(color) : color} />
        ))}
      </G>
    </Svg>
  );

  if (!animated) return svg;

  const idleType = STAGE_IDLE_TYPE[stage];
  const baseDuration = undefined; // use IdleAnimationWrapper defaults
  const duration = happiness < 30 ? ((baseDuration ?? getDefaultIdleDuration(idleType)) * 2) : baseDuration;

  return (
    <IdleAnimationWrapper type={idleType} duration={duration} forceAnimate>
      {svg}
    </IdleAnimationWrapper>
  );
}

function getDefaultIdleDuration(type: IdleAnimationType): number {
  switch (type) {
    case "bob": return 3;
    case "breathe": return 3;
    case "sway": return 4;
    case "bounce": return 2;
    case "flutter": return 2.5;
    case "pulse": return 2;
    case "spin": return 2;
    case "flicker": return 0.8;
    default: return 3;
  }
}

function desaturate(hex: string): string {
  // 簡易グレースケール変換
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  const gray = Math.round(r * 0.3 + g * 0.5 + b * 0.2);
  const mix = Math.round((gray + r) / 2);
  const mixG = Math.round((gray + g) / 2);
  const mixB = Math.round((gray + b) / 2);
  return `#${mix.toString(16).padStart(2, "0")}${mixG.toString(16).padStart(2, "0")}${mixB.toString(16).padStart(2, "0")}`;
}
