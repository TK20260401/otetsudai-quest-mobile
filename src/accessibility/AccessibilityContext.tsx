import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * アプリ全体のアクセシビリティ設定を一元管理
 *
 * 管理する3軸:
 *   1. rubyVisible  — ルビ表示ON/OFF（独自機能、OS非対応）
 *   2. monochrome   — 白黒モード（palette を grayscale 変換）
 *   3. fontScale    — フォントサイズ (small/medium/large/xlarge)
 *
 * OS標準機能 (VoiceOver/TalkBack/Switch Control/ズーム) には委譲する方針:
 *   ここで扱うのは「子供が自己決定で切替える」一次アクセシビリティのみ。
 *   読み上げ・スイッチ操作は OS 側に任せ、アプリは accessibilityLabel 等の
 *   属性を正しく付与することでサポートする。
 */

export const FONT_SCALE_VALUES = {
  small: 0.9,
  medium: 1.0,
  large: 1.2,
  xlarge: 1.4,
} as const;

export type FontScaleKey = keyof typeof FONT_SCALE_VALUES;

type AccessibilityState = {
  rubyVisible: boolean;
  monochrome: boolean;
  fontScale: FontScaleKey;
};

type AccessibilityContextType = AccessibilityState & {
  fontScaleValue: number;
  setRubyVisible: (v: boolean) => void;
  setMonochrome: (v: boolean) => void;
  setFontScale: (v: FontScaleKey) => void;
};

const DEFAULT_STATE: AccessibilityState = {
  rubyVisible: true,
  monochrome: false,
  fontScale: "medium",
};

const STORAGE_KEY = "accessibility_settings";
const LEGACY_RUBY_KEY = "ruby_visible";

const AccessibilityCtx = createContext<AccessibilityContextType>({
  ...DEFAULT_STATE,
  fontScaleValue: FONT_SCALE_VALUES[DEFAULT_STATE.fontScale],
  setRubyVisible: () => {},
  setMonochrome: () => {},
  setFontScale: () => {},
});

export function useAccessibility() {
  return useContext(AccessibilityCtx);
}

/** フォント倍率のみ欲しい呼び出し元向けヘルパー */
export function useScaledFont() {
  const { fontScaleValue } = useAccessibility();
  return useCallback(
    (base: number) => Math.round(base * fontScaleValue * 100) / 100,
    [fontScaleValue]
  );
}

export function AccessibilityProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial?: Partial<AccessibilityState>;
}) {
  const [state, setState] = useState<AccessibilityState>({
    ...DEFAULT_STATE,
    ...initial,
  });

  const persist = useCallback((next: AccessibilityState) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const setRubyVisible = useCallback(
    (v: boolean) => {
      setState((prev) => {
        const next = { ...prev, rubyVisible: v };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const setMonochrome = useCallback(
    (v: boolean) => {
      setState((prev) => {
        const next = { ...prev, monochrome: v };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const setFontScale = useCallback(
    (v: FontScaleKey) => {
      setState((prev) => {
        const next = { ...prev, fontScale: v };
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const value = useMemo<AccessibilityContextType>(
    () => ({
      ...state,
      fontScaleValue: FONT_SCALE_VALUES[state.fontScale],
      setRubyVisible,
      setMonochrome,
      setFontScale,
    }),
    [state, setRubyVisible, setMonochrome, setFontScale]
  );

  return (
    <AccessibilityCtx.Provider value={value}>
      {children}
    </AccessibilityCtx.Provider>
  );
}

/**
 * AsyncStorage から設定を復元。
 * 旧キー `ruby_visible` が残っていれば統合キーへ移行する（1回のみ）。
 */
export async function loadSavedAccessibility(): Promise<Partial<AccessibilityState>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AccessibilityState>;
      return sanitize(parsed);
    }
    const legacy = await AsyncStorage.getItem(LEGACY_RUBY_KEY);
    if (legacy !== null) {
      const next: AccessibilityState = {
        ...DEFAULT_STATE,
        rubyVisible: legacy !== "0",
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      await AsyncStorage.removeItem(LEGACY_RUBY_KEY).catch(() => {});
      return next;
    }
  } catch {}
  return {};
}

function sanitize(s: Partial<AccessibilityState>): Partial<AccessibilityState> {
  const out: Partial<AccessibilityState> = {};
  if (typeof s.rubyVisible === "boolean") out.rubyVisible = s.rubyVisible;
  if (typeof s.monochrome === "boolean") out.monochrome = s.monochrome;
  if (s.fontScale && s.fontScale in FONT_SCALE_VALUES) out.fontScale = s.fontScale;
  return out;
}
