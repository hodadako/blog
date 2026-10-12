"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAutoScrollDistance, isScrollKey } from "./auto-scroll";

export function useAutoScroll(speed: number, enabled: boolean) {
  const [running, setRunning] = useState(false);
  const frame = useRef<number | null>(null);

  const pause = useCallback(() => setRunning(false), []);
  const toggle = useCallback(() => {
    if (!enabled) return;
    setRunning((current) => !current);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) setRunning(false);
  }, [enabled]);

  useEffect(() => {
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    return () => {
      root.style.scrollBehavior = previousBehavior;
    };
  }, []);

  useEffect(() => {
    if (!running || !enabled) return;
    let previousTime: number | undefined;
    const scrollFrame = (timestamp: number): void => {
      if (document.visibilityState === "hidden") {
        setRunning(false);
        return;
      }
      if (previousTime !== undefined) {
        const distance = getAutoScrollDistance(speed, timestamp - previousTime);
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const nextPosition = Math.min(maxScroll, window.scrollY + distance);
        window.scrollTo(0, nextPosition);
        if (nextPosition >= maxScroll) {
          setRunning(false);
          return;
        }
      }
      previousTime = timestamp;
      frame.current = window.requestAnimationFrame(scrollFrame);
    };
    const stopForKey = (event: KeyboardEvent): void => {
      if (isScrollKey(event.key)) setRunning(false);
    };
    const stopForManualScroll = (): void => setRunning(false);
    const stopWhenHidden = (): void => {
      if (document.visibilityState === "hidden") setRunning(false);
    };

    window.addEventListener("wheel", stopForManualScroll, { passive: true });
    window.addEventListener("touchmove", stopForManualScroll, { passive: true });
    window.addEventListener("keydown", stopForKey);
    document.addEventListener("visibilitychange", stopWhenHidden);
    frame.current = window.requestAnimationFrame(scrollFrame);

    return () => {
      if (frame.current !== null) window.cancelAnimationFrame(frame.current);
      window.removeEventListener("wheel", stopForManualScroll);
      window.removeEventListener("touchmove", stopForManualScroll);
      window.removeEventListener("keydown", stopForKey);
      document.removeEventListener("visibilitychange", stopWhenHidden);
    };
  }, [enabled, running, speed]);

  return { running, toggle, pause };
}
