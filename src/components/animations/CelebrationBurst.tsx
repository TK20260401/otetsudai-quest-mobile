import React, { useEffect, useRef } from "react";
import { Animated, Easing, View, StyleSheet, Dimensions } from "react-native";
import { useReducedMotion } from "../../lib/useReducedMotion";

const CONFETTI_COUNT = 12;
const CONFETTI_COLORS = ["#FFD700", "#E74C3C", "#3498DB", "#2ECC71", "#FF69B4", "#9B59B6"];

type Props = {
  visible: boolean;
  onComplete?: () => void;
};

/**
 * 大達成フィードバック（ペット孵化・バッジ獲得・月次達成）
 *
 * 演出:
 * 1. 全画面フラッシュ（白→透明 200ms）
 * 2. 紙吹雪（12粒、6色、放射状に飛散）
 * 3. visual punch（画面全体 scale 1.02→1.0）
 * 4. 2.5秒後に完了コールバック
 */
export default function CelebrationBurst({ visible, onComplete }: Props) {
  const reducedMotion = useReducedMotion();
  const flash = useRef(new Animated.Value(0)).current;
  const punch = useRef(new Animated.Value(1)).current;
  const confetti = useRef(
    Array.from({ length: CONFETTI_COUNT }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (!visible) return;

    if (reducedMotion) {
      const t = setTimeout(() => onComplete?.(), 200);
      return () => clearTimeout(t);
    }

    const { width, height } = Dimensions.get("window");
    const cx = width / 2;
    const cy = height / 2;

    // 1. Flash
    flash.setValue(0.8);
    Animated.timing(flash, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    // 2. Punch
    punch.setValue(1.02);
    Animated.spring(punch, {
      toValue: 1,
      speed: 30,
      bounciness: 8,
      useNativeDriver: true,
    }).start();

    // 3. Confetti
    const confettiAnims = confetti.map((c, i) => {
      const angle = (Math.PI * 2 * i) / CONFETTI_COUNT;
      const radius = 100 + Math.random() * 80;
      const endX = Math.cos(angle) * radius;
      const endY = Math.sin(angle) * radius - 40; // upward bias

      c.x.setValue(0);
      c.y.setValue(0);
      c.opacity.setValue(0);
      c.rotate.setValue(0);
      c.scale.setValue(0);

      return Animated.sequence([
        Animated.delay(i * 15),
        Animated.parallel([
          Animated.timing(c.opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(c.scale, { toValue: 1, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(c.x, { toValue: endX, duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(c.y, { toValue: endY, duration: 1100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(c.rotate, { toValue: 360 + Math.random() * 180, duration: 1100, useNativeDriver: true }),
        ]),
        Animated.timing(c.opacity, { toValue: 0, duration: 400, delay: 200, useNativeDriver: true }),
      ]);
    });

    Animated.parallel(confettiAnims).start();

    const timeout = setTimeout(() => onComplete?.(), 2500);
    return () => clearTimeout(timeout);
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Flash overlay */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "#FFFFFF", opacity: flash },
        ]}
      />

      {/* Confetti */}
      {confetti.map((c, i) => {
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const size = 6 + Math.random() * 4;
        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "40%",
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color,
              opacity: c.opacity,
              transform: [
                { translateX: c.x },
                { translateY: c.y },
                { scale: c.scale },
                {
                  rotate: c.rotate.interpolate({
                    inputRange: [0, 360],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
            }}
          />
        );
      })}
    </View>
  );
}
