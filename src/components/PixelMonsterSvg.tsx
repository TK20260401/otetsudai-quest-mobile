import React from "react";
import Svg, { Rect, G } from "react-native-svg";
import IdleAnimationWrapper, { type IdleAnimationType } from "./IdleAnimationWrapper";

type MonsterType = "slime" | "bat" | "goblin" | "mushroom";

type Props = {
  type: MonsterType;
  defeated?: boolean;
  size?: number;
  animated?: boolean;
};

const MONSTER_IDLE: Record<MonsterType, IdleAnimationType> = {
  slime: "bob",
  bat: "flutter",
  goblin: "sway",
  mushroom: "breathe",
};

const PX = 3;
type PixelDef = [number, number, string];

function PixelGrid({ pixels, gridW, gridH, size, opacity }: { pixels: PixelDef[]; gridW: number; gridH: number; size: number; opacity?: number }) {
  return (
    <Svg width={size} height={size * (gridH / gridW)} viewBox={`0 0 ${gridW * PX} ${gridH * PX}`} opacity={opacity ?? 1}>
      <G>
        {pixels.map(([x, y, color], i) => (
          <Rect key={i} x={x * PX} y={y * PX} width={PX} height={PX} fill={color} />
        ))}
      </G>
    </Svg>
  );
}

const SLIME: PixelDef[] = [
  [4,0,"#7B4CDB"],[5,0,"#7B4CDB"],
  [3,1,"#9B6CEB"],[4,1,"#7B4CDB"],[5,1,"#7B4CDB"],[6,1,"#9B6CEB"],
  [2,2,"#9B6CEB"],[3,2,"#BB8CFB"],[4,2,"#9B6CEB"],[5,2,"#9B6CEB"],[6,2,"#BB8CFB"],[7,2,"#7B4CDB"],
  [1,3,"#7B4CDB"],[2,3,"#9B6CEB"],[3,3,"#FFFFFF"],[4,3,"#333"],[5,3,"#9B6CEB"],[6,3,"#FFFFFF"],[7,3,"#333"],[8,3,"#7B4CDB"],
  [1,4,"#5A2DAA"],[2,4,"#7B4CDB"],[3,4,"#9B6CEB"],[4,4,"#9B6CEB"],[5,4,"#7B4CDB"],[6,4,"#9B6CEB"],[7,4,"#9B6CEB"],[8,4,"#5A2DAA"],
  [1,5,"#5A2DAA"],[2,5,"#7B4CDB"],[3,5,"#7B4CDB"],[4,5,"#E74C3C"],[5,5,"#E74C3C"],[6,5,"#7B4CDB"],[7,5,"#7B4CDB"],[8,5,"#5A2DAA"],
  [2,6,"#5A2DAA"],[3,6,"#5A2DAA"],[4,6,"#7B4CDB"],[5,6,"#7B4CDB"],[6,6,"#5A2DAA"],[7,6,"#5A2DAA"],
  [3,7,"#3D1A7A"],[4,7,"#5A2DAA"],[5,7,"#5A2DAA"],[6,7,"#3D1A7A"],
];

const BAT: PixelDef[] = [
  [1,0,"#444"],[8,0,"#444"],
  [0,1,"#555"],[1,1,"#333"],[2,1,"#444"],[7,1,"#444"],[8,1,"#333"],[9,1,"#555"],
  [0,2,"#555"],[1,2,"#444"],[2,2,"#333"],[3,2,"#444"],[6,2,"#444"],[7,2,"#333"],[8,2,"#444"],[9,2,"#555"],
  [1,3,"#444"],[2,3,"#333"],[3,3,"#FF0"],[4,3,"#333"],[5,3,"#333"],[6,3,"#FF0"],[7,3,"#333"],[8,3,"#444"],
  [2,4,"#333"],[3,4,"#444"],[4,4,"#333"],[5,4,"#333"],[6,4,"#444"],[7,4,"#333"],
  [3,5,"#333"],[4,5,"#E74C3C"],[5,5,"#E74C3C"],[6,5,"#333"],
  [4,6,"#333"],[5,6,"#333"],
  [4,7,"#222"],[5,7,"#222"],
];

