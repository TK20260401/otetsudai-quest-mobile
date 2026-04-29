import React, { useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from "react-native";
import KeyboardAwareScreen from "../../components/KeyboardAwareScreen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, type Palette } from "../../theme";
import { rf } from "../../lib/responsive";
import { RubyText } from "../../components/Ruby";
import RpgButton from "../../components/RpgButton";

type Props = {
  onRecover: (words: string[], newPin: string) => Promise<void>;
  onBack: () => void;
};

type Phase = "words" | "pin" | "confirm";

const PIN_LENGTH = 4;

export default function RecoverAccountScreen({ onRecover, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [phase, setPhase] = useState<Phase>("words");
  const [word1, setWord1] = useState("");
  const [word2, setWord2] = useState("");
  const [word3, setWord3] = useState("");
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const ref2 = useRef<TextInput>(null);
  const ref3 = useRef<TextInput>(null);

  const shake = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleWordsNext = useCallback(() => {
    const w1 = word1.trim();
    const w2 = word2.trim();
    const w3 = word3.trim();
    if (!w1 || !w2 || !w3) {
      setError("3つのあいことばを入力してね");
      return;
    }
    setError("");
    setPhase("pin");
  }, [word1, word2, word3]);

  const handlePinPress = useCallback(
    (digit: string) => {
      if (loading) return;
      setError("");
      if (pin.length >= PIN_LENGTH) return;

      const newPin = pin + digit;
      setPin(newPin);

      if (newPin.length === PIN_LENGTH) {
        if (phase === "pin") {
          setFirstPin(newPin);
          setPin("");
          setPhase("confirm");
        } else {
          if (newPin === firstPin) {
            setLoading(true);
            onRecover(
              [word1.trim(), word2.trim(), word3.trim()],
              newPin
            ).catch((err: any) => {
              setError(err.message || "復旧に失敗しました");
              setPin("");
              setFirstPin("");
              setPhase("words");
              setLoading(false);
            });
          } else {
            shake();
            setError("ちがうよ！やりなおしてね");
            setTimeout(() => {
              setPin("");
              setFirstPin("");
              setPhase("pin");
            }, 800);
          }
        }
      }
    },
    [pin, phase, firstPin, loading, word1, word2, word3, onRecover, shake],
  );

  const handleBackspace = useCallback(() => {
    setError("");
    setPin((prev) => prev.slice(0, -1));
  }, []);

  return (
    <KeyboardAwareScreen
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

      {phase === "words" ? (
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.wordsContent}
            keyboardShouldPersistTaps="handled"
          >
            <RubyText
              style={styles.title}
              parts={[["合言葉", "あいことば"], "を", ["入", "い"], "れてね"]}
              rubySize={7}
            />
            <RubyText
              style={styles.subtitle}
              parts={[["大事", "だいじ"], "な", ["合言葉", "あいことば"], "を3つ", ["入力", "にゅうりょく"]]}
              rubySize={6}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>1</Text>
              <TextInput
                style={styles.wordInput}
                value={word1}
                onChangeText={setWord1}
                placeholder="ひとつめ"
                placeholderTextColor={palette.textPlaceholder}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => ref2.current?.focus()}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>2</Text>
              <TextInput
                ref={ref2}
                style={styles.wordInput}
                value={word2}
                onChangeText={setWord2}
                placeholder="ふたつめ"
                placeholderTextColor={palette.textPlaceholder}
                returnKeyType="next"
                onSubmitEditing={() => ref3.current?.focus()}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>3</Text>
              <TextInput
                ref={ref3}
                style={styles.wordInput}
                value={word3}
                onChangeText={setWord3}
                placeholder="みっつめ"
                placeholderTextColor={palette.textPlaceholder}
                returnKeyType="done"
                onSubmitEditing={handleWordsNext}
              />
            </View>

            {error !== "" && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.buttonWrap}>
              <RpgButton
                tier="gold"
                size="lg"
                fullWidth
                disabled={!word1.trim() || !word2.trim() || !word3.trim()}
                onPress={handleWordsNext}
                accessibilityLabel="つぎへ"
              >
                <Text style={styles.buttonText}>つぎへ</Text>
              </RpgButton>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.content}>
          <RubyText
            style={styles.title}
            parts={
              phase === "pin"
                ? [["新", "あたら"], "しいパスワードを", ["作", "つく"], "ろう"]
                : ["もう", ["一度", "いちど"], ["入", "い"], "れてね"]
            }
            rubySize={7}
          />
          <RubyText
            style={styles.subtitle}
            parts={["4", ["桁", "けた"], "の", ["数字", "すうじ"]]}
            rubySize={6}
          />

          <Animated.View
            style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}
          >
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i < pin.length && styles.dotFilled]}
              />
            ))}
          </Animated.View>

          {error !== "" && <Text style={styles.errorText}>{error}</Text>}
          {loading && (
            <RubyText
              style={styles.loadingText}
              parts={[["復旧中", "ふっきゅうちゅう"], "..."]}
              rubySize={6}
            />
          )}

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
                        accessibilityLabel="ひともじけす"
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
                      onPress={() => handlePinPress(key)}
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
      )}
    </KeyboardAwareScreen>
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
    },
    wordsContent: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: rf(15),
      fontWeight: "800",
      color: p.primaryDark,
      marginBottom: 6,
      textAlign: "center",
    },
    subtitle: {
      fontSize: rf(13),
      color: p.textMuted,
      marginBottom: 24,
      textAlign: "center",
    },
    inputGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      width: "100%",
      marginBottom: 12,
    },
    inputLabel: {
      fontSize: rf(16),
      fontWeight: "bold",
      color: p.textMuted,
      width: 24,
      textAlign: "center",
    },
    wordInput: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: p.borderStrong,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontSize: rf(18),
      color: "#1a1a1a",
      backgroundColor: p.white,
      textAlign: "center",
    },
    buttonWrap: {
      width: "100%",
      marginTop: 16,
    },
    buttonText: {
      fontSize: rf(18),
      fontWeight: "bold",
      color: "#2A1800",
    },
    errorText: {
      fontSize: rf(13),
      color: p.red,
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
    dotsRow: {
      flexDirection: "row",
      gap: 20,
      marginBottom: 16,
    },
    dot: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: p.borderStrong,
      backgroundColor: "transparent",
    },
    dotFilled: {
      backgroundColor: p.primary,
      borderColor: p.primary,
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
      borderWidth: 1.5,
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
