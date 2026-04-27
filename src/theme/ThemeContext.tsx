import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { palettes, type Palette, type PaletteName } from "./palettes";
import { toGrayscalePalette } from "./grayscale";
import { useAccessibility } from "../accessibility";

type ThemeContextType = {
  palette: Palette;
  paletteName: PaletteName;
  setPalette: (name: PaletteName) => void;
};

const STORAGE_KEY = "app_palette";

const ThemeContext = createContext<ThemeContextType>({
  palette: palettes.forest,
  paletteName: "forest",
  setPalette: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({
  children,
  initial = "forest",
}: {
  children: React.ReactNode;
  initial?: PaletteName;
}) {
  const [paletteName, setPaletteName] = useState<PaletteName>(initial);
  const { monochrome } = useAccessibility();

  const setPalette = useCallback((name: PaletteName) => {
    setPaletteName(name);
    AsyncStorage.setItem(STORAGE_KEY, name).catch(() => {});
  }, []);

  const palette = useMemo(() => {
    const base = palettes[paletteName];
    return monochrome ? toGrayscalePalette(base) : base;
  }, [paletteName, monochrome]);

  return (
    <ThemeContext.Provider value={{ palette, paletteName, setPalette }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** AsyncStorageから保存済みパレット名を復元 */
export async function loadSavedPalette(): Promise<PaletteName> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved && saved in palettes) return saved as PaletteName;
  } catch {}
  return "forest";
}
