import React, { useEffect, useRef } from "react";
import { Animated, Easing, View, StyleSheet } from "react-native";
import { useReducedMotion } from "../lib/useReducedMotion";
import Svg, { Circle, Rect, Path, Ellipse, G } from "react-native-svg";

type Preset = "dungeon" | "outdoor" | "home";

type Props = {
  preset: Preset;
  /** モーダル表示中など: true で 0.3倍速に減速 */
  slowdown?: boolean;
  width?: number;
  height?: number;
};

/**
 * 背景アンビエント演出
 *
 * - dungeon: トーチ炎flicker + 奥の星pulse(3個)
 * - outdoor: 雲sway(30秒周期) + 木breathe
 * - home: 小鳥/蝶がflutterで横切り(10秒に1回)
 *
 * useReducedMotion 時は全て非表示
 */
export default function BackgroundAmbient({
  preset,
  slowdown = false,
  width = 400,
  height = 200,
}: Props) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) return null;

  switch (preset) {
    case "dungeon":
      return <DungeonAmbient slowdown={slowdown} width={width} height={height} />;
    case "outdoor":
      return <OutdoorAmbient slowdown={slowdown} width={width} height={height} />;
    case "home":
      return <HomeAmbient slowdown={slowdown} width={width} height={height} />;
  }
}

// ── Dungeon: トーチ炎 + 星 ──

