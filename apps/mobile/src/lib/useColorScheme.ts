/**
 * Color scheme hook with persistence.
 *
 * Uses the official NativeWind v4 API:
 *   import { colorScheme } from "nativewind";
 *   colorScheme.set("dark" | "light" | "system");
 *
 * See: https://www.nativewind.dev/docs/core-concepts/dark-mode
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  colorScheme as nwColorScheme,
  useColorScheme as useNativewindColorScheme,
} from "nativewind";
import * as React from "react";

import { COLORS } from "@/theme/colors";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

/**
 * Call once at app startup to apply the saved theme before first render.
 */
export async function loadThemePreference(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") {
      nwColorScheme.set(saved);
    }
  } catch {}
}

function useColorScheme() {
  const { colorScheme } = useNativewindColorScheme();
  const [themePreference, setThemePreference] =
    React.useState<ThemePreference>("system");

  // Load saved preference on mount
  React.useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "system") {
        setThemePreference(saved);
      }
    });
  }, []);

  function handleSetColorScheme(scheme: ThemePreference) {
    setThemePreference(scheme);
    nwColorScheme.set(scheme);
    AsyncStorage.setItem(STORAGE_KEY, scheme);
  }

  const effective = colorScheme ?? "light";

  return {
    colorScheme: effective,
    isDarkColorScheme: effective === "dark",
    setColorScheme: handleSetColorScheme,
    colors: COLORS[effective] ?? COLORS.light,
    themePreference,
  };
}

export { useColorScheme };
