import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  TouchableOpacity,
} from "react-native";
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
        // アニメーション省略：即座に最終状態
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
          {/* Sparkle ring */}
          <Animated.View
            style={[
              styles.sparkleRing,
              { transform: [{ rotate: sparkleRotate }] },
            ]}
          >
            <Text style={styles.sparkleStar}>✨</Text>
            <Text style={[styles.sparkleStar, styles.sparkle2]}>🌟</Text>
            <Text style={[styles.sparkleStar, styles.sparkle3]}>✨</Text>
            <Text style={[styles.sparkleStar, styles.sparkle4]}>🌟</Text>
          </Animated.View>

          {/* Badge */}
          <Animated.View
            style={[styles.badgeCircle, { transform: [{ scale }] }]}
          >
            <Text style={styles.badgeEmoji}>{emoji}</Text>
          </Animated.View>

          {/* Text */}
          <Animated.View style={{ opacity: textFade }}>
            <Text style={styles.unlockText}>そうび ゲット！</Text>
            <Text style={styles.badgeLabel}>{label}</Text>
            <Text style={styles.badgeDesc}>{description}</Text>
          </Animated.View>

          {/* Close */}
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
  sparkleStar: {
    position: "absolute",
    fontSize: 28,
  },
  sparkle2: {
    top: 0,
    right: 0,
  },
  sparkle3: {
    bottom: 0,
    left: 0,
  },
  sparkle4: {
    bottom: 0,
    right: 0,
  },
  badgeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fef3e0",
    borderWidth: 4,
    borderColor: "#e0a030",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#e0a030",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  badgeEmoji: {
    fontSize: 56,
  },
  unlockText: {
    fontSize: rf(14),
    color: "#e0a030",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 2,
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
  },
  closeText: {
    fontSize: rf(18),
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  },
});
