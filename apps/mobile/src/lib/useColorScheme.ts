import { useEffect, useState } from "react";
import { Appearance, ColorSchemeName } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/theme/colors";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "theme_preference";

type ThemeListener = (pref: ThemePreference) => void;

const listeners = new Set<ThemeListener>();
let currentPreference: ThemePreference = "system";
let loaded = false;

function notify() {
  for (const listener of listeners) {
    listener(currentPreference);
  }
}

function applyPreference(pref: ThemePreference) {
  if (pref === "system") {
    Appearance.setColorScheme(null);
  } else {
    Appearance.setColorScheme(pref);
  }
}

/**
 * Hydrate theme preference from AsyncStorage and apply it.
 * Call once at app startup (e.g. in root _layout.tsx useEffect).
 */
export async function loadThemePreference(): Promise<ThemePreference> {
  if (loaded) return currentPreference;
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      currentPreference = stored;
    }
  } catch {
    // Fall back to system default — safe to ignore
  }
  loaded = true;
  applyPreference(currentPreference);
  notify();
  return currentPreference;
}

/**
 * Persist a new theme preference and apply it immediately.
 */
export async function setColorScheme(pref: ThemePreference): Promise<void> {
  currentPreference = pref;
  applyPreference(pref);
  notify();
  try {
    await AsyncStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // Non-fatal — preference is applied in-memory even if storage fails
  }
}

/**
 * React hook — returns reactive theme state including a setter.
 */
export function useColorScheme() {
  // Track the resolved RN color scheme separately so NativeWind re-renders
  const [rnScheme, setRnScheme] = useState<NonNullable<ColorSchemeName>>(
    Appearance.getColorScheme() ?? "light"
  );
  const [themePreference, setThemePreferenceLocal] =
    useState<ThemePreference>(currentPreference);

  useEffect(() => {
    // Sync preference state
    const prefListener: ThemeListener = (pref) => {
      setThemePreferenceLocal(pref);
    };
    listeners.add(prefListener);

    // Ensure preference is loaded
    if (!loaded) {
      loadThemePreference();
    }

    // Track RN Appearance changes (handles system theme flips)
    const appearanceSubscription = Appearance.addChangeListener(({ colorScheme }) => {
      setRnScheme(colorScheme ?? "light");
    });

    return () => {
      listeners.delete(prefListener);
      appearanceSubscription.remove();
    };
  }, []);

  const colorScheme: "light" | "dark" = rnScheme === "dark" ? "dark" : "light";

  return {
    colorScheme,
    isDarkColorScheme: colorScheme === "dark",
    colors: COLORS[colorScheme],
    themePreference,
    setColorScheme,
  };
}
