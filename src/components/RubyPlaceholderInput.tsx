import React, { useMemo } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useTheme, type Palette } from "../theme";
import { RubyText } from "./Ruby";

type Props = Omit<TextInputProps, "placeholder"> & {
  /** プレースホルダを RubyText で描画するための parts 定義 */
  placeholderParts: (string | [string, string])[];
  placeholderRubySize?: number;
  /** オーバーレイのインセット。TextInput の padding に合わせる */
  placeholderInset?: { top?: number; left?: number; right?: number };
  /** true の場合は placeholder を 1 行に強制（既定）。
   * 長い placeholder で複数行 TextInput に合わせて折り返したい時は false */
  placeholderNoWrap?: boolean;
  containerStyle?: ViewStyle;
};

/**
 * placeholder に漢字＋ルビを表示できる TextInput ラッパー。
 * React Native の TextInput.placeholder は string しか受け付けないため、
 * value が空の時だけ絶対配置の RubyText をオーバーレイで描画する。
 * 子画面で「ひらがな」ではなく「漢字＋ルビ」を使いたいケース用。
 */
export default function RubyPlaceholderInput({
  placeholderParts,
  placeholderRubySize = 4,
  placeholderInset = { top: 14, left: 14, right: 14 },
  placeholderNoWrap = true,
  containerStyle,
  value,
  style,
  ...rest
}: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const isEmpty = !value || String(value).length === 0;

  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput value={value} style={style} {...rest} />
      {isEmpty ? (
        <View
          pointerEvents="none"
          style={[
            styles.placeholder,
            {
              top: placeholderInset.top ?? 14,
              left: placeholderInset.left ?? 14,
              right: placeholderInset.right ?? 14,
            },
          ]}
        >
          <RubyText
            parts={placeholderParts}
            rubySize={placeholderRubySize}
            style={styles.placeholderText}
            noWrap={placeholderNoWrap}
          />
        </View>
      ) : null}
    </View>
  );
}

function createStyles(p: Palette) {
  return StyleSheet.create({
    container: {
      position: "relative" as const,
    },
    placeholder: {
      position: "absolute" as const,
    },
    placeholderText: {
      fontSize: 14,
      color: p.textPlaceholder,
      fontStyle: "italic" as const,
    },
  });
}
