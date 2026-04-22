import React, { useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, type Palette } from "../../theme";
import { rf } from "../../lib/responsive";

type Props = {
  onNext: (pin: string) => void;
  onBack: () => void;
};

type Phase = "create" | "confirm";

const PIN_LENGTH = 4;

export default function PinSetupScreen({ onNext, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [phase, setPhase] = useState<Phase>("create");
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState("");
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handlePress = useCallback(
    (digit: string) => {
      setError("");
      if (pin.length >= PIN_LENGTH) return;

      const newPin = pin + digit;
      setPin(newPin);

      if (newPin.length === PIN_LENGTH) {
        if (phase === "create") {
          setFirstPin(newPin);
          setPin("");
          setPhase("confirm");
        } else {
          if (newPin === firstPin) {
            onNext(newPin);
          } else {
            shake();
            setError("ちがうよ！もういちど やりなおしてね");
            setTimeout(() => {
              setPin("");
              setFirstPin("");
              setPhase("create");
            }, 800);
          }
        }
      }
    },
    [pin, phase, firstPin, onNext, shake],
  );

  const handleBackspace = useCallback(() => {
    setError("");
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const titleText =
    phase === "create"
      ? "ひみつのパスワードをつくろう"
      : "もういちど おなじすうじを いれてね";

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 },
      ]}
    >
      <TouchableOpacity
        onPress={onBack}
        style={styles.backButton}
        accessibilityLabel="もどる"
        accessibilityRole="button"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.backArrow}>{"\u2190"}</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>{titleText}</Text>
        <Text style={styles.subtitle}>4けたのすうじ</Text>

        <Animated.View
          style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}
        >
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i < pin.length && styles.dotFilled]}
              accessibilityLabel={i < pin.length ? "にゅうりょくずみ" : "みにゅうりょく"}
            />
          ))}
        </Animated.View>

        {error !== "" && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.numpad}>
          {[
            ["1", "2", "3"],
            ["4", "5", "6"],
            ["7", "8", "9"],
            ["", "0", "back"],
          ].map((row, ri) => (
            <View key={ri} style={styles.numpadRow}>
              {row.map((key) => {
                if (key === "") {
                  return <View key="empty" style={styles.numpadKeyEmpty} />;
                }
                if (key === "back") {
                  return (
                    <TouchableOpacity
                      key="back"
                      style={styles.numpadKey}
                      onPress={handleBackspace}
                      accessibilityLabel="いちもじけす"
                      accessibilityRole="button"
                    >
                      <Text style={styles.numpadBackspace}>{"\u232B"}</Text>
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.numpadKey}
                    onPress={() => handlePress(key)}
                    accessibilityLabel={key}
                    accessibilityRole="button"
                  >
                    <Text style={styles.numpadDigit}>{key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: p.backgroundLanding,
      paddingHorizontal: 20,
    },
    backButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    backArrow: {
      fontSize: rf(24),
      color: p.primaryDark,
      fontWeight: "bold",
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginTop: -20,
    },
    title: {
      fontSize: rf(18),
      fontWeight: "800",
      color: p.primaryDark,
      marginBottom: 6,
      textAlign: "center",
    },
    subtitle: {
      fontSize: rf(14),
      color: p.textMuted,
      marginBottom: 24,
      textAlign: "center",
    },
    dotsRow: {
      flexDirection: "row",
      gap: 20,
      marginBottom: 16,
    },
    dot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: p.borderStrong,
      backgroundColor: "transparent",
    },
    dotFilled: {
      backgroundColor: p.primary,
      borderColor: p.primary,
    },
    errorText: {
      fontSize: rf(13),
      color: "#E74C3C",
      fontWeight: "bold",
      marginBottom: 12,
      textAlign: "center",
    },
    numpad: {
      gap: 12,
      marginTop: 8,
    },
    numpadRow: {
      flexDirection: "row",
      gap: 20,
      justifyContent: "center",
    },
    numpadKey: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: p.white,
      borderWidth: 2,
      borderColor: p.borderStrong,
      alignItems: "center",
      justifyContent: "center",
    },
    numpadKeyEmpty: {
      width: 64,
      height: 64,
    },
    numpadDigit: {
      fontSize: rf(24),
      fontWeight: "bold",
      color: p.primaryDark,
    },
    numpadBackspace: {
      fontSize: rf(22),
      color: p.textMuted,
    },
  });
}
