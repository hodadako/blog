"use client";

import Script from "next/script";

interface AdSenseScriptProps {
  publisherId: string;
  onReady: () => void;
  onError: () => void;
}

export function AdSenseScript({ publisherId, onReady, onError }: AdSenseScriptProps) {
  return <Script
    id="hodako-adsense"
    src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
    crossOrigin="anonymous"
    strategy="afterInteractive"
    onReady={onReady}
    onError={onError}
  />;
}
