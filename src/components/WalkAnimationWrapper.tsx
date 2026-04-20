import React, { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Easing } from "react-native";
import { useReducedMotion } from "../lib/useReducedMotion";

type Props = {
  mode: "idle" | "walk";
  frameA: ReactNode;
  frameB: ReactNode;
  period?: number;
  children?: never;
};

/**
 * 2フレームパカパカ歩行アニメーション
 *
 * - mode="walk": frameA/frameB を period(500ms) 周期で切替
 *   + 全身 translateY ±1px bounce
 * - mode="idle": frameA のみ表示
 * - useReducedMotion: 常に idle フォールバック
 */
export default function WalkAnimationWrapper({
  mode,
  frameA,
  frameB,
  period = 500,
}: Props) {
  const reducedMotion = useReducedMotion();
  const [showB, setShowB] = useState(false);
  const bounceY = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  const isWalking = mode === "walk" && !reducedMotion;

  // フレーム切替（setInterval）
  useEffect(() => {
    if (!isWalking) {
      setShowB(false);
      return;
    }
    const interval = setInterval(() => {
      setShowB((prev) => !prev);
    }, period / 2);
    return () => clearInterval(interval);
  }, [isWalking, period]);

  // バウンス（Animated）
  useEffect(() => {
    if (!isWalking) {
      bounceY.setValue(0);
      loopRef.current?.stop();
      loopRef.current = null;
      return;
    }

    const halfPeriod = period / 2;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceY, {
          toValue: -1.5,
          duration: halfPeriod,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceY, {
          toValue: 1.5,
          duration: halfPeriod,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loopRef.current = loop;
    loop.start();

    return () => {
      loop.stop();
      loopRef.current = null;
    };
  }, [isWalking, period, bounceY]);

  if (!isWalking) {
    return <>{frameA}</>;
  }

  return (
    <Animated.View style={{ transform: [{ translateY: bounceY }] }}>
      {showB ? frameB : frameA}
    </Animated.View>
  );
}
