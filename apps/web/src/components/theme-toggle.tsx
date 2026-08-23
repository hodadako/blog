"use client";

import {useTheme} from "@/components/theme-context";

export function ThemeToggle() {
  const {theme, toggleTheme} = useTheme();
  const isDark = theme === "dark";
  const themeLabel = isDark ? "starry" : "snowy";
  const nextThemeLabel = isDark ? "snowy" : "starry";

  return (
    <button
      aria-label={`Switch to ${nextThemeLabel} theme`}
      className="theme-toggle__trigger theme-toggle__trigger--current"
      onClick={toggleTheme}
      title={`Switch to ${nextThemeLabel} theme`}
      type="button"
    >
      <span aria-hidden="true" className="theme-toggle__icon">{isDark ? "☄" : "❄"}</span>
      <span className="theme-toggle__label">{themeLabel}</span>
    </button>
  );
}
