import React from "react";
import Svg, { Rect, G } from "react-native-svg";

export type ChildGender = "boy" | "girl" | "other";

const PX = 4;
type PixelDef = [number, number, string];

// 共通カラー
const SKIN = "#F5D0A0";
const SKIN_SHADE = "#E8B888";
const EYE = "#2A1A0A";
const MOUTH = "#C0392B";

// 男の子: 短髪、青シャツ、茶パンツ
const BOY_HAIR = "#4A2E18";
const BOY_HAIR_LIGHT = "#6B4A2C";
const BOY_SHIRT = "#3498DB";
const BOY_SHIRT_DARK = "#2980B9";
const BOY_PANTS = "#2C3E50";

const BOY_PIXELS: PixelDef[] = [
  // Row 0: spiky hair top
  [1,0,BOY_HAIR],[2,0,BOY_HAIR],[3,0,BOY_HAIR_LIGHT],[4,0,BOY_HAIR],
  // Row 1: hair full
  [0,1,BOY_HAIR],[1,1,BOY_HAIR_LIGHT],[2,1,BOY_HAIR],[3,1,BOY_HAIR],[4,1,BOY_HAIR_LIGHT],[5,1,BOY_HAIR],
  // Row 2: face with hair sides
  [0,2,BOY_HAIR],[1,2,SKIN],[2,2,SKIN],[3,2,SKIN],[4,2,SKIN],[5,2,BOY_HAIR],
  // Row 3: eyes
  [1,3,SKIN],[2,3,EYE],[3,3,SKIN],[4,3,EYE],[5,3,SKIN_SHADE],
  // Row 4: mouth
  [1,4,SKIN_SHADE],[2,4,SKIN],[3,4,MOUTH],[4,4,SKIN],[5,4,SKIN_SHADE],
  // Row 5: shirt top
  [1,5,BOY_SHIRT],[2,5,BOY_SHIRT],[3,5,BOY_SHIRT],[4,5,BOY_SHIRT],
  // Row 6: shirt body
  [0,6,BOY_SHIRT_DARK],[1,6,BOY_SHIRT],[2,6,BOY_SHIRT],[3,6,BOY_SHIRT],[4,6,BOY_SHIRT],[5,6,BOY_SHIRT_DARK],
  // Row 7: pants/legs
  [1,7,BOY_PANTS],[2,7,BOY_PANTS],[3,7,BOY_PANTS],[4,7,BOY_PANTS],
];

// 女の子: ロングヘア+リボン、黄シャツ、ピンクスカート
const GIRL_HAIR = "#6B3410";
const GIRL_HAIR_LIGHT = "#8B4E1E";
const GIRL_RIBBON = "#E74C3C";
const GIRL_SHIRT = "#F9C33B";
const GIRL_SHIRT_DARK = "#E4B000";
const GIRL_SKIRT = "#E88DA0";

const GIRL_PIXELS: PixelDef[] = [
  // Row 0: ribbon + hair top
  [0,0,GIRL_HAIR],[1,0,GIRL_RIBBON],[2,0,GIRL_HAIR],[3,0,GIRL_HAIR_LIGHT],[4,0,GIRL_RIBBON],[5,0,GIRL_HAIR],
  // Row 1: hair wide
  [0,1,GIRL_HAIR],[1,1,GIRL_HAIR_LIGHT],[2,1,GIRL_HAIR],[3,1,GIRL_HAIR],[4,1,GIRL_HAIR_LIGHT],[5,1,GIRL_HAIR],
  // Row 2: face framed by long hair
  [0,2,GIRL_HAIR],[1,2,SKIN],[2,2,SKIN],[3,2,SKIN],[4,2,SKIN],[5,2,GIRL_HAIR],
  // Row 3: eyes
  [0,3,GIRL_HAIR],[1,3,SKIN],[2,3,EYE],[3,3,SKIN],[4,3,EYE],[5,3,GIRL_HAIR],
  // Row 4: mouth, hair hanging down sides
  [0,4,GIRL_HAIR],[1,4,SKIN_SHADE],[2,4,SKIN],[3,4,MOUTH],[4,4,SKIN],[5,4,GIRL_HAIR],
  // Row 5: shirt top
  [0,5,GIRL_HAIR_LIGHT],[1,5,GIRL_SHIRT],[2,5,GIRL_SHIRT],[3,5,GIRL_SHIRT],[4,5,GIRL_SHIRT],[5,5,GIRL_HAIR_LIGHT],
  // Row 6: shirt body
  [0,6,GIRL_SHIRT_DARK],[1,6,GIRL_SHIRT],[2,6,GIRL_SHIRT],[3,6,GIRL_SHIRT],[4,6,GIRL_SHIRT],[5,6,GIRL_SHIRT_DARK],
  // Row 7: skirt/legs
  [1,7,GIRL_SKIRT],[2,7,GIRL_SKIRT],[3,7,GIRL_SKIRT],[4,7,GIRL_SKIRT],
];

