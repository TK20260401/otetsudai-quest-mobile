import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useAccessibility,
  FONT_SCALE_VALUES,
  type FontScaleKey,
} from "../accessibility";
import { useTheme } from "../theme";

/**
 * 全画面共通のアクセシビリティフローティングトグル
 * 画面右上に3ボタン（ルビ / ハイコントラスト / 拡大）を横並びで常時表示
 *
 * 読み上げやスイッチ操作は OS 側 (VoiceOver/TalkBack/Switch Control) に委譲。
 * ここで扱うのは子供自身が切り替える一次アクセシビリティのみ。
 */

const FONT_SCALE_ORDER: FontScaleKey[] = ["small", "medium", "large", "xlarge"];
const FONT_SCALE_LABELS: Record<FontScaleKey, string> = {
  small: "小",
  medium: "中",
  large: "大",
  xlarge: "特大",
};

export default function AccessibilityToggle() {
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const {
    rubyVisible,
    monochrome,
    fontScale,
    setRubyVisible,
    setMonochrome,
    setFontScale,
  } = useAccessibility();

  const cycleFontScale = () => {
    const idx = FONT_SCALE_ORDER.indexOf(fontScale);
    const next = FONT_SCALE_ORDER[(idx + 1) % FONT_SCALE_ORDER.length];
    setFontScale(next);
  };

  return (
    <View style={[styles.container, { top: insets.top + 4 }]}>
      <PillButton
        active={rubyVisible}
        label={`ルビ ${rubyVisible ? "ON" : "OFF"}`}
        onPress={() => setRubyVisible(!rubyVisible)}
        a11yLabel={`ルビ表示 ${rubyVisible ? "オン" : "オフ"}`}
        palette={palette}
      />
      <PillButton
        active={monochrome}
        label={`ハイコントラスト ${monochrome ? "ON" : "OFF"}`}
        onPress={() => setMonochrome(!monochrome)}
        a11yLabel={`ハイコントラスト ${monochrome ? "オン" : "オフ"}`}
        palette={palette}
      />
      <PillButton
        active={fontScale !== "medium"}
        label={`字 ${FONT_SCALE_LABELS[fontScale]}`}
        onPress={cycleFontScale}
        a11yLabel={`文字の大きさ ${FONT_SCALE_LABELS[fontScale]} (倍率 ${FONT_SCALE_VALUES[fontScale]})`}
        palette={palette}
      />
    </View>
  );
}

function PillButton({
  active,
  label,
  onPress,
  a11yLabel,
  palette,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  a11yLabel: string;
  palette: ReturnType<typeof useTheme>["palette"];
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor: active ? palette.accent : palette.surfaceMuted,
          borderColor: active ? palette.accentDark : palette.border,
        },
      ]}
      accessibilityLabel={a11yLabel}
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
    >
      <Text
        style={[styles.text, { color: active ? "#fff" : palette.textMuted }]}
        allowFontScaling={false}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 12,
    zIndex: 9999,
    flexDirection: "row",
    gap: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 44,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 11,
    fontWeight: "bold",
  },
});
