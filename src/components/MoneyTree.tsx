import React from "react";
import Svg, {
  Circle,
  Rect,
  Path,
  Ellipse,
  G,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import IdleAnimationWrapper from "./IdleAnimationWrapper";

type Stage = "seed" | "sprout" | "sapling" | "tree";

type Props = {
  investBalance: number;
  size?: number;
  animated?: boolean;
};

function getStage(balance: number): { stage: Stage; label: string; next: number | null } {
  if (balance < 100) return { stage: "seed", label: "たね", next: 100 };
  if (balance < 500) return { stage: "sprout", label: "ふたば", next: 500 };
  if (balance < 1000) return { stage: "sapling", label: "わかぎ", next: 1000 };
  return { stage: "tree", label: "たいぼく", next: null };
}

export { getStage };

/**
 * ふやすの木 — 投資残高に応じて成長するSVGツリー
 * Habitica風ピクセルアート的な温かみのあるデザイン
 *
 * Stage 1: たね (0-99円) — 土に埋まった金の種
 * Stage 2: ふたば (100-499円) — 双葉が生えた小さな芽
 * Stage 3: わかぎ (500-999円) — 葉が茂り始めた若木
 * Stage 4: たいぼく (1000円+) — 金の実がなる大木
 */
export default function MoneyTree({ investBalance, size = 140, animated = false }: Props) {
  const { stage } = getStage(investBalance);

  const svg = (
    <Svg width={size} height={size} viewBox="0 0 140 140">
      <Defs>
        <RadialGradient id="soil" cx="50%" cy="60%" r="50%">
          <Stop offset="0%" stopColor="#8B6914" />
          <Stop offset="100%" stopColor="#6B4E12" />
        </RadialGradient>
        <RadialGradient id="leafGlow" cx="50%" cy="30%" r="60%">
          <Stop offset="0%" stopColor="#6ECF6E" />
          <Stop offset="100%" stopColor="#2E8B2E" />
        </RadialGradient>
        <LinearGradient id="trunk" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#A0724A" />
          <Stop offset="100%" stopColor="#7B5530" />
        </LinearGradient>
        <RadialGradient id="goldFruit" cx="40%" cy="35%" r="50%">
          <Stop offset="0%" stopColor="#FFE066" />
          <Stop offset="100%" stopColor="#DAA520" />
        </RadialGradient>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#E8F5E9" />
          <Stop offset="100%" stopColor="#C8E6C9" />
        </LinearGradient>
      </Defs>

      {/* 背景 */}
      <Rect x="0" y="0" width="140" height="140" rx="16" fill="url(#sky)" />

      {/* 地面 */}
      <Ellipse cx="70" cy="120" rx="55" ry="14" fill="url(#soil)" />

      {stage === "seed" && renderSeed()}
      {stage === "sprout" && renderSprout()}
      {stage === "sapling" && renderSapling()}
      {stage === "tree" && renderTree()}
    </Svg>
  );

  if (!animated) return svg;

  return (
    <IdleAnimationWrapper type="breathe">
      {svg}
    </IdleAnimationWrapper>
  );
}

/** Stage 1: たね — 金色の種が土から少し見えている */
function renderSeed() {
  return (
    <G>
      {/* 土の盛り上がり */}
      <Ellipse cx="70" cy="112" rx="18" ry="8" fill="#7B5530" />
      {/* 金色の種 */}
      <Ellipse cx="70" cy="108" rx="8" ry="6" fill="url(#goldFruit)" />
      {/* 種のハイライト */}
      <Ellipse cx="68" cy="106" rx="3" ry="2" fill="#FFF8DC" opacity={0.6} />
      {/* キラキラ */}
      <SvgText x="82" y="100" fontSize="12" textAnchor="middle">✨</SvgText>
      {/* ラベル */}
      <SvgText x="70" y="80" fontSize="11" fontWeight="bold" fill="#8B6914" textAnchor="middle">
        たね
      </SvgText>
    </G>
  );
}

/** Stage 2: ふたば — 双葉が生えた小さな芽 */
function renderSprout() {
  return (
    <G>
      {/* 茎 */}
      <Rect x="68" y="90" width="4" height="22" rx="2" fill="#5CAD5C" />
      {/* 左の葉 */}
      <Path
        d="M70 92 Q56 80 60 90 Q62 95 70 92"
        fill="#6ECF6E"
        stroke="#4CAF50"
        strokeWidth={0.5}
      />
      {/* 右の葉 */}
      <Path
        d="M70 88 Q84 76 80 86 Q78 91 70 88"
        fill="#6ECF6E"
        stroke="#4CAF50"
        strokeWidth={0.5}
      />
      {/* 地面の種殻 */}
      <Ellipse cx="70" cy="112" rx="10" ry="5" fill="#DAA520" opacity={0.3} />
      {/* キラキラ */}
      <SvgText x="56" y="78" fontSize="10" textAnchor="middle">🌱</SvgText>
      {/* ラベル */}
      <SvgText x="70" y="72" fontSize="11" fontWeight="bold" fill="#4CAF50" textAnchor="middle">
        ふたば
      </SvgText>
    </G>
  );
}

/** Stage 3: わかぎ — 葉が茂り始めた若木 */
function renderSapling() {
  return (
    <G>
      {/* 幹 */}
      <Rect x="66" y="68" width="8" height="44" rx="3" fill="url(#trunk)" />
      {/* 枝（左） */}
      <Path d="M66 80 Q54 72 58 82" fill="none" stroke="#A0724A" strokeWidth={3} strokeLinecap="round" />
      {/* 枝（右） */}
      <Path d="M74 75 Q86 67 82 77" fill="none" stroke="#A0724A" strokeWidth={3} strokeLinecap="round" />
      {/* 葉の塊 */}
      <Ellipse cx="70" cy="58" rx="28" ry="22" fill="url(#leafGlow)" />
      <Ellipse cx="56" cy="66" rx="14" ry="10" fill="#5CB85C" />
      <Ellipse cx="84" cy="64" rx="12" ry="9" fill="#5CB85C" />
      {/* 小さな実 */}
      <Circle cx="58" cy="56" r="4" fill="url(#goldFruit)" />
      <Circle cx="82" cy="54" r="3.5" fill="url(#goldFruit)" />
      {/* ラベル */}
      <SvgText x="70" y="30" fontSize="11" fontWeight="bold" fill="#2E7D32" textAnchor="middle">
        わかぎ
      </SvgText>
    </G>
  );
}

/** Stage 4: たいぼく — 金の実がたくさんなる立派な大木 */
function renderTree() {
  return (
    <G>
      {/* 幹（太い） */}
      <Path
        d="M62 112 Q60 90 64 70 L76 70 Q80 90 78 112 Z"
        fill="url(#trunk)"
      />
      {/* 根 */}
      <Path d="M62 112 Q50 116 48 112" fill="none" stroke="#7B5530" strokeWidth={3} strokeLinecap="round" />
      <Path d="M78 112 Q90 116 92 112" fill="none" stroke="#7B5530" strokeWidth={3} strokeLinecap="round" />
      {/* 枝 */}
      <Path d="M64 78 Q46 66 50 76" fill="none" stroke="#A0724A" strokeWidth={4} strokeLinecap="round" />
      <Path d="M76 72 Q94 60 90 70" fill="none" stroke="#A0724A" strokeWidth={4} strokeLinecap="round" />
      {/* メインの葉 */}
      <Ellipse cx="70" cy="44" rx="38" ry="28" fill="url(#leafGlow)" />
      <Ellipse cx="50" cy="56" rx="18" ry="14" fill="#4CAF50" />
      <Ellipse cx="90" cy="52" rx="16" ry="12" fill="#4CAF50" />
      <Ellipse cx="70" cy="32" rx="22" ry="14" fill="#66BB6A" />
      {/* 金の実（たくさん） */}
      <Circle cx="52" cy="42" r="5" fill="url(#goldFruit)" />
      <Circle cx="88" cy="38" r="5" fill="url(#goldFruit)" />
      <Circle cx="70" cy="30" r="5.5" fill="url(#goldFruit)" />
      <Circle cx="60" cy="52" r="4" fill="url(#goldFruit)" />
      <Circle cx="80" cy="50" r="4.5" fill="url(#goldFruit)" />
      <Circle cx="44" cy="54" r="3.5" fill="url(#goldFruit)" />
      {/* 実のハイライト */}
      <Circle cx="68" cy="28" r="2" fill="#FFF8DC" opacity={0.5} />
      <Circle cx="50" cy="40" r="1.5" fill="#FFF8DC" opacity={0.5} />
      {/* 王冠（最高段階の特別感） */}
      <SvgText x="70" y="16" fontSize="14" textAnchor="middle">👑</SvgText>
    </G>
  );
}
