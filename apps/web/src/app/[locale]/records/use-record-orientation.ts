"use client";

import {useCallback, useEffect, useRef, useState, type RefObject} from "react";

type PermissionCapableOrientationEvent = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<PermissionState>;
};

interface RecordOrientationState {
  available: boolean;
  denied: boolean;
  enabled: boolean;
  hasSensorSignal: boolean;
  requiresPermission: boolean;
  toggle: () => Promise<void>;
}

const MAX_X = 10;
const MAX_Y = 8;
const HORIZONTAL_SENSITIVITY = 0.8;
const VERTICAL_SENSITIVITY = 0.65;
const SMOOTHING = 0.1;
const SENSOR_DEAD_ZONE = 0.35;
const MOTION_PERMISSION_KEY = "records-motion-permission";
const MOTION_ENABLED_KEY = "records-motion-enabled";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function orientationDelta(value: number, origin: number): number {
  return ((value - origin + 540) % 360) - 180;
}

function removeSensorNoise(value: number): number {
  return Math.abs(value) < SENSOR_DEAD_ZONE ? 0 : value;
}

function getScreenAngle(): number {
  const angle = window.screen.orientation?.angle ?? window.orientation ?? 0;
  return ((angle % 360) + 360) % 360;
}

function mapToScreenAxes(betaDelta: number, gammaDelta: number): {horizontal: number; vertical: number} {
  const angle = getScreenAngle();

  if (angle === 90) {
    return {horizontal: betaDelta, vertical: -gammaDelta};
  }
  if (angle === 180) {
    return {horizontal: -gammaDelta, vertical: -betaDelta};
  }
  if (angle === 270) {
    return {horizontal: -betaDelta, vertical: gammaDelta};
  }
  return {horizontal: gammaDelta, vertical: betaDelta};
}

export function useRecordOrientation(
  artworkRef: RefObject<HTMLElement | null>,
  active: boolean,
  calibrationKey: string,
): RecordOrientationState {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [denied, setDenied] = useState(false);
  const [hasSensorSignal, setHasSensorSignal] = useState(false);
  const [requiresPermission, setRequiresPermission] = useState(false);
  const enabledRef = useRef(false);

  const setOrientationEnabled = useCallback((nextEnabled: boolean): void => {
    enabledRef.current = nextEnabled;
    setEnabled(nextEnabled);
  }, []);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 45rem) and (pointer: coarse)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = (): void => {
      const supported = "DeviceOrientationEvent" in window && mobileQuery.matches && !reducedMotionQuery.matches;
      const permissionRequired = supported && typeof (window.DeviceOrientationEvent as PermissionCapableOrientationEvent).requestPermission === "function";

      setAvailable(supported);
      setRequiresPermission(permissionRequired);

      if (!supported) {
        setOrientationEnabled(false);
        setHasSensorSignal(false);
      } else {
        const permissionGranted = window.sessionStorage.getItem(MOTION_PERMISSION_KEY) === "granted";
        const userDisabled = window.sessionStorage.getItem(MOTION_ENABLED_KEY) === "false";

        // Permissionless browsers listen immediately. iOS resumes after the user has granted access once in this tab.
        setOrientationEnabled(!userDisabled && (!permissionRequired || permissionGranted));
      }
    };

    update();
    mobileQuery.addEventListener("change", update);
    reducedMotionQuery.addEventListener("change", update);
    return () => {
      mobileQuery.removeEventListener("change", update);
      reducedMotionQuery.removeEventListener("change", update);
    };
  }, [setOrientationEnabled]);

  useEffect(() => {
    const artwork = artworkRef.current;
    if (!artwork || !available || !enabled || !active) {
      artwork?.style.setProperty("--record-look-x", "0px");
      artwork?.style.setProperty("--record-look-y", "0px");
      setHasSensorSignal(false);
      return;
    }

    let originBeta: number | null = null;
    let originGamma: number | null = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let frame = 0;
    let receivedSignal = false;

    setHasSensorSignal(false);

    const onOrientation = (event: DeviceOrientationEvent): void => {
      if (event.beta === null || event.gamma === null || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) {
        return;
      }

      if (originBeta === null || originGamma === null) {
        originBeta = event.beta;
        originGamma = event.gamma;
        if (!receivedSignal) {
          receivedSignal = true;
          setHasSensorSignal(true);
        }
        return;
      }

      const betaDelta = orientationDelta(event.beta, originBeta);
      const gammaDelta = orientationDelta(event.gamma, originGamma);
      const {horizontal, vertical} = mapToScreenAxes(betaDelta, gammaDelta);

      // Move against the tilt, as if the fixed frame were a window into the scene.
      targetX = clamp(-removeSensorNoise(horizontal) * HORIZONTAL_SENSITIVITY, -MAX_X, MAX_X);
      targetY = clamp(-removeSensorNoise(vertical) * VERTICAL_SENSITIVITY, -MAX_Y, MAX_Y);
    };

    const animate = (): void => {
      currentX += (targetX - currentX) * SMOOTHING;
      currentY += (targetY - currentY) * SMOOTHING;
      artwork.style.setProperty("--record-look-x", `${currentX.toFixed(2)}px`);
      artwork.style.setProperty("--record-look-y", `${currentY.toFixed(2)}px`);
      frame = requestAnimationFrame(animate);
    };

    window.addEventListener("deviceorientation", onOrientation, {passive: true});
    frame = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("deviceorientation", onOrientation);
      cancelAnimationFrame(frame);
      artwork.style.setProperty("--record-look-x", "0px");
      artwork.style.setProperty("--record-look-y", "0px");
    };
  }, [active, artworkRef, available, calibrationKey, enabled]);

  const toggle = useCallback(async (): Promise<void> => {
    if (enabledRef.current) {
      window.sessionStorage.setItem(MOTION_ENABLED_KEY, "false");
      setOrientationEnabled(false);
      return;
    }

    if (!("DeviceOrientationEvent" in window)) {
      return;
    }

    const orientation = window.DeviceOrientationEvent as PermissionCapableOrientationEvent;
    if (typeof orientation.requestPermission === "function") {
      try {
        const permission = await orientation.requestPermission();
        if (permission !== "granted") {
          setDenied(true);
          return;
        }
        window.sessionStorage.setItem(MOTION_PERMISSION_KEY, "granted");
      } catch {
        setDenied(true);
        return;
      }
    }

    setDenied(false);
    window.sessionStorage.setItem(MOTION_ENABLED_KEY, "true");
    setOrientationEnabled(true);
  }, [setOrientationEnabled]);

  return {available, denied, enabled, hasSensorSignal, requiresPermission, toggle};
}
