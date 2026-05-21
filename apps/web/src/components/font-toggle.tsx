"use client";

import {useEffect, useState} from "react";

type FontPreference = "default" | "pretendard";

const FONT_STORAGE_KEY = "site-font";

function applyFontPreference(fontPreference: FontPreference): void {
  const root = document.documentElement;

  if (fontPreference === "pretendard") {
    root.dataset.font = fontPreference;
    return;
  }

  delete root.dataset.font;
}

function readStoredFontPreference(): FontPreference {
  const storedFontPreference = window.localStorage.getItem(FONT_STORAGE_KEY);
  return storedFontPreference === "pretendard" ? "pretendard" : "default";
}

export function FontToggle() {
  const [fontPreference, setFontPreference] = useState<FontPreference>("default");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const nextFontPreference = readStoredFontPreference();
    setFontPreference(nextFontPreference);
    applyFontPreference(nextFontPreference);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    applyFontPreference(fontPreference);
    window.localStorage.setItem(FONT_STORAGE_KEY, fontPreference);
  }, [fontPreference, isHydrated]);

  const isPretendard = fontPreference === "pretendard";

  return (
    <button
      aria-label={`Switch to ${isPretendard ? "default" : "Pretendard"} font`}
      aria-pressed={isPretendard}
      className="font-toggle__trigger"
      onClick={() => {
        setFontPreference((currentValue) => (currentValue === "pretendard" ? "default" : "pretendard"));
      }}
      title={isPretendard ? "Switch to default font" : "Switch to Pretendard"}
      type="button"
    >
      <span aria-hidden="true" className="font-toggle__icon">
        Ag
      </span>
      <span className="font-toggle__label">{isPretendard ? "Pretendard" : "Default"}</span>
    </button>
  );
}
