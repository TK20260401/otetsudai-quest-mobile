import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { useReducedMotion } from "../../lib/useReducedMotion";

type Props = {
  children: React.ReactNode;
  shaking: boolean;
  intensity?: "subtle" | "strong";
};

/**
 * P1 卵の揺れアニメーション
 * subtle: ±2°/800ms（孵化前の予兆）
 * strong: ±5°/400ms（もうすぐ孵化！）
 */
export default function EggShake({ children, shaking, intensity = "subtle" }: Props) {
  const reducedMotion = useReducedMotion();
  const rotation = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!shaking || reducedMotion) {
      animRef.current?.stop();
      animRef.current = null;
      rotation.setValue(0);
      return;
    }

    const degrees = intensity === "strong" ? 5 : 2;
    const period = intensity === "strong" ? 400 : 800;
    const halfPeriod = period / 4;

    const sequence = Animated.sequence([
      Animated.timing(rotation, {
        toValue: degrees,
        duration: halfPeriod,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: -degrees,
        duration: halfPeriod * 2,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: 0,
        duration: halfPeriod,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ]);

    animRef.current = Animated.loop(sequence);
    animRef.current.start();

    return () => {
      animRef.current?.stop();
      animRef.current = null;
      rotation.setValue(0);
    };
  }, [shaking, intensity, reducedMotion]);

  if (reducedMotion) {
    return <>{children}</>;
  }

  const rotate = rotation.interpolate({
    inputRange: [-10, 10],
    outputRange: ["-10deg", "10deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      {children}
    </Animated.View>
  );
}
