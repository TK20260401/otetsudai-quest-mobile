import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { colors } from "../lib/colors";
import type { Level } from "../lib/levels";
import CharacterSvg from "./CharacterSvg";

type Props = {
  visible: boolean;
  prevLevel: Level;
  newLevel: Level;
  onClose: () => void;
};

const { width } = Dimensions.get("window");

export default function LevelUpModal({ visible, prevLevel, newLevel, onClose }: Props) {
  const flash = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // リセット
      flash.setValue(0);
      scale.setValue(0.3);
      textFade.setValue(0);
      sparkle.setValue(0);

      // アニメーションシーケンス
      Animated.sequence([
        // 1. 画面フラッシュ
        Animated.timing(flash, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(flash, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        // 2. キャラクター登場（バウンス）
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();

      // キラキラ（並行）
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkle, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(sparkle, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // テキストフェードイン（遅延）
      Animated.timing(textFade, {
        toValue: 1,
        duration: 600,
        delay: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        {/* フラッシュ */}
        <Animated.View
          style={[styles.flash, { opacity: flash }]}
          pointerEvents="none"
        />

        <View style={styles.content}>
          {/* キラキラ */}
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 90;
            return (
              <Animated.Text
                key={i}
                style={[
                  styles.sparkle,
                  {
                    left: width / 2 - 10 + Math.cos(angle) * radius,
                    top: 180 + Math.sin(angle) * radius,
                    opacity: sparkle.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: i % 2 === 0 ? [0.3, 1, 0.3] : [1, 0.3, 1],
                    }),
                    transform: [{
                      scale: sparkle.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: i % 2 === 0 ? [0.5, 1.2, 0.5] : [1.2, 0.5, 1.2],
                      }),
                    }],
                  },
                ]}
              >
                ✨
              </Animated.Text>
            );
          })}

          {/* しんかした！ */}
          <Animated.View style={{ opacity: textFade }}>
            <Text style={styles.evolveTitle}>⚡ しんかした！ ⚡</Text>
          </Animated.View>

          {/* Before → After */}
          <View style={styles.compareRow}>
            <View style={styles.compareItem}>
              <Text style={styles.compareLabel}>まえ</Text>
              <View style={styles.prevCharacter}>
                <CharacterSvg level={prevLevel.level} mood="normal" size={60} />
              </View>
              <Text style={styles.compareLevelText}>
                Lv.{prevLevel.level}
              </Text>
            </View>

            <Text style={styles.arrow}>→</Text>

            {/* 新キャラ（アニメーション付き） */}
            <Animated.View style={[styles.compareItem, { transform: [{ scale }] }]}>
              <Text style={styles.compareLabel}>いま</Text>
              <View style={styles.newCharacter}>
                <CharacterSvg level={newLevel.level} mood="active" size={80} />
              </View>
              <Text style={styles.newLevelText}>
                Lv.{newLevel.level}
              </Text>
            </Animated.View>
          </View>

          {/* 新レベル情報 */}
          <Animated.View style={[styles.infoBox, { opacity: textFade }]}>
            <Text style={styles.newTitle}>{newLevel.title}</Text>
            <Text style={styles.newAppearance}>「{newLevel.appearance}」をてにいれた！</Text>
            <Text style={styles.newGreeting}>「{newLevel.greetingActive}」</Text>
          </Animated.View>

          {/* 閉じるボタン */}
          <Animated.View style={{ opacity: textFade, width: "100%" }}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>やったー！</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
  },
  content: {
    backgroundColor: "#1a1a2e",
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  sparkle: {
    position: "absolute",
    fontSize: 20,
  },
  evolveTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 16,
    textShadowColor: "#FF8C00",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  compareRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
  },
  compareItem: {
    alignItems: "center",
  },
  compareLabel: {
    fontSize: 11,
    color: "#999",
    marginBottom: 4,
  },
  prevCharacter: {
    opacity: 0.5,
  },
  newCharacter: {
    // full opacity by default
  },
  compareLevelText: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  newLevelText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFD700",
    marginTop: 4,
  },
  arrow: {
    fontSize: 28,
    color: "#FFD700",
    marginHorizontal: 8,
  },
  infoBox: {
    backgroundColor: "rgba(255,215,0,0.1)",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
  },
  newTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  newAppearance: {
    fontSize: 14,
    color: "#FFD700",
    marginBottom: 8,
  },
  newGreeting: {
    fontSize: 13,
    color: "#CCC",
    fontStyle: "italic",
  },
  closeButton: {
    backgroundColor: "#FFD700",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    width: "100%",
  },
  closeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a2e",
  },
});
