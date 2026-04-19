import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Easing,
  AccessibilityInfo,
  useWindowDimensions,
} from "react-native";

type Props = {
  visible: boolean;
  onComplete?: () => void;
};

/** レベルアップ瞬間の光爆発演出（3層 radial ring + LEVEL UP! bounce + flash） */
export default function LevelUpBurst({ visible, onComplete }: Props) {
  const { width, height } = useWindowDimensions();
  const ringGold = useRef(new Animated.Value(0)).current;
  const ringWhite = useRef(new Animated.Value(0)).current;
  const ringPurple = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;
  const reducedMotion = useRef(false);

  const center = useMemo(
    () => ({ x: width / 2, y: height / 2 }),
    [width, height]
  );

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      reducedMotion.current = v;
    });
  }, []);

  useEffect(() => {
    if (!visible) return;

    if (reducedMotion.current) {
      const t = setTimeout(() => onComplete?.(), 200);
      return () => clearTimeout(t);
    }

    ringGold.setValue(0);
    ringWhite.setValue(0);
    ringPurple.setValue(0);
    flash.setValue(0);
    text.setValue(0);

    Animated.parallel([
      // フラッシュ（0.1s の明転）
      Animated.sequence([
        Animated.timing(flash, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(flash, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // 3層 ring（ゴールド → 白 → パープル で時間差）
      Animated.timing(ringGold, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(120),
        Animated.timing(ringWhite, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(240),
        Animated.timing(ringPurple, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // LEVEL UP! テキスト bounce
      Animated.sequence([
        Animated.delay(150),
        Animated.spring(text, {
          toValue: 1,
          friction: 4,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.delay(500),
        Animated.timing(text, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onComplete?.());
  }, [visible, ringGold, ringWhite, ringPurple, flash, text, onComplete]);

  if (!visible) return null;

  const ringStyle = (anim: Animated.Value, color: string) => ({
    position: "absolute" as const,
    left: center.x - 80,
    top: center.y - 80,
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    borderColor: color,
    opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.9, 0.6, 0] }),
    transform: [
      {
        scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 3] }),
      },
    ],
  });

  return (
    <View pointerEvents="none" style={styles.root} accessibilityElementsHidden>
      <Animated.View
        style={[
          styles.flash,
          { opacity: flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }) },
        ]}
      />
      <Animated.View style={ringStyle(ringGold, "#FFD700")} />
      <Animated.View style={ringStyle(ringWhite, "#FFFFFF")} />
      <Animated.View style={ringStyle(ringPurple, "#6B4CDB")} />
      <Animated.View
        style={[
          styles.textWrap,
          {
            left: center.x - 120,
            top: center.y - 24,
            opacity: text,
            transform: [
              {
                scale: text.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1.2] }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.text}>LEVEL UP!</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10000,
    elevation: 10000,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
  },
  textWrap: {
    position: "absolute",
    width: 240,
    alignItems: "center",
  },
  text: {
    fontSize: 42,
    fontWeight: "900",
    color: "#FFD700",
    letterSpacing: 4,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});
