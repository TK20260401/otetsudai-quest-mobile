import React, { useRef, useCallback } from "react";
import {
  Animated,
  Platform,
  TouchableWithoutFeedback,
  StyleProp,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useReducedMotion } from "../lib/useReducedMotion";

type Props = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  haptic?: "light" | "medium" | "heavy" | "none";
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: "button" | "link";
  children: React.ReactNode;
};

const IMPACT_STYLE = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
} as const;

/**
 * アニメーション付きボタン
 * タップ時に 0.95 倍にスケールし、離すとバネで戻る。
 * OS の「視差効果を減らす」が ON ならアニメーション・haptics を抑制。
 */
export default function AnimatedButton({
  onPress,
  style,
  disabled,
  haptic = "light",
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = "button",
  children,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();

  const handlePressIn = useCallback(() => {
    if (!reducedMotion) {
      Animated.spring(scale, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 50,
        bounciness: 4,
      }).start();
    }
    if (haptic !== "none" && !reducedMotion && Platform.OS !== "web") {
      Haptics.impactAsync(IMPACT_STYLE[haptic]);
    }
  }, [scale, haptic, reducedMotion]);

  const handlePressOut = useCallback(() => {
    if (!reducedMotion) {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 6,
      }).start();
    }
  }, [scale, reducedMotion]);

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
    >
      <Animated.View
        style={[
          style,
          !reducedMotion && { transform: [{ scale }] },
          disabled && { opacity: 0.5 },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}
