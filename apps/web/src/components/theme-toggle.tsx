"use client";

import {useTheme} from "@/components/theme-context";
import type {AppLocale} from "@/lib/site";
import {ToggleButton} from "@/components/ui";

export function ThemeToggle({locale = "en"}: {locale?: AppLocale}) {
  const {theme, toggleTheme} = useTheme();
  const isDark = theme === "dark";
  const themeLabel = isDark ? "Starry" : "Snowy";
  const nextThemeLabel = isDark ? "Snowy" : "Starry";
  const switchLabel = locale === "ko" ? `${nextThemeLabel} 테마로 전환` : `Switch to ${nextThemeLabel} theme`;

  return (
    <ToggleButton
      pressed={isDark}
      size="sm"
      aria-label={`${themeLabel} · ${switchLabel}`}
      className="theme-toggle__trigger"
      onClick={toggleTheme}
      title={switchLabel}
      type="button"
    >
      <span className="theme-toggle__label">{themeLabel}</span>
    </ToggleButton>
  );
}
