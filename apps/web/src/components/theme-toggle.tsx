"use client";

import {useTheme} from "@/components/theme-context";
import type {AppLocale} from "@/lib/site";

export function ThemeToggle({locale = "en"}: {locale?: AppLocale}) {
  const {theme, toggleTheme} = useTheme();
  const isDark = theme === "dark";
  const themeLabel = isDark ? "starry" : "snowy";
  const nextThemeLabel = isDark ? "snowy" : "starry";
  const switchLabel = locale === "ko" ? `${isDark ? "눈" : "별"} 테마로 전환` : `Switch to ${nextThemeLabel} theme`;

  return (
    <button
      aria-label={switchLabel}
      className="theme-toggle__trigger theme-toggle__trigger--current"
      onClick={toggleTheme}
      title={switchLabel}
      type="button"
    >
      <span aria-hidden="true" className="theme-toggle__icon">{isDark ? "☄" : "❄"}</span>
      <span className="theme-toggle__label">{locale === "ko" ? isDark ? "별" : "눈" : themeLabel}</span>
    </button>
  );
}
