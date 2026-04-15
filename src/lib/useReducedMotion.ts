import { useState, useEffect } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * OS の「視差効果を減らす」設定を検出するフック。
 * true のとき、アニメーションや haptics を抑制する。
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced
    );
    return () => sub.remove();
  }, []);

  return reduced;
}
