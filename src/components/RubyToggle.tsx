import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRuby } from "./Ruby";
import { useTheme } from "../theme";

/**
 * 全画面共通のルビON/OFFフローティングトグル
 * 画面右上に常時表示
 */
export default function RubyToggle() {
  const { rubyVisible, setRubyVisible } = useRuby();
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <TouchableOpacity
      onPress={() => setRubyVisible(!rubyVisible)}
      style={[
        styles.toggle,
        {
          top: insets.top + 4,
          backgroundColor: rubyVisible ? palette.accent : palette.surfaceMuted,
        },
      ]}
      accessibilityLabel="ルビ表示切替"
      accessibilityRole="switch"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text
        style={[
          styles.text,
          { color: rubyVisible ? "#fff" : palette.textMuted },
        ]}
      >
        ルビ {rubyVisible ? "ON" : "OFF"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggle: {
    position: "absolute",
    right: 12,
    zIndex: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  text: {
    fontSize: 11,
    fontWeight: "bold",
  },
});
