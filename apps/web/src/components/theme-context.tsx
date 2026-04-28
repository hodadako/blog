"use client";

import {createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode} from "react";

export type ThemeMode = "dark" | "light";

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = "site-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;

  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

function readStoredTheme(): ThemeMode {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  return storedTheme === "dark" ? "dark" : "light";
}

export function ThemeProvider({children}: {children: ReactNode}) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setThemeState(readStoredTheme());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [isHydrated, theme]);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({theme, setTheme, toggleTheme}),
    [setTheme, theme, toggleTheme],
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
