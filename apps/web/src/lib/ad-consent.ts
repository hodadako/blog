"use client";

import { useSyncExternalStore } from "react";

export type AdvertisingConsent = "unknown" | "denied" | "granted";
const changeEvent = "hodako:advertising-consent";

declare global {
  interface Window {
    hodakoAdvertisingConsent?: AdvertisingConsent;
  }
}

// The chosen CMP adapter must call this only after its policy checks and Google
// consent signals are ready. This bridge is not a CMP or a consent record.
export function setAdvertisingConsent(consent: AdvertisingConsent): void {
  window.hodakoAdvertisingConsent = consent;
  window.dispatchEvent(new Event(changeEvent));
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(changeEvent, onChange);
  return () => window.removeEventListener(changeEvent, onChange);
}

export function useAdvertisingConsent(): AdvertisingConsent {
  return useSyncExternalStore(subscribe, () => window.hodakoAdvertisingConsent ?? "unknown", () => "unknown");
}
