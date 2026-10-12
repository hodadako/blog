"use client";

import {useEffect, useState} from "react";
import type {AppLocale} from "@/lib/site";

export function MotionToggle({locale}: {locale: AppLocale}) {
  const [isPaused, setIsPaused] = useState(false);
  const [isReduced, setIsReduced] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let paused = document.documentElement.dataset.motion === "paused";
    try {
      paused = window.localStorage.getItem("site-motion") === "paused";
    } catch {
      // A blocked store still permits a session-only pause.
    }
    setIsPaused(paused);
    setIsHydrated(true);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = (): void => setIsReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const preference = isPaused ? "paused" : "running";
    document.documentElement.dataset.motion = preference;
    try {
      window.localStorage.setItem("site-motion", preference);
    } catch {
      // Keep the user's selection active without persistent storage.
    }
  }, [isHydrated, isPaused]);

  const label = isReduced
    ? locale === "ko" ? "기기 설정에 따라 배경 움직임을 줄였습니다" : "Background motion is reduced by your device setting"
    : isPaused
      ? locale === "ko" ? "배경 효과 재생" : "Resume background effects"
      : locale === "ko" ? "배경 효과 일시정지" : "Pause background effects";

  return (
    <button
      aria-label={label}
      className={`motion-toggle__trigger${isPaused ? " motion-toggle__trigger--paused" : ""}`}
      disabled={isReduced}
      onClick={() => setIsPaused((paused) => !paused)}
      title={label}
      type="button"
    >
      {isReduced ? locale === "ko" ? "움직임 줄임" : "Reduced motion"
        : isPaused ? locale === "ko" ? "효과 재생" : "Resume effects"
          : locale === "ko" ? "효과 정지" : "Pause effects"}
    </button>
  );
}
