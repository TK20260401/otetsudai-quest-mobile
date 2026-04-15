import React, { useRef, useCallback } from "react";
import {
  Animated,
  Platform,
  TouchableWithoutFeedback,
  StyleProp,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";

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

/**
 * アニメーション付きボタン
 * タップ時に 0.95 倍にスケールし、離すとバネで戻る。
 */
const IMPACT_STYLE = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
} as const;

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

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
    if (haptic !== "none" && Platform.OS !== "web") {
      Haptics.impactAsync(IMPACT_STYLE[haptic]);
    }
  }, [scale, haptic]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  }, [scale]);

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
          { transform: [{ scale }] },
          disabled && { opacity: 0.5 },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}
