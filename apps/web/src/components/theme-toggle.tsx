"use client";

import {useTheme} from "@/components/theme-context";

export function ThemeToggle() {
  const {theme, toggleTheme} = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";
  const themeLabel = theme === "dark" ? "starry" : "snowy";

  return (
    <button
      aria-label={`Switch to ${nextTheme} theme`}
      aria-pressed={theme === "light"}
      className="theme-toggle__trigger"
      onClick={toggleTheme}
      title={`Switch to ${themeLabel} theme`}
      type="button"
    >
      <span aria-hidden="true" className="theme-toggle__icon">
        {theme === "dark" ? "☾" : "☀"}
      </span>
      <span className="theme-toggle__label">{themeLabel}</span>
    </button>
  );
}
