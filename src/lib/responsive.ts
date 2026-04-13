import { Dimensions, PixelRatio } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BASE_WIDTH = 375; // iPhone SE/8 基準

/**
 * 画面幅に比例したフォントサイズを返す
 * 最小値を設けて極端に小さくならないようにする
 */
export const rf = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * Math.min(scale, 1.3); // 最大1.3倍に制限
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};
