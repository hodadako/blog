"use client";

import {useTheme} from "@/components/theme-context";

export function ThemeToggle() {
  const {theme, setTheme} = useTheme();

  return (
    <div aria-label="Theme" className="theme-toggle__group" role="group">
      <button
        aria-label="Use starry theme"
        aria-pressed={theme === "dark"}
        className="theme-toggle__trigger"
        onClick={() => setTheme("dark")}
        title="Use starry theme"
        type="button"
      >
        <span aria-hidden="true" className="theme-toggle__icon">☄</span>
        <span className="theme-toggle__label">starry</span>
      </button>
      <button
        aria-label="Use snowy theme"
        aria-pressed={theme === "light"}
        className="theme-toggle__trigger"
        onClick={() => setTheme("light")}
        title="Use snowy theme"
        type="button"
      >
        <span aria-hidden="true" className="theme-toggle__icon">❄</span>
        <span className="theme-toggle__label">snowy</span>
      </button>
    </div>
  );
}
