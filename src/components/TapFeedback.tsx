import React, { useRef, useCallback } from "react";
import { Animated, Pressable, StyleProp, ViewStyle } from "react-native";
import { useReducedMotion } from "../lib/useReducedMotion";

type Props = {
  children: React.ReactNode;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * 汎用タップフィードバックラッパー
 * Press時にスケール0.95へ縮小し、離すとバネで1.0に戻る。
 */
export default function TapFeedback({ children, disabled, onPress, style }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();

  const handlePressIn = useCallback(() => {
    if (reducedMotion) return;
    Animated.spring(scale, {
      toValue: 0.95,
      speed: 50,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }, [scale, reducedMotion]);

  const handlePressOut = useCallback(() => {
    if (reducedMotion) return;
    Animated.spring(scale, {
      toValue: 1.0,
      speed: 20,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  }, [scale, reducedMotion]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          style,
          !reducedMotion && { transform: [{ scale }] },
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
