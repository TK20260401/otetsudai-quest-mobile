import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, View, StyleSheet } from "react-native";
import { useReducedMotion } from "../lib/useReducedMotion";

type Props = {
  value: number;
  duration?: number;
  formatFn?: (n: number) => string;
  style?: object;
  textStyle?: object;
};

export default function WalletBalanceAnimation({
  value,
  duration = 800,
  formatFn,
  style,
  textStyle,
}: Props) {
  const reducedMotion = useReducedMotion();
  const prevRef = useRef(value);
  const [display, setDisplay] = useState(value);
  const shimmer = useRef(new Animated.Value(0)).current;
  const rafRef = useRef(0);
  const format = formatFn ?? ((n: number) => n.toLocaleString());

  useEffect(() => {
    const prev = prevRef.current;
    if (prev === value) return;
    prevRef.current = value;

    if (reducedMotion) {
      setDisplay(value);
      return;
    }

    // shimmer effect
    shimmer.setValue(0);
    Animated.timing(shimmer, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    // count animation via rAF for smooth number ticking
    const start = Date.now();
    const diff = value - prev;

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(prev + diff * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration, reducedMotion, shimmer]);

  const bgColor = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [
      "rgba(255,215,0,0)",
      "rgba(255,215,0,0.3)",
      "rgba(255,215,0,0)",
    ],
  });

  return (
    <Animated.View style={[styles.container, style, { backgroundColor: bgColor }]}>
      <Text style={[styles.text, textStyle]}>{format(display)}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    paddingHorizontal: 2,
  },
  text: {
    fontWeight: "bold",
  },
});
