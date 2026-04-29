import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { PixelCheckIcon, PixelStarIcon } from "../PixelIcons";
import { useTheme } from "../../theme";
import { useReducedMotion } from "../../lib/useReducedMotion";

type Props = {
  visible: boolean;
  onComplete: () => void;
};

/** S4: 親承認成功時の✓爆発演出 — 大きなチェックマーク+星3個+バナー */
export default function ApprovalSuccessBurst({ visible, onComplete }: Props) {
  const { palette } = useTheme();
  const reducedMotion = useReducedMotion();
  const checkScale = useRef(new Animated.Value(0)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const stars = useRef([0, 1, 2].map(() => ({
    x: new Animated.Value(0),
    y: new Animated.Value(0),
    opacity: new Animated.Value(0),
    rotate: new Animated.Value(0),
  }))).current;

  useEffect(() => {
    if (!visible) return;
    if (reducedMotion) {
      const t = setTimeout(onComplete, 200);
      return () => clearTimeout(t);
    }

    checkScale.setValue(0);
    bannerOpacity.setValue(0);
    stars.forEach((s) => {
      s.x.setValue(0);
      s.y.setValue(0);
      s.opacity.setValue(0);
      s.rotate.setValue(0);
    });

    const checkAnim = Animated.sequence([
      Animated.spring(checkScale, { toValue: 1.3, friction: 4, tension: 60, useNativeDriver: true }),
      Animated.spring(checkScale, { toValue: 1.0, friction: 4, useNativeDriver: true }),
    ]);
    const banner = Animated.sequence([
      Animated.delay(150),
      Animated.timing(bannerOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(bannerOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]);
    const starAnims = stars.map((s, i) => {
      const angle = (i * 120 + 30) * (Math.PI / 180);
      const distance = 60;
      return Animated.parallel([
        Animated.timing(s.x, { toValue: Math.cos(angle) * distance, duration: 700, delay: 100 + i * 50, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(s.y, { toValue: Math.sin(angle) * distance, duration: 700, delay: 100 + i * 50, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(s.opacity, { toValue: 1, duration: 100, delay: 100 + i * 50, useNativeDriver: true }),
          Animated.timing(s.opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
        Animated.timing(s.rotate, { toValue: 1, duration: 700, delay: 100 + i * 50, useNativeDriver: true }),
      ]);
    });

    Animated.parallel([checkAnim, banner, ...starAnims]).start(() => {
      onComplete();
    });
  }, [visible, reducedMotion, onComplete, checkScale, bannerOpacity, stars]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <View style={styles.center}>
        <Animated.View style={{ transform: [{ scale: checkScale }] }}>
          <View style={[styles.checkRing, { backgroundColor: palette.greenLight ?? "#a8e6cf", borderColor: palette.green ?? "#2ECC71" }]}>
            <PixelCheckIcon size={64} />
          </View>
        </Animated.View>
        {stars.map((s, i) => (
          <Animated.View
            key={i}
            style={[
              styles.star,
              {
                opacity: s.opacity,
                transform: [
                  { translateX: s.x },
                  { translateY: s.y },
                  { rotate: s.rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) },
                ],
              },
            ]}
          >
            <PixelStarIcon size={20} />
          </Animated.View>
        ))}
        <Animated.View style={[styles.banner, { opacity: bannerOpacity, backgroundColor: palette.surface, borderColor: palette.accent }]}>
          <Text style={[styles.bannerText, { color: palette.textStrong }]}>しょうにんしました！</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  checkRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  star: {
    position: "absolute",
  },
  banner: {
    marginTop: 80,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  bannerText: {
    fontSize: 16,
    fontWeight: "800",
  },
});
