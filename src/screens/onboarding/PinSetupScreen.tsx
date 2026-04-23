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
import { RubyText } from "../../components/Ruby";

type Props = {
  onNext: (pin: string) => void | Promise<void>;
  onBack: () => void;
  loading?: boolean;
};

type Phase = "create" | "confirm";

const PIN_LENGTH = 4;

export default function PinSetupScreen({ onNext, onBack, loading: externalLoading }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [phase, setPhase] = useState<Phase>("create");
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const isLoading = submitting || externalLoading;

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
      if (isLoading) return;
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
            setSubmitting(true);
            Promise.resolve(onNext(newPin)).catch(() => {
              setSubmitting(false);
              setPin("");
            });
          } else {
            shake();
            setError("ちがうよ！やりなおしてね");
            setTimeout(() => {
              setPin("");
              setFirstPin("");
              setPhase("create");
            }, 800);
          }
        }
      }
    },
    [pin, phase, firstPin, onNext, shake, isLoading],
  );

  const handleBackspace = useCallback(() => {
    setError("");
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const titleParts: (string | [string, string])[] =
    phase === "create"
      ? [["秘密", "ひみつ"], "のパスワードを", ["作", "つく"], "ろう"]
      : ["もう", ["一度", "いちど"], ["入", "い"], "れてね"];

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
        <RubyText style={styles.title} parts={titleParts} rubySize={7} />
        <RubyText style={styles.subtitle} parts={["4", ["桁", "けた"], "の", ["数字", "すうじ"]]} rubySize={6} />

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
        {isLoading && <RubyText style={styles.loadingText} parts={["アカウントを", ["作成中", "さくせいちゅう"], "..."]} rubySize={6} />}

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
      fontSize: rf(15),
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
    loadingText: {
      fontSize: rf(13),
      color: p.primary,
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
