import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, ViewStyle, StyleSheet } from "react-native";
import { useReducedMotion } from "../lib/useReducedMotion";

type Props = {
  children: React.ReactNode;
  shake: boolean;
  onShakeEnd?: () => void;
  style?: ViewStyle;
};

/**
 * E1 入力エラー赤枠shakeアニメーション
 * shake=trueで±4px×3回振動（300ms）+ 赤枠表示
 * 振動完了後500msで赤枠フェード→onShakeEnd
 */
export default function ShakeView({ children, shake, onShakeEnd, style }: Props) {
  const reducedMotion = useReducedMotion();
  const translateX = useRef(new Animated.Value(0)).current;
  const [showBorder, setShowBorder] = useState(false);
  const prevShake = useRef(false);

  useEffect(() => {
    // Only trigger on false→true transition
    if (!shake || prevShake.current === shake) {
      prevShake.current = shake;
      return;
    }
    prevShake.current = shake;

    setShowBorder(true);

    if (reducedMotion) {
      const t = setTimeout(() => {
        setShowBorder(false);
        onShakeEnd?.();
      }, 700);
      return () => clearTimeout(t);
    }

    // 3 oscillations: 0 → +4 → -4 → +4 → -4 → +4 → -4 → 0
    const oscillation = 4;
    const singleDuration = 300 / 6; // ~50ms per segment

    const shakeSequence = Animated.sequence([
      Animated.timing(translateX, {
        toValue: oscillation,
        duration: singleDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: -oscillation,
        duration: singleDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: oscillation,
        duration: singleDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: -oscillation,
        duration: singleDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: oscillation,
        duration: singleDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: singleDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]);

    shakeSequence.start(() => {
      // Keep red border for 500ms after shake completes
      setTimeout(() => {
        setShowBorder(false);
        onShakeEnd?.();
      }, 500);
    });

    return () => {
      translateX.setValue(0);
    };
  }, [shake]);

  // Reset border when shake goes back to false
  useEffect(() => {
    if (!shake) {
      setShowBorder(false);
    }
  }, [shake]);

  return (
    <Animated.View
      style={[
        style,
        showBorder && styles.errorBorder,
        { transform: [{ translateX }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  errorBorder: {
    borderColor: "#E74C3C",
    borderWidth: 2,
    borderRadius: 8,
  },
});
