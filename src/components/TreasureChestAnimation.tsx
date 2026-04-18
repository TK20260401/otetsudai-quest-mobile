import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import Svg, { Rect, Circle, G, Defs, LinearGradient, RadialGradient, Stop } from "react-native-svg";
import { GoldCoinIcon } from "./PixelItemIcons";
import { PixelConfettiIcon } from "./PixelIcons";
import { useReducedMotion } from "../lib/useReducedMotion";

type Props = {
  show: boolean;
  onComplete: () => void;
};

const { width: SCREEN_W } = Dimensions.get("window");

export default function TreasureChestAnimation({ show, onComplete }: Props) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<"idle" | "shake" | "open" | "burst" | "done">("idle");
  const shakeX = useRef(new Animated.Value(0)).current;
  const lidRotate = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!show) { setPhase("idle"); return; }

    if (reducedMotion) {
      setPhase("done");
      setTimeout(onComplete, 500);
      return;
    }

    // Reset
    shakeX.setValue(0);
    lidRotate.setValue(0);
    glowScale.setValue(0);
    bannerOpacity.setValue(0);
    setPhase("shake");

    // Shake
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeX, { toValue: 4, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -4, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]),
      { iterations: 4 }
    ).start();

    setTimeout(() => {
      setPhase("open");
      Animated.parallel([
        Animated.timing(lidRotate, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(glowScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
    }, 600);

    setTimeout(() => {
      setPhase("burst");
      Animated.timing(bannerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, 1100);

    setTimeout(() => setPhase("done"), 2500);
    setTimeout(onComplete, 3000);
  }, [show, reducedMotion]);

  if (!show) return null;

  return (
    <View style={styles.overlay}>
      {/* バナー */}
      <Animated.View style={[styles.bannerWrap, { opacity: bannerOpacity }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={styles.bannerText}>クエストクリア！</Text>
          <PixelConfettiIcon size={24} />
        </View>
      </Animated.View>

      {/* 宝箱 */}
      <Animated.View style={[styles.chestWrap, { transform: [{ translateX: shakeX }] }]}>
        <Svg width={120} height={100} viewBox="0 0 120 100">
          <Defs>
            <LinearGradient id="tc-wood" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#A0724A" />
              <Stop offset="100%" stopColor="#6B4430" />
            </LinearGradient>
            <LinearGradient id="tc-lid" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#C08860" />
              <Stop offset="100%" stopColor="#8B5E3C" />
            </LinearGradient>
            <RadialGradient id="tc-glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFD700" stopOpacity={0.8} />
              <Stop offset="100%" stopColor="#FFD700" stopOpacity={0} />
            </RadialGradient>
          </Defs>

          {/* 光バースト */}
          {(phase === "open" || phase === "burst" || phase === "done") && (
            <Circle cx={60} cy={40} r={45} fill="url(#tc-glow)" />
          )}

          {/* 箱本体 */}
          <Rect x={15} y={50} width={90} height={45} rx={4} fill="url(#tc-wood)" />
          <Rect x={15} y={50} width={90} height={6} fill="#5C3A1E" />
          <Rect x={50} y={55} width={20} height={12} rx={2} fill="#DAA520" />
          <Circle cx={60} cy={61} r={3} fill="#B8860B" />
          <Rect x={15} y={70} width={90} height={3} fill="#DAA520" opacity={0.5} />

          {/* フタ（開く） */}
          <G
            rotation={phase === "open" || phase === "burst" || phase === "done" ? -45 : 0}
            origin="15, 50"
          >
            <Rect x={15} y={30} width={90} height={22} rx={4} fill="url(#tc-lid)" />
            <Rect x={15} y={30} width={90} height={4} fill="#DAA520" />
            <Rect x={15} y={48} width={90} height={4} fill="#5C3A1E" />
            <Rect x={50} y={38} width={20} height={8} rx={2} fill="#FFD700" />
            <Circle cx={60} cy={42} r={2.5} fill="#E74C3C" />
          </G>
        </Svg>
      </Animated.View>

      {/* コイン飛散 */}
      {(phase === "burst" || phase === "done") && (
        <View style={styles.coinBurst}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <View key={i} style={[styles.coin, { left: (i - 4) * 16, top: -i * 8 }]}>
              <GoldCoinIcon size={18} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  bannerWrap: {
    position: "absolute",
    top: "25%",
  },
  bannerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700",
    textShadowColor: "#FF8C00",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  chestWrap: {
    alignItems: "center",
  },
  coinBurst: {
    position: "absolute",
    bottom: "35%",
    flexDirection: "row",
    justifyContent: "center",
  },
  coin: {
    position: "relative",
  },
});
