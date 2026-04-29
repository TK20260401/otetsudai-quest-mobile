import { TextStyle } from "react-native";
import type { Palette } from "./palettes";

/**
 * タップ可能テキスト（リンク）の共通スタイル
 * color: p.primary + underline で一貫したリンク表現
 */
export function linkStyles(p: Palette) {
  return {
    /** 主要リンク — p.primary + underline */
    linkText: {
      color: p.primary,
      textDecorationLine: "underline",
      fontWeight: "600",
    } as TextStyle,
    /** 控えめリンク（スキップ/戻る） — p.textMuted + underline */
    linkTextMuted: {
      color: p.textMuted,
      textDecorationLine: "underline",
    } as TextStyle,
  };
}
