import React, { useEffect, useRef, useMemo } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { useTheme, type Palette } from "../theme";
import { useReducedMotion } from "../lib/useReducedMotion";

type Props = {
  show: boolean;
  goalTitle: string;
  onComplete: () => void;
};

const CONFETTI_COUNT = 6;
const CONFETTI_COLORS = ["#FFD700", "#E74C3C", "#3498DB", "#2ECC71", "#FF6B6B", "#9B59B6"];

export default function SavingGoalMilestone({ show, goalTitle, onComplete }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const reducedMotion = useReducedMotion();

  // Fill bar animation (uses width %, so useNativeDriver: false)
  const fillWidth = useRef(new Animated.Value(0)).current;
  const fillGlow = useRef(new Animated.Value(0)).current;

  // Confetti particles
  const confettiAnims = useRef(
    Array.from({ length: CONFETTI_COUNT }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  // Banner text
  const bannerScale = useRef(new Animated.Value(0)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!show) {
      fillWidth.setValue(0);
      fillGlow.setValue(0);
      bannerScale.setValue(0);
      bannerOpacity.setValue(0);
      confettiAnims.forEach((c) => {
        c.translateX.setValue(0);
        c.translateY.setValue(0);
        c.opacity.setValue(0);
        c.scale.setValue(0);
      });
      return;
    }

    if (reducedMotion) {
      fillWidth.setValue(100);
      bannerScale.setValue(1);
      bannerOpacity.setValue(1);
      const t = setTimeout(onComplete, 200);
      return () => clearTimeout(t);
    }

    // Phase 1: Fill (0-800ms)
    const fillPhase = Animated.parallel([
      Animated.timing(fillWidth, {
        toValue: 100,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false, // width animation
      }),
      Animated.sequence([
        Animated.timing(fillGlow, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false,
        }),
        Animated.timing(fillGlow, {
          toValue: 0,
          duration: 400,
          useNativeDriver: false,
        }),
      ]),
    ]);

    // Phase 2: Burst (800-1400ms)
    const burstPhase = Animated.parallel(
      confettiAnims.map((c, i) => {
        const angle = (i / CONFETTI_COUNT) * Math.PI * 2;
        const dist = 50 + Math.random() * 30;
        const targetX = Math.cos(angle) * dist;
        const targetY = Math.sin(angle) * dist - 20;
        return Animated.parallel([
          Animated.sequence([
            Animated.timing(c.opacity, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(c.opacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(c.scale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(c.translateX, {
            toValue: targetX,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(c.translateY, {
            toValue: targetY,
            duration: 600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]);
      })
    );

    // Phase 3: Banner (1400-2000ms)
    const bannerPhase = Animated.parallel([
      Animated.timing(bannerOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(bannerScale, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }),
    ]);

    Animated.sequence([fillPhase, burstPhase, bannerPhase]).start();

    const t = setTimeout(onComplete, 2500);
    return () => clearTimeout(t);
  }, [
    show,
    reducedMotion,
    fillWidth,
    fillGlow,
    confettiAnims,
    bannerScale,
    bannerOpacity,
    onComplete,
  ]);

  if (!show) return null;

  const fillPercent = fillWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const glowColor = fillGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,215,0,0)", "rgba(255,215,0,0.5)"],
  });

  return (
    <View style={styles.container}>
      {/* Progress fill bar */}
      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: fillPercent,
              shadowColor: palette.gold,
              shadowOpacity: 0.8,
              shadowRadius: 8,
            },
          ]}
        />
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: glowColor, borderRadius: 6 },
          ]}
        />
      </View>

      {/* Confetti particles */}
      {confettiAnims.map((c, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            width: 8,
            height: 8,
            borderRadius: 2,
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            opacity: c.opacity,
            transform: [
              { translateX: c.translateX },
              { translateY: c.translateY },
              { scale: c.scale },
              { rotate: `${i * 60}deg` },
            ],
          }}
        />
      ))}

      {/* Banner text */}
      <Animated.View
        style={[
          styles.banner,
          {
            opacity: bannerOpacity,
            transform: [{ scale: bannerScale }],
          },
        ]}
      >
        <Text style={styles.bannerText}>目標達成！すごい！</Text>
        <Text style={styles.goalText}>{goalTitle}</Text>
      </Animated.View>
    </View>
  );
}

function createStyles(palette: Palette) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      paddingVertical: 12,
    },
    barTrack: {
      width: "80%",
      height: 12,
      borderRadius: 6,
      backgroundColor: palette.surfaceMuted,
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      backgroundColor: palette.gold,
      borderRadius: 6,
    },
    banner: {
      marginTop: 12,
      alignItems: "center",
    },
    bannerText: {
      fontSize: 20,
      fontWeight: "bold",
      color: palette.accent,
      textShadowColor: palette.primary,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 6,
    },
    goalText: {
      fontSize: 14,
      color: palette.textBase,
      marginTop: 4,
    },
  });
}
