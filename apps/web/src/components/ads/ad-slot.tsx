"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { AdUnitConfig } from "@/lib/ads";
import { useAdvertisingConsent } from "@/lib/ad-consent";
import { AdSenseScript } from "./adsense-script";
import styles from "./ad-slot.module.css";

declare global {
  interface Window {
    adsbygoogle?: { push: (options: Record<string, never>) => unknown };
  }
}

const attempted = new WeakSet<HTMLElement>();
let scriptFailed = false;

function ConsentedSlot({ config, label }: { config: AdUnitConfig; label: string }) {
  const element = useRef<HTMLModElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(scriptFailed);
  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => { scriptFailed = true; setFailed(true); }, []);

  useEffect(() => {
    const node = element.current;
    if (!ready || failed || !node || attempted.has(node) || node.dataset.adsbygoogleStatus) return;
    // A hidden/zero-width slot cannot be initialized by AdSense. No retries.
    if (node.getBoundingClientRect().width <= 0) return;
    attempted.add(node);
    try {
      (window.adsbygoogle ??= [] as Array<Record<string, never>>).push({});
    } catch {
      setFailed(true);
    }
  }, [ready, failed]);

  if (failed) return null;
  return (
    <aside aria-label={label} className={styles.slot} data-ad-placement={config.placement} data-ad-site={config.site}>
      <span className={styles.label}>{label}</span>
      <div className={styles.creative}>
        <ins className="adsbygoogle" ref={element} style={{ display: "block" }}
          data-ad-client={config.publisherId} data-ad-slot={config.unitId}
          data-ad-format="rectangle" data-full-width-responsive="false" />
      </div>
      <AdSenseScript publisherId={config.publisherId} onReady={onReady} onError={onError} />
    </aside>
  );
}

export function AdSlot({ config, label }: { config: AdUnitConfig; label: string }) {
  const consent = useAdvertisingConsent();
  const pathname = usePathname();
  if (consent !== "granted") return null;
  // New physical ad unit per route; Strict Mode cannot initialize a node twice.
  return <ConsentedSlot key={`${pathname}:${config.unitId}`} config={config} label={label} />;
}
