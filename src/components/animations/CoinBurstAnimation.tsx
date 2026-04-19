import React, { useEffect, useRef, useMemo } from "react";
import { View, Animated, StyleSheet, Easing, AccessibilityInfo } from "react-native";
import { PixelCoinIcon } from "../PixelIcons";

type Props = {
  visible: boolean;
  /** 画面中心からの相対位置（指定なしなら画面中央） */
  origin?: { x: number; y: number };
  count?: number;
  onComplete?: () => void;
};

type CoinSlot = {
  tx: Animated.Value;
  ty: Animated.Value;
  opacity: Animated.Value;
  rot: Animated.Value;
};

/** クエスト完了時のコイン飛散演出（放射状バースト＋上方向ドリフト） */
export default function CoinBurstAnimation({
  visible,
  origin,
  count = 10,
  onComplete,
}: Props) {
  const slots = useMemo<CoinSlot[]>(
    () =>
      Array.from({ length: count }, () => ({
        tx: new Animated.Value(0),
        ty: new Animated.Value(0),
        opacity: new Animated.Value(0),
        rot: new Animated.Value(0),
      })),
    [count]
  );

  const reducedMotion = useRef(false);

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

    slots.forEach((s, i) => {
      s.tx.setValue(0);
      s.ty.setValue(0);
      s.opacity.setValue(0);
      s.rot.setValue(0);

      const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
      const radius = 80 + Math.random() * 40;
      const endX = Math.cos(angle) * radius;
      const endY = Math.sin(angle) * radius - 60; // 上方向ドリフト
      const delay = i * 15;

      Animated.parallel([
        Animated.sequence([
          Animated.timing(s.opacity, {
            toValue: 1,
            duration: 100,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(s.opacity, {
            toValue: 0,
            duration: 700,
            delay: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(s.tx, {
          toValue: endX,
          duration: 1100,
          delay,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(s.ty, {
          toValue: endY,
          duration: 1100,
          delay,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(s.rot, {
          toValue: 1 + Math.random() * 1,
          duration: 1100,
          delay,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (i === count - 1) onComplete?.();
      });
    });
  }, [visible, slots, count, onComplete]);

  if (!visible) return null;

  const centerX = origin?.x ?? 0;
  const centerY = origin?.y ?? 0;

  return (
    <View pointerEvents="none" style={styles.root} accessibilityElementsHidden>
      {slots.map((s, i) => (
        <Animated.View
          key={i}
          style={[
            styles.coin,
            {
              left: centerX,
              top: centerY,
              opacity: s.opacity,
              transform: [
                { translateX: s.tx },
                { translateY: s.ty },
                {
                  rotate: s.rot.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
            },
          ]}
        >
          <PixelCoinIcon size={28} />
        </Animated.View>
      ))}
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
    zIndex: 9999,
    elevation: 9999,
  },
  coin: {
    position: "absolute",
    width: 28,
    height: 28,
  },
});
