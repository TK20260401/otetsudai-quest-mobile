import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
} from "react-native";
import Svg, { Path, Rect, Circle, G, Defs, LinearGradient, Stop, Ellipse } from "react-native-svg";
import { rf } from "../lib/responsive";
import { useReducedMotion } from "../lib/useReducedMotion";
import * as Haptics from "expo-haptics";

type Props = {
  visible: boolean;
  emoji: string;
  label: string;
  description: string;
  onClose: () => void;
};

export default function BadgeUnlockModal({
  visible,
  emoji,
  label,
  description,
  onClose,
}: Props) {
  const scale = useRef(new Animated.Value(0.3)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const sparkle = useRef(new Animated.Value(0)).current;
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (visible) {
      if (!reducedMotion) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      if (reducedMotion) {
        scale.setValue(1);
        textFade.setValue(1);
        sparkle.setValue(0);
        return;
      }

      scale.setValue(0.3);
      textFade.setValue(0);
      sparkle.setValue(0);

      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(textFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.loop(
        Animated.timing(sparkle, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [visible, scale, textFade, sparkle, reducedMotion]);

  const sparkleRotate = sparkle.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* SVGスパークルリング */}
          <Animated.View
            style={[
              styles.sparkleRing,
              { transform: [{ rotate: sparkleRotate }] },
            ]}
          >
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i / 6) * Math.PI * 2;
              const radius = 85;
              const colors = ["#FFD700", "#FF8C00", "#FFC857", "#E0A030", "#FFE066", "#FFFACD"];
              return (
                <View
                  key={i}
                  style={{
                    position: "absolute",
                    left: 90 + Math.cos(angle) * radius,
                    top: 90 + Math.sin(angle) * radius,
                  }}
                >
                  <PixelStar size={20} color={colors[i]} />
                </View>
              );
            })}
          </Animated.View>

          {/* バッジ��ピクセルメダルフレ��ム付き） */}
          <Animated.View
            style={[styles.badgeOuter, { transform: [{ scale }] }]}
          >
            <PixelMedalFrame size={140} />
            <View style={styles.badgeInner}>
              <Text style={styles.badgeEmoji}>{emoji}</Text>
            </View>
          </Animated.View>

          {/* ピクセルバナー */}
          <Animated.View style={{ opacity: textFade, alignItems: "center" }}>
            <UnlockBanner />
            <Text style={styles.badgeLabel}>{label}</Text>
            <Text style={styles.badgeDesc}>{description}</Text>
          </Animated.View>

          {/* 閉じるボタン */}
          <Animated.View style={{ opacity: textFade }}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="とじる"
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
function PixelStar({ size = 20, color = "#FFD700" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12,0 L14,10 L24,12 L14,14 L12,24 L10,14 L0,12 L10,10 Z" fill={color} />
      <Path d="M12,4 L13,10 L12,11 L11,10 Z" fill="#FFFFFF" opacity={0.5} />
    </Svg>
  );
}

/** ピクセルメダルフレーム */
function PixelMedalFrame({ size = 140 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140" style={{ position: "absolute" }}>
      <Defs>
        <LinearGradient id="medalGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFE066" />
          <Stop offset="50%" stopColor="#FFD700" />
          <Stop offset="100%" stopColor="#DAA520" />
        </LinearGradient>
        <LinearGradient id="medalRibbon" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#C0392B" />
          <Stop offset="100%" stopColor="#922B21" />
        </LinearGradient>
      </Defs>
      {/* リボン */}
      <Path d="M50,110 L40,140 L55,125 L70,140 L70,110 Z" fill="url(#medalRibbon)" />
      <Path d="M90,110 L100,140 L85,125 L70,140 L70,110 Z" fill="url(#medalRibbon)" />
      {/* 外コロ */}
      <Circle cx={70} cy={65} r={56} fill="url(#medalGold)" />
      {/* 内溝 */}
      <Circle cx={70} cy={65} r={50} fill="none" stroke="#B8860B" strokeWidth={2} />
      <Circle cx={70} cy={65} r={44} fill="none" stroke="#B8860B" strokeWidth={1} />
      {/* ハイライト */}
      <Ellipse cx={55} cy={45} rx={20} ry={12} fill="#FFFFFF" opacity={0.15} />
      {/* ���飾ドット（上下左右） */}
      <Circle cx={70} cy={12} r={3} fill="#E74C3C" />
      <Circle cx={70} cy={118} r={3} fill="#3498DB" />
      <Circle cx={17} cy={65} r={3} fill="#2ECC71" />
      <Circle cx={123} cy={65} r={3} fill="#9B59B6" />
    </Svg>
  );
}

/** 「そうび ゲット！」バナー */
function UnlockBanner() {
  return (
    <View style={{ alignItems: "center", marginBottom: 8 }}>
      <Svg width={180} height={36} viewBox="0 0 180 36">
        <Defs>
          <LinearGradient id="unlockBanner" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#e0a030" />
            <Stop offset="100%" stopColor="#c08020" />
          </LinearGradient>
        </Defs>
        <Path d="M0,10 L16,6 L16,30 L0,26 L6,18 Z" fill="#9B7518" />
        <Path d="M180,10 L164,6 L164,30 L180,26 L174,18 Z" fill="#9B7518" />
        <Rect x={14} y={4} width={152} height={28} rx={3} fill="url(#unlockBanner)" />
        <Rect x={14} y={4} width={152} height={9} rx={3} fill="#FFFFFF" opacity={0.15} />
      </Svg>
      <Text style={{
        position: "absolute",
        top: 7,
        fontSize: rf(14),
        fontWeight: "bold",
        color: "#FFFFFF",
        letterSpacing: 3,
        textShadowColor: "#9B7518",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      }}>
        そうび ゲット！
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  sparkleRing: {
    position: "absolute",
    width: 200,
    height: 200,
    top: -20,
  },
  badgeOuter: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  badgeInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -10,
  },
  badgeEmoji: {
    fontSize: 50,
  },
  badgeLabel: {
    fontSize: rf(24),
    color: "#ffffff",
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  badgeDesc: {
    fontSize: rf(14),
    color: "#cccccc",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: rf(22),
  },
  closeButton: {
    backgroundColor: "#e0a030",
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 16,
    minHeight: 52,
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  closeText: {
    fontSize: rf(18),
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
});
