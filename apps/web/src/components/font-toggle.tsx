"use client";

import {useEffect, useState} from "react";
import type {AppLocale} from "@/lib/site";
import {ToggleButton} from "@/components/ui";

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
  try {
    const storedFontPreference = window.localStorage.getItem(FONT_STORAGE_KEY);
    return storedFontPreference === "pretendard" ? "pretendard" : "default";
  } catch {
    return "default";
  }
}

export function FontToggle({locale = "en"}: {locale?: AppLocale}) {
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
    try {
      window.localStorage.setItem(FONT_STORAGE_KEY, fontPreference);
    } catch {
      // Keep the selected font usable for this session when storage is blocked.
    }
  }, [fontPreference, isHydrated]);

  const isPretendard = fontPreference === "pretendard";
  const switchLabel = locale === "ko"
    ? `${isPretendard ? "기본" : "Pretendard"} 글꼴로 전환`
    : `Switch to ${isPretendard ? "default" : "Pretendard"} font`;

  return (
    <ToggleButton
      size="sm"
      aria-label={switchLabel}
      pressed={isPretendard}
      className="font-toggle__trigger"
      onClick={() => {
        setFontPreference((currentValue) => (currentValue === "pretendard" ? "default" : "pretendard"));
      }}
      title={switchLabel}
      type="button"
    >
      <span aria-hidden="true" className="font-toggle__icon">
        Ag
      </span>
      <span className="font-toggle__label">{isPretendard ? "Pretendard" : locale === "ko" ? "기본" : "Default"}</span>
    </ToggleButton>
  );
}
