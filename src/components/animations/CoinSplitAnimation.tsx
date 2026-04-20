import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";
import { useReducedMotion } from "../../lib/useReducedMotion";

type Props = {
  visible: boolean;
  onComplete?: () => void;
};

const COINS = [
  { angle: -150, radius: 80, color: "#E74C3C" }, // 左下 (使う)
  { angle: -90, radius: 90, color: "#3498DB" },  // 中央下 (貯める)
  { angle: -30, radius: 80, color: "#2ECC71" },  // 右下 (増やす)
];

/**
 * W2 3分割コイン分岐アニメーション
 * コインが中央に現れ、3方向（使う・貯める・増やす）に分かれて飛ぶ
 */
export default function CoinSplitAnimation({ visible, onComplete }: Props) {
  const reducedMotion = useReducedMotion();

  const scales = useRef(COINS.map(() => new Animated.Value(0))).current;
  const translateXs = useRef(COINS.map(() => new Animated.Value(0))).current;
  const translateYs = useRef(COINS.map(() => new Animated.Value(0))).current;
  const opacities = useRef(COINS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!visible) return;

    if (reducedMotion) {
      const t = setTimeout(() => onComplete?.(), 200);
      return () => clearTimeout(t);
    }

    // Reset
    scales.forEach((s) => s.setValue(0));
    translateXs.forEach((tx) => tx.setValue(0));
    translateYs.forEach((ty) => ty.setValue(0));
    opacities.forEach((o) => o.setValue(0));

    const animations = COINS.map((coin, i) => {
      const rad = (coin.angle * Math.PI) / 180;
      const endX = Math.cos(rad) * coin.radius;
      const endY = Math.sin(rad) * coin.radius;

      return Animated.sequence([
        Animated.delay(i * 100),
        // Scale in + fade in
        Animated.parallel([
          Animated.timing(scales[i], {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacities[i], {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        // Translate to endpoint
        Animated.parallel([
          Animated.timing(translateXs[i], {
            toValue: endX,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(translateYs[i], {
            toValue: endY,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        // Fade out
        Animated.timing(opacities[i], {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start(() => {
      onComplete?.();
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {COINS.map((coin, i) => (
        <Animated.View
          key={i}
          style={[
            styles.coin,
            {
              backgroundColor: "#FFD700",
              opacity: opacities[i],
              transform: [
                { scale: scales[i] },
                { translateX: translateXs[i] },
                { translateY: translateYs[i] },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  coin: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
