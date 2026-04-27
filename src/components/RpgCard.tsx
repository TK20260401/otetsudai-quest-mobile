import React, { useMemo } from "react";
import { View, Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { useTheme, type Palette } from "../theme";

type Tier = "gold" | "silver" | "bronze" | "violet";
type Variant = "full" | "compact";

type Props = {
  tier?: Tier;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  title?: React.ReactNode;
  children: React.ReactNode;
};

export default function RpgCard({ tier: _tier = "gold", variant = "full", style, contentStyle, title, children }: Props) {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);

  return (
    <View style={[styles.root, style]}>
      {title ? (
        <View style={styles.titleBar}>
          {typeof title === "string" ? (
            <Text style={styles.titleText}>{title}</Text>
          ) : (
            title
          )}
        </View>
      ) : null}

      <View style={[variant === "compact" ? styles.contentCompact : styles.content, contentStyle]}>
        {children}
      </View>
    </View>
  );
}

function createStyles(palette: Palette) {
  return StyleSheet.create({
    root: {
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1.5,
      borderColor: palette.border,
    },
    titleBar: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: palette.border,
    },
    titleText: {
      fontSize: 13,
      fontWeight: "700",
      color: palette.textStrong,
    },
    content: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    contentCompact: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
  });
}
