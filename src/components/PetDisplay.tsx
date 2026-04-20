import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from "react-native";
import type { Pet } from "../lib/types";
import { PET_TYPE_INFO, GROWTH_THRESHOLDS, HATCH_QUESTS_REQUIRED, calculateHappiness } from "../lib/pets";
import PetSvg from "./PetSvg";
import EggShake from "./animations/EggShake";
import { RubyStr } from "./Ruby";
import { useTheme, type Palette } from "../theme";

type Props = {
  pet: Pet | null;
  onTapEgg?: () => void;
  onManage?: () => void;
};

export default function PetDisplay({ pet, onTapEgg, onManage }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  if (!pet) {
    return (
      <TouchableOpacity onPress={onManage} style={styles.emptyBtn}>
        <RubyStr text="ペットを[探|さが]そう！" style={styles.emptyText} rubySize={6} noWrap />
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
    <TouchableOpacity onPress={onManage} style={styles.container} activeOpacity={0.8}>
      <PetSvg type={pet.pet_type} stage={pet.growth_stage} happiness={happiness} size={44} animated />
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
      marginTop: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    emptyText: {
      fontSize: 8,
      color: palette.textMuted,
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
