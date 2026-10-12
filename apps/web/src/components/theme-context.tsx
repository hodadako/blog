"use client";

import {createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode} from "react";

export type ThemeMode = "dark" | "light";
export type ThemePreference = ThemeMode | "system";

interface ThemeContextValue {
  theme: ThemeMode;
  preference: ThemePreference;
  setTheme: (theme: ThemeMode) => void;
  setPreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = "site-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;

  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function readStoredTheme(): ThemePreference {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(value) ? value : "light";
  } catch {
    return "light";
  }
}

function readSystemTheme(): ThemeMode {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

function resolveTheme(preference: ThemePreference, systemTheme: ThemeMode): ThemeMode {
  return preference === "system" ? systemTheme : preference;
}

export function ThemeProvider({children, persist = true}: {children: ReactNode; persist?: boolean}) {
  const [preference, setPreferenceState] = useState<ThemePreference>("light");
  const [systemTheme, setSystemTheme] = useState<ThemeMode>("light");
  const [isHydrated, setIsHydrated] = useState(false);
  const theme = resolveTheme(preference, systemTheme);

  useEffect(() => {
    setPreferenceState(persist ? readStoredTheme() : "light");
    setSystemTheme(readSystemTheme());
    setIsHydrated(true);

    let media: MediaQueryList | undefined;
    const handleSystemThemeChange = (event: MediaQueryListEvent): void => {
      setSystemTheme(event.matches ? "dark" : "light");
    };
    try {
      media = window.matchMedia("(prefers-color-scheme: dark)");
      media.addEventListener("change", handleSystemThemeChange);
    } catch {
      media = undefined;
    }
    return () => media?.removeEventListener("change", handleSystemThemeChange);
  }, [persist]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    applyTheme(theme);
    try {
      if (persist) window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // The selected theme remains active for this session when storage is blocked.
    }
  }, [isHydrated, persist, preference, theme]);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setPreferenceState(nextTheme);
  }, []);

  const setPreference = useCallback((nextPreference: ThemePreference) => {
    setPreferenceState(nextPreference);
  }, []);

  const toggleTheme = useCallback(() => {
    setPreferenceState((currentPreference) => {
      const currentTheme = resolveTheme(currentPreference, readSystemTheme());
      return currentTheme === "dark" ? "light" : "dark";
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({theme, preference, setTheme, setPreference, toggleTheme}),
    [preference, setPreference, setTheme, theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