// どちらでもない: ミディアム髪、緑シャツ、グレーパンツ（中性色）
const OTHER_HAIR = "#3F2F5E";
const OTHER_HAIR_LIGHT = "#5A467E";
const OTHER_SHIRT = "#2ECC71";
const OTHER_SHIRT_DARK = "#1E8449";
const OTHER_PANTS = "#6B7580";

const OTHER_PIXELS: PixelDef[] = [
  // Row 0: hair top
  [1,0,OTHER_HAIR],[2,0,OTHER_HAIR_LIGHT],[3,0,OTHER_HAIR],[4,0,OTHER_HAIR_LIGHT],
  // Row 1: hair wide
  [0,1,OTHER_HAIR],[1,1,OTHER_HAIR_LIGHT],[2,1,OTHER_HAIR],[3,1,OTHER_HAIR_LIGHT],[4,1,OTHER_HAIR],[5,1,OTHER_HAIR_LIGHT],
  // Row 2: face + hair sides (medium length)
  [0,2,OTHER_HAIR],[1,2,SKIN],[2,2,SKIN],[3,2,SKIN],[4,2,SKIN],[5,2,OTHER_HAIR],
  // Row 3: eyes
  [0,3,OTHER_HAIR],[1,3,SKIN],[2,3,EYE],[3,3,SKIN],[4,3,EYE],[5,3,SKIN_SHADE],
  // Row 4: mouth
  [1,4,SKIN_SHADE],[2,4,SKIN],[3,4,MOUTH],[4,4,SKIN],[5,4,SKIN_SHADE],
  // Row 5: shirt top
  [1,5,OTHER_SHIRT],[2,5,OTHER_SHIRT],[3,5,OTHER_SHIRT],[4,5,OTHER_SHIRT],
  // Row 6: shirt body
  [0,6,OTHER_SHIRT_DARK],[1,6,OTHER_SHIRT],[2,6,OTHER_SHIRT],[3,6,OTHER_SHIRT],[4,6,OTHER_SHIRT],[5,6,OTHER_SHIRT_DARK],
  // Row 7: pants/legs
  [1,7,OTHER_PANTS],[2,7,OTHER_PANTS],[3,7,OTHER_PANTS],[4,7,OTHER_PANTS],
];

/**
 * 子供選択用キャラクターSVG
 * gender: boy / girl / other の3種
 * ピクセルアート（6x8グリッド）で描画
 */
export default function ChildCharacterSvg({ gender, size = 48 }: { gender: ChildGender; size?: number }) {
  const pixels =
    gender === "boy" ? BOY_PIXELS : gender === "girl" ? GIRL_PIXELS : OTHER_PIXELS;
  const gridW = 6;
  const gridH = 8;
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

/**
 * DB内のicon文字列 (boy/girl/other キーや legacy emoji) から
 * 適切な SVG を返すヘルパー
 */
export function resolveChildGender(icon: string | null | undefined): ChildGender {
  if (icon === "boy") return "boy";
  if (icon === "girl") return "girl";
  if (icon === "other") return "other";
  // legacy emoji推定
  if (icon && /👦|🧒🏻/.test(icon)) return "boy";
  if (icon && /👧|👧🏻/.test(icon)) return "girl";
  return "other";
}
