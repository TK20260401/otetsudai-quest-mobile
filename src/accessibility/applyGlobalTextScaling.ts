import { Text, TextInput } from "react-native";

/**
 * OSの Dynamic Type（iOS）/ フォントサイズ（Android）を全Text/TextInputに反映。
 * アプリ側のレイアウト保護のため上限倍率を1.3に制限する。
 *
 * 注意:
 *   - アプリ内「字 大/特大」トグル(fontScale)は Ruby コンポーネントや
 *     useScaledFont フックを通した箇所のみに反映。プレーンな <Text> には
 *     OS側のスケールだけが効く（アプリ内トグルとは独立）。
 *   - 両者は乗算的に重なる設計: OS倍率 × アプリfontScale（Ruby系）
 */
export function applyGlobalTextScaling() {
  const base = { allowFontScaling: true, maxFontSizeMultiplier: 1.3 };
  (Text as any).defaultProps = { ...((Text as any).defaultProps ?? {}), ...base };
  (TextInput as any).defaultProps = {
    ...((TextInput as any).defaultProps ?? {}),
    ...base,
  };
}