function DungeonAmbient({ slowdown, width, height }: { slowdown: boolean; width: number; height: number }) {
  const flicker1 = useRef(new Animated.Value(1)).current;
  const flicker2 = useRef(new Animated.Value(1)).current;
  const starPulse = useRef(new Animated.Value(0.3)).current;

  const speed = slowdown ? 0.3 : 1;

  useEffect(() => {
    const flickerAnim = (val: Animated.Value, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 0.4, duration: dur / speed, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(val, { toValue: 1, duration: (dur * 0.7) / speed, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.6, duration: (dur * 0.5) / speed, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(val, { toValue: 1, duration: dur / speed, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );

    const starAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(starPulse, { toValue: 0.8, duration: 2000 / speed, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(starPulse, { toValue: 0.3, duration: 2000 / speed, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    const f1 = flickerAnim(flicker1, 800);
    const f2 = flickerAnim(flicker2, 1200);

    f1.start();
    f2.start();
    starAnim.start();

    return () => { f1.stop(); f2.stop(); starAnim.stop(); };
  }, [speed, flicker1, flicker2, starPulse]);

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      {/* トーチ炎（左） */}
      <Animated.View style={[styles.torch, { left: 20, top: 30, opacity: flicker1 }]}>
        <Svg width={8} height={12} viewBox="0 0 8 12">
          <Ellipse cx={4} cy={6} rx={3} ry={5} fill="#FF8C00" />
          <Ellipse cx={4} cy={5} rx={2} ry={3} fill="#FFD700" />
        </Svg>
      </Animated.View>
      {/* トーチ炎（右） */}
      <Animated.View style={[styles.torch, { right: 20, top: 30, opacity: flicker2 }]}>
        <Svg width={8} height={12} viewBox="0 0 8 12">
          <Ellipse cx={4} cy={6} rx={3} ry={5} fill="#FF8C00" />
          <Ellipse cx={4} cy={5} rx={2} ry={3} fill="#FFD700" />
        </Svg>
      </Animated.View>
      {/* 星（3個） */}
      {[{ x: 60, y: 15 }, { x: 180, y: 25 }, { x: 300, y: 10 }].map((pos, i) => (
        <Animated.View key={i} style={[styles.star, { left: pos.x, top: pos.y, opacity: starPulse }]}>
          <Svg width={4} height={4} viewBox="0 0 4 4">
            <Circle cx={2} cy={2} r={1.5} fill="#E8E0FF" />
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}

// ── Outdoor: 雲 + 木 ──

function OutdoorAmbient({ slowdown, width, height }: { slowdown: boolean; width: number; height: number }) {
  const cloud1X = useRef(new Animated.Value(-60)).current;
  const cloud2X = useRef(new Animated.Value(-100)).current;
  const treeBreathe = useRef(new Animated.Value(1)).current;

  const speed = slowdown ? 0.3 : 1;

  useEffect(() => {
    const cloudAnim = (val: Animated.Value, start: number, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: width + 60, duration: dur / speed, easing: Easing.linear, useNativeDriver: true }),
          Animated.timing(val, { toValue: start, duration: 0, useNativeDriver: true }),
        ])
      );

    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(treeBreathe, { toValue: 1.02, duration: 3000 / speed, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(treeBreathe, { toValue: 1, duration: 3000 / speed, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    const c1 = cloudAnim(cloud1X, -60, 30000);
    const c2 = cloudAnim(cloud2X, -100, 45000);

    c1.start();
    c2.start();
    breathe.start();

    return () => { c1.stop(); c2.stop(); breathe.stop(); };
  }, [speed, width, cloud1X, cloud2X, treeBreathe]);

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      {/* 雲1 */}
      <Animated.View style={[styles.cloud, { top: 10, transform: [{ translateX: cloud1X }] }]}>
        <Svg width={50} height={20} viewBox="0 0 50 20">
          <Ellipse cx={15} cy={12} rx={12} ry={8} fill="rgba(255,255,255,0.15)" />
          <Ellipse cx={30} cy={10} rx={15} ry={10} fill="rgba(255,255,255,0.12)" />
          <Ellipse cx={42} cy={13} rx={8} ry={6} fill="rgba(255,255,255,0.1)" />
        </Svg>
      </Animated.View>
      {/* 雲2 */}
      <Animated.View style={[styles.cloud, { top: 35, transform: [{ translateX: cloud2X }] }]}>
        <Svg width={40} height={16} viewBox="0 0 40 16">
          <Ellipse cx={12} cy={10} rx={10} ry={6} fill="rgba(255,255,255,0.1)" />
          <Ellipse cx={28} cy={8} rx={12} ry={8} fill="rgba(255,255,255,0.08)" />
        </Svg>
      </Animated.View>
      {/* 木 breathe */}
      <Animated.View style={{ position: "absolute", right: 10, bottom: 10, transform: [{ scale: treeBreathe }] }}>
        <Svg width={20} height={30} viewBox="0 0 20 30">
          <Rect x={8} y={20} width={4} height={10} fill="#5D4037" />
          <Ellipse cx={10} cy={14} rx={8} ry={10} fill="#2E7D32" />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ── Home: 小鳥/蝶 flutter ──

function HomeAmbient({ slowdown, width, height }: { slowdown: boolean; width: number; height: number }) {
  const birdX = useRef(new Animated.Value(-20)).current;
  const birdY = useRef(new Animated.Value(0)).current;
  const birdOpacity = useRef(new Animated.Value(0)).current;

  const speed = slowdown ? 0.3 : 1;

  useEffect(() => {
    const flyAcross = () => {
      birdX.setValue(-20);
      birdOpacity.setValue(0);
      const y = 20 + Math.random() * (height * 0.4);
      birdY.setValue(y);

      Animated.sequence([
        // フェードイン
        Animated.timing(birdOpacity, { toValue: 0.7, duration: 300 / speed, useNativeDriver: true }),
        // 横切り
        Animated.timing(birdX, { toValue: width + 20, duration: 4000 / speed, easing: Easing.linear, useNativeDriver: true }),
        // フェードアウト
        Animated.timing(birdOpacity, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    };

    flyAcross();
    const interval = setInterval(flyAcross, 10000 / speed);

    return () => clearInterval(interval);
  }, [speed, width, height, birdX, birdY, birdOpacity]);

  return (
    <View style={[styles.container, { width, height }]} pointerEvents="none">
      <Animated.View style={{ position: "absolute", opacity: birdOpacity, transform: [{ translateX: birdX }, { translateY: birdY }] }}>
        <Svg width={12} height={8} viewBox="0 0 12 8">
          {/* 蝶シルエット */}
          <Path d="M6,4 Q3,0 0,2 Q3,4 6,4 Q9,0 12,2 Q9,4 6,4Z" fill="#FFD700" opacity={0.6} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "hidden",
  },
  torch: {
    position: "absolute",
  },
  star: {
    position: "absolute",
  },
  cloud: {
    position: "absolute",
  },
});
