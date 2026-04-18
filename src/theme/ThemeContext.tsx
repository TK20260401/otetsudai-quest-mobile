import React, { createContext, useContext, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { palettes, type Palette, type PaletteName } from "./palettes";

type ThemeContextType = {
  palette: Palette;
  paletteName: PaletteName;
  setPalette: (name: PaletteName) => void;
};

const STORAGE_KEY = "app_palette";

const ThemeContext = createContext<ThemeContextType>({
  palette: palettes.dungeon,
  paletteName: "dungeon",
  setPalette: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({
  children,
  initial = "dungeon",
}: {
  children: React.ReactNode;
  initial?: PaletteName;
}) {
  const [paletteName, setPaletteName] = useState<PaletteName>(initial);

  const setPalette = useCallback((name: PaletteName) => {
    setPaletteName(name);
    AsyncStorage.setItem(STORAGE_KEY, name).catch(() => {});
  }, []);

  return (
    <ThemeContext.Provider
      value={{ palette: palettes[paletteName], paletteName, setPalette }}
    >
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
  return "dungeon";
}
