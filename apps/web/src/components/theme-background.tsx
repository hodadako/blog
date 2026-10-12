"use client";

import {useEffect, useRef} from "react";
import {SnowfallCanvas} from "react-snowfall";
import {useTheme} from "@/components/theme-context";

export function ThemeBackground() {
  const {theme} = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (theme !== "light" || !canvas) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 45rem)");
    const color = getComputedStyle(canvas).getPropertyValue("--color-snowfall-flake").trim();
    const snowflakeCount = (): number => mobile.matches ? 32 : 80;
    let snowfall: SnowfallCanvas | undefined;
    const isPaused = (): boolean => motion.matches || document.documentElement.dataset.motion === "paused";
    const drawStaticSnow = (): void => {
      const context = canvas.getContext("2d");
      if (!context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = color;
      context.beginPath();
      const radius = parseFloat(getComputedStyle(canvas).getPropertyValue("--snow-static-radius"));
      // A stable scatter fills the viewport even before the falling particles enter from above.
      for (let index = 0; index < snowflakeCount(); index++) {
        const x = ((index * 0.61803398875 + 0.1) % 1) * canvas.width;
        const y = ((index + 0.5) / snowflakeCount()) * canvas.height;
        context.moveTo(x + radius, y);
        context.arc(x, y, radius, 0, Math.PI * 2);
      }
      context.fill();
    };
    const redraw = (): void => {
      snowfall?.pause();
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      // Recreate only on settings/size changes so resuming never advances by the paused time.
      snowfall = new SnowfallCanvas(canvas, {color, snowflakeCount: snowflakeCount()});
      if (isPaused() || document.hidden) snowfall.pause();
      if (isPaused()) drawStaticSnow();
    };
    const syncMotion = (): void => {
      if (isPaused() || document.hidden) {
        snowfall?.pause();
        if (isPaused()) drawStaticSnow();
      } else redraw();
    };
    const resize = (): void => {
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) redraw();
    };
    redraw();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const preferenceObserver = new MutationObserver(syncMotion);
    preferenceObserver.observe(document.documentElement, {attributes: true, attributeFilter: ["data-motion"]});
    motion.addEventListener("change", syncMotion);
    mobile.addEventListener("change", redraw);
    document.addEventListener("visibilitychange", syncMotion);
    return () => {
      snowfall?.pause();
      observer.disconnect();
      preferenceObserver.disconnect();
      motion.removeEventListener("change", syncMotion);
      mobile.removeEventListener("change", redraw);
      document.removeEventListener("visibilitychange", syncMotion);
    };
  }, [theme]);

  if (theme !== "light") return null;

  return (
    <div aria-hidden="true" className="site-shell__snowfall">
      <canvas ref={canvasRef} />
    </div>
  );
}
