import React from "react";
import { View } from "react-native";
import Svg, { Rect, Circle, Text as SvgText, G, Defs, LinearGradient, Stop } from "react-native-svg";
import { getDungeonFloor, type DungeonFloor } from "../lib/rpg-stats";

type Props = {
  totalQuests: number;
};

export default function DungeonMap({ totalQuests }: Props) {
  const { floor, progress } = getDungeonFloor(totalQuests);

  const floors: { num: number; info: DungeonFloor }[] = [];
  for (let i = floor + 2; i >= Math.max(1, floor - 2); i--) {
    floors.push({ num: i, info: getDungeonFloor((i - 1) * 10) });
  }

  return (
    <View style={{ marginTop: 8 }}>
      <Svg width="100%" height={180} viewBox="0 0 300 180">
        <Defs>
          <LinearGradient id="dm-stone" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#4A4A5E" />
            <Stop offset="100%" stopColor="#2A2A3E" />
          </LinearGradient>
          <LinearGradient id="dm-boss" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#5E2A2A" />
            <Stop offset="100%" stopColor="#3E1A1A" />
          </LinearGradient>
          <LinearGradient id="dm-treasure" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#5E5A2A" />
            <Stop offset="100%" stopColor="#3E3A1A" />
          </LinearGradient>
        </Defs>

        <Rect width={300} height={180} rx={8} fill="#1A1A2E" />

        {floors.map((f, idx) => {
          const y = idx * 34 + 8;
          const isCurrent = f.num === floor;
          const floorType = f.info.type;
          const bgFill = floorType === "boss" ? "url(#dm-boss)" : floorType === "treasure" ? "url(#dm-treasure)" : "url(#dm-stone)";

          return (
            <G key={f.num}>
              <Rect x={10} y={y} width={280} height={28} rx={4} fill={bgFill}
                stroke={isCurrent ? "#FFD700" : "#333"} strokeWidth={isCurrent ? 2 : 1} />

              <SvgText x={24} y={y + 18} fontSize={10} fontWeight="bold" fill={isCurrent ? "#FFD700" : "#888"} textAnchor="middle">
                B{f.num}F
              </SvgText>

              {floorType === "boss" && (
                <G>
                  <Circle cx={50} cy={y + 12} r={5} fill="#E74C3C" opacity={0.8} />
                  <Circle cx={48} cy={y + 11} r={1.5} fill="#1A1A2E" />
                  <Circle cx={52} cy={y + 11} r={1.5} fill="#1A1A2E" />
                </G>
              )}
              {floorType === "treasure" && (
                <G>
                  <Rect x={44} y={y + 12} width={12} height={8} rx={1} fill="#DAA520" />
                  <Rect x={44} y={y + 8} width={12} height={6} rx={1} fill="#A0724A" />
                  <Rect x={48} y={y + 13} width={4} height={3} rx={1} fill="#FFD700" />
                </G>
              )}
              {floorType === "normal" && (
                <G>
                  <Rect x={49} y={y + 12} width={2} height={8} fill="#8B5E3C" />
                  <Circle cx={50} cy={y + 11} r={3} fill="#FF8C00" opacity={0.8} />
                  <Circle cx={50} cy={y + 10} r={2} fill="#FFD700" opacity={0.6} />
                </G>
              )}

              <SvgText x={66} y={y + 18} fontSize={9} fill={isCurrent ? "#FFF" : "#666"}>
                {floorType === "boss" ? "ボスフロア" : floorType === "treasure" ? "たからべや" : `フロア ${f.num}`}
              </SvgText>

              {isCurrent && (
                <G>
                  <Rect x={150} y={y + 8} width={100} height={10} rx={5} fill="#2A2A3E" />
                  <Rect x={150} y={y + 8} width={progress * 10} height={10} rx={5} fill="#FFD700" />
                  <SvgText x={255} y={y + 17} fontSize={8} fill="#FFD700">
                    {progress}/10
                  </SvgText>
                </G>
              )}

              {f.num > floor && (
                <G>
                  <Rect x={150} y={y + 8} width={100} height={10} rx={5} fill="#222" />
                  <SvgText x={200} y={y + 17} fontSize={8} fill="#444" textAnchor="middle">???</SvgText>
                </G>
              )}

              {f.num < floor && (
                <SvgText x={270} y={y + 18} fontSize={10} fill="#4CAF50" textAnchor="middle">✓</SvgText>
              )}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
