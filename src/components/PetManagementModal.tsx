import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Pet } from "../lib/types";
import {
  PET_TYPE_INFO,
  getAllPets,
  namePet,
  setActivePet,
  calculateHappiness,
  HATCH_QUESTS_REQUIRED,
} from "../lib/pets";
import PetSvg from "./PetSvg";
import RpgButton from "./RpgButton";
import RpgCard from "./RpgCard";
import { useTheme, type Palette } from "../theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  childId: string;
  onChanged?: () => void;
};

export default function PetManagementModal({ visible, onClose, childId, onChanged }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const insets = useSafeAreaInsets();

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    getAllPets(childId).then((data) => {
      setPets(data);
      setLoading(false);
    });
  }, [visible, childId]);

  async function handleSetActive(petId: string) {
    await setActivePet(childId, petId);
    const updated = await getAllPets(childId);
    setPets(updated);
    onChanged?.();
  }

  async function handleSaveName(petId: string) {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    await namePet(petId, trimmed);
    setEditingId(null);
    setNameDraft("");
    const updated = await getAllPets(childId);
    setPets(updated);
    onChanged?.();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🐾 ペットずかん</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          アクティブに できるのは 1ぴきだけ！
        </Text>

        <ScrollView
          contentContainerStyle={{ padding: 12, paddingBottom: insets.bottom + 20 }}
          showsVerticalScrollIndicator
        >
          {loading ? (
            <ActivityIndicator color={palette.primary} style={{ marginTop: 40 }} />
          ) : pets.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>まだ ペットは いないよ</Text>
              <Text style={styles.emptyHint}>
                クエストを クリアすると たまごが みつかるかも！
              </Text>
            </View>
          ) : (
            pets.map((pet) => {
              const info = PET_TYPE_INFO[pet.pet_type];
              const happiness = calculateHappiness(pet);
              const eggProgress =
                pet.growth_stage === "egg"
                  ? Math.min(100, (pet.quests_since_acquired / HATCH_QUESTS_REQUIRED) * 100)
                  : 0;
              const isEditing = editingId === pet.id;

              return (
                <RpgCard
                  key={pet.id}
                  tier={pet.is_active ? "gold" : "violet"}
                  style={{ marginBottom: 10 }}
                >
                  <View style={styles.petRow}>
                    <View style={styles.petIconWrap}>
                      <PetSvg
                        type={pet.pet_type}
                        stage={pet.growth_stage}
                        happiness={happiness}
                        size={56}
                      />
                    </View>
                    <View style={styles.petInfo}>
                      {isEditing ? (
                        <View style={styles.editRow}>
                          <TextInput
                            value={nameDraft}
                            onChangeText={setNameDraft}
                            placeholder="なまえ"
                            placeholderTextColor={palette.textMuted}
                            style={styles.nameInput}
                            maxLength={12}
                            autoFocus
                          />
                          <TouchableOpacity
                            onPress={() => handleSaveName(pet.id)}
                            style={styles.okBtn}
                          >
                            <Text style={styles.okText}>OK</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => {
                            setEditingId(pet.id);
                            setNameDraft(pet.name || "");
                          }}
                        >
                          <Text style={styles.petName}>
                            {pet.name || "なまえを つけよう ✏️"}
                          </Text>
                        </TouchableOpacity>
                      )}
                      <Text style={styles.petType}>
                        {info.nameJa} ・{" "}
                        {pet.growth_stage === "egg"
                          ? "たまご"
                          : pet.growth_stage === "baby"
                            ? "ベビー"
                            : pet.growth_stage === "child"
                              ? "こども"
                              : "おとな"}
                      </Text>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${pet.growth_stage === "egg" ? eggProgress : happiness}%`,
                              backgroundColor:
                                pet.growth_stage === "egg" ? palette.accent : palette.green,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressLabel}>
                        {pet.growth_stage === "egg"
                          ? `あと ${Math.max(0, HATCH_QUESTS_REQUIRED - pet.quests_since_acquired)} クエストで かえる`
                          : `しあわせ ${happiness}％ ・ ごはん ${pet.fed_count}かい`}
                      </Text>
                    </View>
                  </View>
                  <View style={{ marginTop: 8 }}>
                    {pet.is_active ? (
                      <Text style={styles.activeBadge}>⭐ アクティブ</Text>
                    ) : (
                      <RpgButton
                        tier="violet"
                        size="sm"
                        onPress={() => handleSetActive(pet.id)}
                      >
                        アクティブにする
                      </RpgButton>
                    )}
                  </View>
                </RpgCard>
              );
            })
          )}

          <View style={{ marginTop: 12 }}>
            <RpgButton tier="silver" size="md" onPress={onClose}>
              とじる
            </RpgButton>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: p.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: p.textStrong,
    },
    closeBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 18,
      backgroundColor: p.surfaceMuted,
    },
    closeText: {
      fontSize: 16,
      color: p.textStrong,
    },
    subtitle: {
      fontSize: 12,
      color: p.textMuted,
      textAlign: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    emptyWrap: {
      alignItems: "center",
      paddingVertical: 48,
    },
    emptyText: {
      fontSize: 14,
      color: p.textStrong,
      marginBottom: 4,
    },
    emptyHint: {
      fontSize: 11,
      color: p.textMuted,
    },
    petRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
    },
    petIconWrap: {
      width: 60,
      alignItems: "center",
    },
    petInfo: {
      flex: 1,
    },
    editRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    nameInput: {
      flex: 1,
      backgroundColor: p.surfaceMuted,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: p.border,
      paddingHorizontal: 10,
      paddingVertical: 6,
      color: p.textStrong,
      fontSize: 14,
    },
    okBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: p.primary,
    },
    okText: {
      color: p.black,
      fontWeight: "bold",
      fontSize: 12,
    },
    petName: {
      fontSize: 14,
      fontWeight: "bold",
      color: p.textStrong,
    },
    petType: {
      fontSize: 11,
      color: p.textMuted,
      marginTop: 1,
    },
    progressTrack: {
      height: 5,
      backgroundColor: p.surfaceMuted,
      borderRadius: 3,
      overflow: "hidden",
      marginTop: 4,
    },
    progressFill: {
      height: "100%",
    },
    progressLabel: {
      fontSize: 10,
      color: p.textMuted,
      marginTop: 2,
    },
    activeBadge: {
      fontSize: 12,
      fontWeight: "bold",
      color: p.accent,
      textAlign: "center",
      paddingVertical: 6,
    },
  });
}
