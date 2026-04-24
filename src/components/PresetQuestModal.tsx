import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { RubyText } from "./Ruby";
import { PRESET_QUESTS, type PresetQuest } from "../data/presetQuests";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (quest: PresetQuest) => void;
  /** 「その他」選択時: プリセットを使わず空フォームでオリジナル作成へ遷移 */
  onSelectCustom: () => void;
};

/**
 * プリセットクエスト選択モーダル
 *
 * 16種類の定番家事クエストから選択して「クエストデプロイ」フォームに
 * 事前入力する。HCD原則（Recognition > Recall）に基づき、
 * 子供は記憶ではなくリストから「選ぶ」だけで提案できる。
 *
 * 表示仕様（プランC）:
 *   各行: 絵文字 + メインタイトル（ゲーム風）+ サブラベル（ひらがな直接表現）
 */
export default function PresetQuestModal({ visible, onClose, onSelect, onSelectCustom }: Props) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => createStyles(palette), [palette]);

  const handleSelect = (quest: PresetQuest) => {
    onSelect(quest);
    onClose();
  };

  const handleSelectCustom = () => {
    onSelectCustom();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.header}>
            <RubyText
              style={styles.title}
              parts={["クエストを ", ["選", "えら"], "ぼう"]}
              rubySize={5}
            />
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="閉じる"
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>タップすると、クエストデプロイの下書きになるよ</Text>

          <ScrollView
            style={styles.list}
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator
          >
            {PRESET_QUESTS.map((q) => (
              <TouchableOpacity
                key={q.id}
                style={styles.item}
                onPress={() => handleSelect(q)}
                accessibilityLabel={`${q.mainTitle}。${q.subLabel}`}
                accessibilityRole="button"
              >
                <Text style={styles.emoji}>{q.emoji}</Text>
                <View style={styles.itemText}>
                  <Text style={styles.mainTitle} numberOfLines={1}>
                    {q.mainTitle}
                  </Text>
                  <Text style={styles.subLabel} numberOfLines={1}>
                    {q.subLabel}
                  </Text>
                </View>
                <Text style={styles.reward}>¥{q.suggestedReward}</Text>
              </TouchableOpacity>
            ))}

            {/* その他 — 空フォームでオリジナル作成へ */}
            <TouchableOpacity
              style={[styles.item, styles.customItem]}
              onPress={handleSelectCustom}
              accessibilityLabel="その他。じぶんで かんがえて オリジナルクエストを つくる"
              accessibilityRole="button"
            >
              <Text style={styles.emoji}>✏️</Text>
              <View style={styles.itemText}>
                <Text style={[styles.mainTitle, styles.customMainTitle]} numberOfLines={1}>
                  その他
                </Text>
                <Text style={styles.subLabel} numberOfLines={1}>
                  じぶんで かんがえる
                </Text>
              </View>
              <Text style={[styles.reward, styles.customReward]}>つくる</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(p: ReturnType<typeof useTheme>["palette"]) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: p.overlay,
      justifyContent: "flex-end" as const,
    },
    card: {
      backgroundColor: p.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingTop: 16,
      paddingHorizontal: 16,
      maxHeight: "85%" as const,
    } satisfies StyleProp<ViewStyle>,
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      marginBottom: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold" as const,
      color: p.textStrong,
    },
    closeBtn: {
      width: 32,
      height: 32,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    closeText: {
      fontSize: 20,
      color: p.textMuted,
      fontWeight: "bold" as const,
    },
    subtitle: {
      fontSize: 12,
      color: p.textMuted,
      marginBottom: 12,
    },
    list: {
      flexGrow: 0,
    },
    item: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      padding: 12,
      gap: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.surfaceMuted,
      marginBottom: 8,
      minHeight: 56,
    },
    emoji: {
      fontSize: 28,
    },
    itemText: {
      flex: 1,
    },
    mainTitle: {
      fontSize: 14,
      fontWeight: "bold" as const,
      color: p.textStrong,
      marginBottom: 2,
    },
    subLabel: {
      fontSize: 12,
      color: p.textMuted,
    },
    reward: {
      fontSize: 13,
      fontWeight: "bold" as const,
      color: p.accentDark,
      minWidth: 50,
      textAlign: "right" as const,
    },
    customItem: {
      borderStyle: "dashed" as const,
      borderColor: p.primary,
      backgroundColor: p.primaryLight,
      marginTop: 4,
    },
    customMainTitle: {
      color: p.primaryDark,
    },
    customReward: {
      color: p.primaryDark,
      fontSize: 12,
    },
  });
}
