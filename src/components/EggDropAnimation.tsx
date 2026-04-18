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

export default function EggDropAnimation({ show, petType, onComplete }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const reducedMotion = useReducedMotion();

  const dropY = useRef(new Animated.Value(-200)).current;
  const scale = useRef(new Animated.Value(0.5)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!show) {
      dropY.setValue(-200);
      scale.setValue(0.5);
      textOpacity.setValue(0);
      textTranslate.setValue(20);
      return;
    }

    if (reducedMotion) {
      dropY.setValue(0);
      scale.setValue(1);
      textOpacity.setValue(1);
      textTranslate.setValue(0);
      const t = setTimeout(onComplete, 800);
      return () => clearTimeout(t);
    }

    Animated.sequence([
      Animated.parallel([
        Animated.timing(dropY, { toValue: 0, duration: 600, easing: Easing.bounce, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
      Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(textTranslate, { toValue: 0, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
    ]).start();

    const t = setTimeout(onComplete, 2800);
    return () => clearTimeout(t);
  }, [show, reducedMotion, dropY, scale, textOpacity, textTranslate, onComplete]);

  if (!show) return null;

  const info = PET_TYPE_INFO[petType];

  return (
    <Modal visible={show} transparent animationType="fade" onRequestClose={onComplete}>
      <Pressable style={styles.backdrop} onPress={onComplete}>
        <Animated.View
          style={{
            transform: [{ translateY: dropY }, { scale }],
          }}
        >
          <PetSvg type={petType} stage="egg" size={96} />
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
          <Text style={styles.title}>たまご ゲット！</Text>
          <Text style={styles.subtitle}>{info.nameJa}の たまごを みつけた！</Text>
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
