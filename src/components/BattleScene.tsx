import React, { useEffect, useRef, useState, useMemo } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import Svg, { Rect, Line, Defs, LinearGradient, Stop } from "react-native-svg";
import { useTheme, type Palette } from "../theme";
import CharacterSvg from "./CharacterSvg";
import PixelMonsterSvg, { MONSTER_TYPES } from "./PixelMonsterSvg";
import { GoldCoinIcon } from "./PixelItemIcons";
import { useReducedMotion } from "../lib/useReducedMotion";

type Props = {
  show: boolean;
  level: number;
  onComplete: () => void;
};

const { width } = Dimensions.get("window");

export default function BattleScene({ show, level, onComplete }: Props) {
  const { palette } = useTheme();
  const dynStyles = useMemo(() => createDynStyles(palette), [palette]);
  const reducedMotion = useReducedMotion();
  const [monsterType] = useState(() => MONSTER_TYPES[Math.floor(Math.random() * MONSTER_TYPES.length)]);
  const [phase, setPhase] = useState<"enter" | "attack" | "hit" | "defeat" | "coins" | "done">("enter");

  const charX = useRef(new Animated.Value(-80)).current;
  const monsterOpacity = useRef(new Animated.Value(1)).current;
  const monsterScale = useRef(new Animated.Value(1)).current;
  const slashOpacity = useRef(new Animated.Value(0)).current;
  const victoryOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!show) return;

    if (reducedMotion) {
      setPhase("done");
      setTimeout(onComplete, 300);
      return;
    }

    // Reset
    charX.setValue(-80);
    monsterOpacity.setValue(1);
    monsterScale.setValue(1);
    slashOpacity.setValue(0);
    victoryOpacity.setValue(0);
    setPhase("enter");

    // Sequence
    Animated.sequence([
      // Enter
      Animated.timing(charX, { toValue: 40, duration: 400, useNativeDriver: true }),
      // Attack - slash
      Animated.parallel([
        Animated.timing(charX, { toValue: 80, duration: 200, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(slashOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(slashOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]),
      ]),
      // Hit - monster flash
      Animated.timing(monsterScale, { toValue: 1.15, duration: 150, useNativeDriver: true }),
      Animated.timing(monsterScale, { toValue: 1, duration: 100, useNativeDriver: true }),
      // Defeat
      Animated.parallel([
        Animated.timing(monsterOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(monsterScale, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ]),
      // Victory
      Animated.timing(victoryOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Phase tracking for coins
    setTimeout(() => setPhase("attack"), 400);
    setTimeout(() => setPhase("hit"), 600);
    setTimeout(() => setPhase("defeat"), 900);
    setTimeout(() => setPhase("coins"), 1300);
    setTimeout(() => setPhase("done"), 2200);
    setTimeout(onComplete, 2500);
  }, [show, reducedMotion]);

  if (!show) return null;

  return (
    <View style={dynStyles.overlay}>
      <View style={styles.arena}>
        {/* Background */}
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 300 200">
          <Defs>
            <LinearGradient id="bs-bg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#1A1A2E" />
              <Stop offset="100%" stopColor="#2D2D44" />
            </LinearGradient>
          </Defs>
          <Rect width={300} height={200} fill="url(#bs-bg)" rx={12} />
          <Rect x={0} y={160} width={300} height={40} fill="#3A3A2E" />
          <Rect x={0} y={160} width={300} height={3} fill="#4A6A30" />
        </Svg>

        {/* Character */}
        <Animated.View style={[styles.character, { transform: [{ translateX: charX }] }]}>
          <CharacterSvg level={Math.min(level, 7)} mood="active" size={64} animated mode={phase === "enter" ? "walk" : "idle"} />
        </Animated.View>

        {/* Slash */}
        <Animated.View style={[styles.slash, { opacity: slashOpacity }]}>
          <Svg width={40} height={40} viewBox="0 0 40 40">
            <Line x1={5} y1={5} x2={35} y2={35} stroke="#FFD700" strokeWidth={3} />
            <Line x1={35} y1={5} x2={5} y2={35} stroke="#FFD700" strokeWidth={3} />
            <Line x1={20} y1={0} x2={20} y2={40} stroke="#FFE066" strokeWidth={2} />
          </Svg>
        </Animated.View>

        {/* Monster */}
        <Animated.View style={[styles.monster, { opacity: monsterOpacity, transform: [{ scale: monsterScale }] }]}>
          <PixelMonsterSvg type={monsterType} size={56} />
        </Animated.View>

        {/* Victory */}
        <Animated.View style={[styles.victoryWrap, { opacity: victoryOpacity }]}>
          <Text style={dynStyles.victoryText}>VICTORY!</Text>
        </Animated.View>

        {/* Coins */}
        {(phase === "coins" || phase === "done") && (
          <View style={styles.coinRow}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={{ marginHorizontal: 2 }}>
                <GoldCoinIcon size={16} />
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function createDynStyles(p: Palette) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: p.overlay,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 100,
    },
    victoryText: {
      fontSize: 22,
      fontWeight: "bold",
      color: p.gold,
      textShadowColor: p.goldBorder,
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
    },
  });
}

const styles = StyleSheet.create({
  arena: {
    width: 280,
    height: 190,
    borderRadius: 12,
    overflow: "hidden",
  },
  character: {
    position: "absolute",
    bottom: 36,
    left: 0,
  },
  slash: {
    position: "absolute",
    left: 130,
    bottom: 55,
  },
  monster: {
    position: "absolute",
    right: 40,
    bottom: 36,
  },
  victoryWrap: {
    position: "absolute",
    top: 16,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  coinRow: {
    position: "absolute",
    right: 40,
    bottom: 45,
    flexDirection: "row",
  },
});
