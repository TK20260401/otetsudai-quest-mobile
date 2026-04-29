import React, { useMemo, useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Animated, Easing } from "react-native";
import type { Pet } from "../lib/types";
import { PET_TYPE_INFO, GROWTH_THRESHOLDS, HATCH_QUESTS_REQUIRED, calculateHappiness } from "../lib/pets";
import PetSvg from "./PetSvg";
import EggShake from "./animations/EggShake";
import { useTheme, type Palette } from "../theme";
import { useReducedMotion } from "../lib/useReducedMotion";

type Props = {
  pet: Pet | null;
  onTapEgg?: () => void;
  onManage?: () => void;
};

// P4: ペットタップ時の喜び演出 — bounce + ハート3個飛散
function HappyEffect({ active, palette }: { active: boolean; palette: Palette }) {
  const reducedMotion = useReducedMotion();
  const hearts = useRef([0, 1, 2].map(() => ({
    y: new Animated.Value(0),
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.6),
  }))).current;

  useEffect(() => {
    if (!active || reducedMotion) return;
    hearts.forEach((h, i) => {
      h.y.setValue(0);
      h.opacity.setValue(0);
      h.scale.setValue(0.6);
      Animated.parallel([
        Animated.timing(h.y, { toValue: -28, duration: 600, delay: i * 60, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(h.opacity, { toValue: 1, duration: 100, delay: i * 60, useNativeDriver: true }),
          Animated.timing(h.opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
        Animated.timing(h.scale, { toValue: 1.0, duration: 200, delay: i * 60, useNativeDriver: true }),
      ]).start();
    });
  }, [active, reducedMotion, hearts]);

  if (!active) return null;
  return (
    <View pointerEvents="none" style={styles_overlay.heartsContainer}>
      {hearts.map((h, i) => (
        <Animated.Text
          key={i}
          style={[
            styles_overlay.heart,
            {
              color: palette.red,
              left: i === 0 ? -12 : i === 1 ? 0 : 12,
              transform: [{ translateY: h.y }, { scale: h.scale }],
              opacity: h.opacity,
            },
          ]}
        >
          ♥
        </Animated.Text>
      ))}
    </View>
  );
}

const styles_overlay = StyleSheet.create({
  heartsContainer: {
    position: "absolute",
    top: 0,
    left: "50%",
    width: 0,
    height: 0,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  heart: {
    position: "absolute",
    fontSize: 16,
    fontWeight: "900" as const,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowRadius: 2,
  },
  // P5: 成長段階移行時のゴールドフラッシュ（PetSvg 全体を覆う）
  evolveFlashLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
  },
  // P6: 食事アニメ時の🍖アイコン（ペット右上）
  eatIconWrap: {
    position: "absolute",
    top: -10,
    right: -8,
    width: 20,
    height: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  eatIcon: {
    fontSize: 16,
  },
});

export default function PetDisplay({ pet, onTapEgg, onManage }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const reducedMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const evolveScale = useRef(new Animated.Value(1)).current;
  const evolveFlash = useRef(new Animated.Value(0)).current;
  const [happy, setHappy] = useState(false);
  const [evolved, setEvolved] = useState(false);
  const [eating, setEating] = useState(false);
  const prevStage = useRef<string | undefined>(pet?.growth_stage);
  const prevFedCount = useRef<number | undefined>(pet?.fed_count);
  const eatBob = useRef(new Animated.Value(0)).current;

  // P5: ペット成長段階移行アニメ — egg→baby/baby→child/child→adult のとき
  useEffect(() => {
    const cur = pet?.growth_stage;
    if (!cur) {
      prevStage.current = undefined;
      return;
    }
    // 初回レンダーは prevStage の初期化のみ、演出スキップ
    if (prevStage.current === undefined) {
      prevStage.current = cur;
      return;
    }
    if (cur !== prevStage.current) {
      prevStage.current = cur;
      if (reducedMotion) return;
      setEvolved(true);
      evolveScale.setValue(0.6);
      evolveFlash.setValue(1);
      Animated.parallel([
        Animated.sequence([
          Animated.spring(evolveScale, { toValue: 1.5, friction: 4, tension: 80, useNativeDriver: true }),
          Animated.spring(evolveScale, { toValue: 1, friction: 5, useNativeDriver: true }),
        ]),
        Animated.timing(evolveFlash, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]).start(() => setEvolved(false));
    }
  }, [pet?.growth_stage, reducedMotion, evolveScale, evolveFlash]);

  // P6: ペット食事アニメ — fed_count が増えたら 2回 bob＋🍖アイコン浮上
  useEffect(() => {
    const cur = pet?.fed_count;
    if (cur === undefined) {
      prevFedCount.current = undefined;
      return;
    }
    if (prevFedCount.current === undefined) {
      prevFedCount.current = cur;
      return;
    }
    if (cur > prevFedCount.current) {
      prevFedCount.current = cur;
      if (reducedMotion) return;
      setEating(true);
      eatBob.setValue(0);
      Animated.sequence([
        Animated.timing(eatBob, { toValue: -8, duration: 150, useNativeDriver: true }),
        Animated.timing(eatBob, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(eatBob, { toValue: -6, duration: 150, useNativeDriver: true }),
        Animated.timing(eatBob, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start(() => setEating(false));
    } else if (cur < prevFedCount.current) {
      // リセットなど降順時は単に値更新
      prevFedCount.current = cur;
    }
  }, [pet?.fed_count, reducedMotion, eatBob]);

  function triggerHappy() {
    if (!reducedMotion) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.18, duration: 120, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
    }
    setHappy(true);
    setTimeout(() => setHappy(false), 700);
  }

  function handleManagePress() {
    triggerHappy();
    setTimeout(() => onManage?.(), 200);
  }

  if (!pet) {
    return (
      <TouchableOpacity onPress={onManage} style={styles.emptyBtn} activeOpacity={0.7}>
        <Text style={styles.emptyEmoji}>🐾</Text>
        <Text style={styles.emptyText}>ペット</Text>
      </TouchableOpacity>
    );
  }

  const happiness = calculateHappiness(pet);
  const info = PET_TYPE_INFO[pet.pet_type];

  if (pet.growth_stage === "egg") {
    const ready = pet.quests_since_acquired >= HATCH_QUESTS_REQUIRED;
    const progress = Math.min(100, (pet.quests_since_acquired / HATCH_QUESTS_REQUIRED) * 100);
    return (
      <View style={styles.container}>
        <Pressable onPress={ready ? onTapEgg : undefined}>
          <EggShake shaking={!ready} intensity={ready ? "strong" : "subtle"}>
            <PetSvg type={pet.pet_type} stage="egg" size={44} animated />
          </EggShake>
        </Pressable>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.hatchText}>
          {ready ? "タップで かえそう！" : `あと${HATCH_QUESTS_REQUIRED - pet.quests_since_acquired}クエスト`}
        </Text>
      </View>
    );
  }

  // 孵化済みペット
  const nextThreshold =
    pet.growth_stage === "baby" ? GROWTH_THRESHOLDS.child :
    pet.growth_stage === "child" ? GROWTH_THRESHOLDS.adult : null;
  const feedProgress = nextThreshold
    ? Math.min(100, Math.round((pet.fed_count / nextThreshold) * 100))
    : 100;

  return (
    <TouchableOpacity onPress={handleManagePress} style={styles.container} activeOpacity={0.8}>
      <View>
        <Animated.View style={{ transform: [{ scale: Animated.multiply(scale, evolveScale) }, { translateY: eatBob }] }}>
          <PetSvg type={pet.pet_type} stage={pet.growth_stage} happiness={happiness} size={44} animated />
        </Animated.View>
        {evolved && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles_overlay.evolveFlashLayer,
              { opacity: evolveFlash, backgroundColor: palette.accent ?? "#ffd166" },
            ]}
          />
        )}
        {eating && (
          <View pointerEvents="none" style={styles_overlay.eatIconWrap}>
            <Text style={styles_overlay.eatIcon}>🍖</Text>
          </View>
        )}
        <HappyEffect active={happy} palette={palette} />
      </View>
      {pet.name ? <Text style={styles.petName}>{pet.name}</Text> : null}
      <Text style={styles.petType}>{info.nameJa}</Text>
      {nextThreshold ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${feedProgress}%` }]} />
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function createStyles(palette: Palette) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      marginTop: 4,
    },
    emptyBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 8,
      marginBottom: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: palette.primary,
      backgroundColor: palette.primaryLight,
    },
    emptyEmoji: {
      fontSize: 14,
    },
    emptyText: {
      fontSize: 10,
      fontWeight: "bold",
      color: palette.primary,
    },
    progressTrack: {
      width: 56,
      height: 3,
      marginTop: 3,
      borderRadius: 2,
      backgroundColor: palette.surfaceMuted,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: palette.primary,
    },
    hatchText: {
      fontSize: 9,
      color: palette.accent,
      marginTop: 2,
      fontWeight: "700",
    },
    petName: {
      fontSize: 10,
      fontWeight: "bold",
      color: palette.accent,
      marginTop: 2,
    },
    petType: {
      fontSize: 8,
      color: palette.textMuted,
    },
  });
}