const GOBLIN: PixelDef[] = [
  [4,0,"#2ECC71"],[5,0,"#2ECC71"],
  [3,1,"#27AE60"],[4,1,"#2ECC71"],[5,1,"#2ECC71"],[6,1,"#27AE60"],
  [2,2,"#2ECC71"],[3,2,"#FFF"],[4,2,"#333"],[5,2,"#2ECC71"],[6,2,"#FFF"],[7,2,"#333"],
  [2,3,"#27AE60"],[3,3,"#2ECC71"],[4,3,"#2ECC71"],[5,3,"#E74C3C"],[6,3,"#2ECC71"],[7,3,"#27AE60"],
  [1,4,"#8B5E3C"],[2,4,"#A0704C"],[3,4,"#8B5E3C"],[4,4,"#A0704C"],[5,4,"#8B5E3C"],[6,4,"#A0704C"],[7,4,"#8B5E3C"],[8,4,"#A0704C"],
  [2,5,"#8B5E3C"],[3,5,"#A0704C"],[4,5,"#8B5E3C"],[5,5,"#A0704C"],[6,5,"#8B5E3C"],[7,5,"#A0704C"],
  [1,6,"#27AE60"],[2,6,"#27AE60"],[7,6,"#27AE60"],[8,6,"#27AE60"],
  [3,7,"#8B5E3C"],[4,7,"#8B5E3C"],[5,7,"#8B5E3C"],[6,7,"#8B5E3C"],
  [3,8,"#6B4430"],[4,8,"#6B4430"],[5,8,"#6B4430"],[6,8,"#6B4430"],
];

const MUSHROOM: PixelDef[] = [
  [2,0,"#E74C3C"],[3,0,"#C0392B"],[4,0,"#E74C3C"],[5,0,"#C0392B"],
  [1,1,"#E74C3C"],[2,1,"#FFF"],[3,1,"#E74C3C"],[4,1,"#C0392B"],[5,1,"#FFF"],[6,1,"#C0392B"],
  [0,2,"#C0392B"],[1,2,"#E74C3C"],[2,2,"#FFF"],[3,2,"#E74C3C"],[4,2,"#C0392B"],[5,2,"#E74C3C"],[6,2,"#FFF"],[7,2,"#C0392B"],
  [0,3,"#922B21"],[1,3,"#C0392B"],[2,3,"#E74C3C"],[3,3,"#C0392B"],[4,3,"#922B21"],[5,3,"#C0392B"],[6,3,"#C0392B"],[7,3,"#922B21"],
  [1,4,"#F5CBA7"],[2,4,"#F5CBA7"],[3,4,"#FDDCB5"],[4,4,"#FDDCB5"],[5,4,"#F5CBA7"],[6,4,"#F5CBA7"],
  [2,5,"#FDDCB5"],[3,5,"#333"],[4,5,"#FDDCB5"],[5,5,"#333"],
  [2,6,"#FDDCB5"],[3,6,"#FDDCB5"],[4,6,"#E88"],[5,6,"#FDDCB5"],
  [3,7,"#F5CBA7"],[4,7,"#F5CBA7"],
  [3,8,"#8B5E3C"],[4,8,"#8B5E3C"],
  [2,9,"#6B4430"],[3,9,"#8B5E3C"],[4,9,"#8B5E3C"],[5,9,"#6B4430"],
];

const MONSTERS: Record<MonsterType, { pixels: PixelDef[]; gridW: number; gridH: number }> = {
  slime: { pixels: SLIME, gridW: 10, gridH: 8 },
  bat: { pixels: BAT, gridW: 10, gridH: 8 },
  goblin: { pixels: GOBLIN, gridW: 10, gridH: 10 },
  mushroom: { pixels: MUSHROOM, gridW: 8, gridH: 10 },
};

export const MONSTER_TYPES: MonsterType[] = ["slime", "bat", "goblin", "mushroom"];

export default function PixelMonsterSvg({ type, defeated = false, size = 48, animated = false }: Props) {
  const m = MONSTERS[type];
  const svg = <PixelGrid pixels={m.pixels} gridW={m.gridW} gridH={m.gridH} size={size} opacity={defeated ? 0.35 : 1} />;

  if (!animated) return svg;

  return (
    <IdleAnimationWrapper type={MONSTER_IDLE[type]} paused={defeated}>
      {svg}
    </IdleAnimationWrapper>
  );
}
