import React, { useEffect, useMemo, useRef } from "react";
import { Modal, View, Text, StyleSheet, Animated, Easing, Pressable } from "react-native";
import type { PetType } from "../lib/pets";
import { PET_TYPE_INFO } from "../lib/pets";
import PetSvg from "./PetSvg";
import { useTheme, type Palette } from "../theme";
import { useReducedMotion } from "../lib/useReducedMotion";

type Props = {
  show: boolean;
  petType: PetType;
  onComplete: () => void;
};

const CRACK_PARTICLE_COUNT = 6;

export default function EggDropAnimation({ show, petType, onComplete }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const reducedMotion = useReducedMotion();

  // Drop phase
  const dropY = useRef(new Animated.Value(-200)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  // Crack phase
  const shakeX = useRef(new Animated.Value(0)).current;
  const eggOpacity = useRef(new Animated.Value(1)).current;
  const petScale = useRef(new Animated.Value(0)).current;
  const petOpacity = useRef(new Animated.Value(0)).current;

  // Crack particles
  const particleAnims = useRef(
    Array.from({ length: CRACK_PARTICLE_COUNT }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  // Text phase
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!show) {
      dropY.setValue(-200);
      scale.setValue(0.5);
      shakeX.setValue(0);
      eggOpacity.setValue(1);
      petScale.setValue(0);
      petOpacity.setValue(0);
      textOpacity.setValue(0);
      textTranslate.setValue(20);
      particleAnims.forEach((p) => {
        p.translateX.setValue(0);
        p.translateY.setValue(0);
        p.opacity.setValue(0);
      });
      return;
    }

    if (reducedMotion) {
      dropY.setValue(0);
      scale.setValue(1);
      eggOpacity.setValue(0);
      petScale.setValue(1);
      petOpacity.setValue(1);
      textOpacity.setValue(1);
      textTranslate.setValue(0);
      const t = setTimeout(onComplete, 800);
      return () => clearTimeout(t);
    }

    // Phase 1: Drop (0-600ms)
    const dropPhase = Animated.parallel([
      Animated.timing(dropY, {
        toValue: 0,
        duration: 600,
        easing: Easing.bounce,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1.1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    // Phase 2: Bounce settle (600-1000ms)
    const bouncePhase = Animated.timing(scale, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    });

    // Phase 3: Crack (1000-2200ms)
    // 3a: Shake sequence
    const shakeSequence = Animated.sequence([
      Animated.timing(shakeX, { toValue: -2, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 2, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -2, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 2, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]);

    // 3b: Crack particles burst outward
    const particleBurst = Animated.parallel(
      particleAnims.map((p, i) => {
        const angle = (i / CRACK_PARTICLE_COUNT) * Math.PI * 2;
        const dist = 40 + Math.random() * 20;
        const targetX = Math.cos(angle) * dist;
        const targetY = Math.sin(angle) * dist;
        return Animated.parallel([
          Animated.sequence([
            Animated.timing(p.opacity, {
              toValue: 1,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(p.opacity, {
              toValue: 0,
              duration: 450,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(p.translateX, {
            toValue: targetX,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(p.translateY, {
            toValue: targetY,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]);
      })
    );

    // 3c: Egg fades, pet appears
    const eggFade = Animated.timing(eggOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    });

    const petAppear = Animated.parallel([
      Animated.timing(petOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(petScale, {
        toValue: 1,
        friction: 4,
        tension: 60,
        useNativeDriver: true,
      }),
    ]);

    const crackPhase = Animated.sequence([
      shakeSequence,
      Animated.parallel([particleBurst, eggFade]),
      petAppear,
    ]);

    // Phase 4: Text (2200-3500ms)
    const textPhase = Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslate, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    Animated.sequence([dropPhase, bouncePhase, crackPhase, textPhase]).start();

    const t = setTimeout(onComplete, 3500);
    return () => clearTimeout(t);
  }, [
    show,
    reducedMotion,
    dropY,
    scale,
    shakeX,
    eggOpacity,
    petScale,
    petOpacity,
    textOpacity,
    textTranslate,
    particleAnims,
    onComplete,
  ]);

  if (!show) return null;

  const info = PET_TYPE_INFO[petType];
  const particleColors = ["#FFD700", "#FF6B6B", "#FFE066", "#DAA520", "#FFA623", "#FFB6C1"];

  return (
    <Modal visible={show} transparent animationType="fade" onRequestClose={onComplete}>
      <Pressable style={styles.backdrop} onPress={onComplete}>
        <Animated.View
          style={{
            transform: [{ translateY: dropY }, { translateX: shakeX }, { scale }],
          }}
        >
          {/* Egg (fades out during crack) */}
          <Animated.View style={{ opacity: eggOpacity }}>
            <PetSvg type={petType} stage="egg" size={96} />
          </Animated.View>

          {/* Pet (fades in during crack) */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
              opacity: petOpacity,
              transform: [{ scale: petScale }],
            }}
          >
            <PetSvg type={petType} stage="baby" size={96} />
          </Animated.View>

          {/* Crack particles */}
          {particleAnims.map((p, i) => (
            <Animated.View
              key={i}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 0,
                height: 0,
                borderLeftWidth: 4,
                borderRightWidth: 4,
                borderBottomWidth: 8,
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderBottomColor: particleColors[i % particleColors.length],
                opacity: p.opacity,
                transform: [
                  { translateX: p.translateX },
                  { translateY: p.translateY },
                  { rotate: `${(i * 60)}deg` },
                ],
              }}
            />
          ))}
        </Animated.View>

        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslate }],
            },
          ]}
        >
          <Text style={styles.title}>{info.nameJa}が うまれた！</Text>
          <Text style={styles.subtitle}>たいせつに そだてよう！</Text>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function createStyles(palette: Palette) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: palette.overlay,
      alignItems: "center",
      justifyContent: "center",
    },
    textContainer: {
      position: "absolute",
      bottom: "30%",
      alignItems: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: palette.accent,
      textShadowColor: palette.primary,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
    },
    subtitle: {
      fontSize: 14,
      color: palette.textBase,
      marginTop: 4,
    },
  });
}
