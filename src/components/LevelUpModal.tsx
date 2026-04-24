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
import Svg, { Rect, Path, Circle, G, Defs, LinearGradient, Stop } from "react-native-svg";
import { rf } from "../lib/responsive";
import { useReducedMotion } from "../lib/useReducedMotion";
import type { Level } from "../lib/levels";
import CharacterSvg from "./CharacterSvg";
import { RubyStr } from "./Ruby";

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
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (visible) {
      if (reducedMotion) {
        // アニメーション省略：即座に最終状態
        flash.setValue(0);
        scale.setValue(1);
        textFade.setValue(1);
        sparkle.setValue(0);
        return;
      }

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
  }, [visible, reducedMotion]);

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
          {/* ピクセルスパークル（SVG） */}
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const radius = 90;
            const colors = ["#FFD700", "#FF8C00", "#FFF8DC", "#FFE066", "#E0A030", "#FF6B35", "#FFC857", "#FFFACD"];
            return (
              <Animated.View
                key={i}
                style={[
                  styles.sparkle,
                  {
                    left: width / 2 - 12 + Math.cos(angle) * radius,
                    top: 180 + Math.sin(angle) * radius,
                    opacity: sparkle.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: i % 2 === 0 ? [0.3, 1, 0.3] : [1, 0.3, 1],
                    }),
                    transform: [{
                      scale: sparkle.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: i % 2 === 0 ? [0.6, 1.3, 0.6] : [1.3, 0.6, 1.3],
                      }),
                    }],
                  },
                ]}
              >
                <PixelStar size={24} color={colors[i]} />
              </Animated.View>
            );
          })}

          {/* ピクセルバナー「しんかした！」 */}
          <Animated.View style={{ opacity: textFade, alignItems: "center" }}>
            <PixelBanner text="しんかした！" />
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

            <View style={styles.arrowWrap}>
              <PixelArrow size={36} />
            </View>

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
            <RubyStr text={newLevel.title} style={styles.newTitle} rubySize={8} />
            <View style={{ flexDirection: "row", alignItems: "flex-end", flexWrap: "wrap", justifyContent: "center" }}>
              <Text style={styles.newAppearance}>「</Text>
              <RubyStr text={newLevel.appearance} style={styles.newAppearance} rubySize={6} />
              <Text style={styles.newAppearance}>」を[手|て]に[入|い]れた！</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "flex-end", flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
              <Text style={styles.newGreeting}>「</Text>
              <RubyStr text={newLevel.greetingActive} style={styles.newGreeting} rubySize={6} />
              <Text style={styles.newGreeting}>」</Text>
            </View>
          </Animated.View>

          {/* 閉じるボタン */}
          <Animated.View style={{ opacity: textFade, width: "100%" }}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="やったー。レベルアップを閉じる"
              accessibilityRole="button"
            >
              <Text style={styles.closeText}>やったー！</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

/** ピクセルアート4方向星 */
function PixelStar({ size = 24, color = "#FFD700" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12,0 L14,10 L24,12 L14,14 L12,24 L10,14 L0,12 L10,10 Z" fill={color} />
      <Path d="M12,4 L13,10 L12,11 L11,10 Z" fill="#FFFFFF" opacity={0.5} />
    </Svg>
  );
}

/** ピクセルアート右矢印 */
function PixelArrow({ size = 36 }: { size?: number }) {
  const PX = size / 9;
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36">
      <Defs>
        <LinearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="#FFD700" />
          <Stop offset="100%" stopColor="#FF8C00" />
        </LinearGradient>
      </Defs>
      <G>
        <Rect x={0} y={14} width={20} height={8} rx={2} fill="url(#arrowGrad)" />
        <Path d="M18,8 L34,18 L18,28 Z" fill="url(#arrowGrad)" />
        <Rect x={2} y={16} width={16} height={2} fill="#FFFFFF" opacity={0.3} />
      </G>
    </Svg>
  );
}

/** ピクセルRPGバナー（リボン風） */
function PixelBanner({ text }: { text: string }) {
  return (
    <View style={{ alignItems: "center", marginBottom: 16 }}>
      <Svg width={220} height={48} viewBox="0 0 220 48">
        <Defs>
          <LinearGradient id="bannerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFD700" />
            <Stop offset="100%" stopColor="#DAA520" />
          </LinearGradient>
        </Defs>
        {/* リボンの端（左） */}
        <Path d="M0,12 L20,8 L20,40 L0,36 L8,24 Z" fill="#B8860B" />
        {/* リボンの端（右） */}
        <Path d="M220,12 L200,8 L200,40 L220,36 L212,24 Z" fill="#B8860B" />
        {/* メインバナー */}
        <Rect x={18} y={6} width={184} height={36} rx={4} fill="url(#bannerGrad)" />
        <Rect x={18} y={6} width={184} height={12} rx={4} fill="#FFFFFF" opacity={0.2} />
        {/* 上下の縁取り */}
        <Rect x={18} y={6} width={184} height={3} fill="#B8860B" opacity={0.5} />
        <Rect x={18} y={39} width={184} height={3} fill="#B8860B" opacity={0.5} />
        {/* 宝石飾り */}
        <Circle cx={30} cy={24} r={4} fill="#E74C3C" />
        <Circle cx={190} cy={24} r={4} fill="#3498DB" />
      </Svg>
      <Text style={{
        position: "absolute",
        top: 12,
        fontSize: rf(20),
        fontWeight: "bold",
        color: "#1a1a2e",
        textShadowColor: "#FFE066",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 4,
        letterSpacing: 2,
      }}>
        ⚔ {text} ⚔
      </Text>
    </View>
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
    width: 24,
    height: 24,
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
  arrowWrap: {
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
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
    fontSize: rf(20),
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  newAppearance: {
    fontSize: rf(14),
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
