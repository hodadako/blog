import "@/app/site.css";
import Script from "next/script";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { env } from "@/lib/env";
import { getAdPublisherId } from "@/lib/ads";

const metadata: Metadata = {
  title: {
    default: "hodako's blog",
    template: "%s | hodako's blog",
  },
  description: "Minimal multilingual blog scaffold for public posts and lightweight admin flows.",
  metadataBase: new URL(env.siteUrl),
};

interface SiteDocumentProps {
  children: ReactNode;
  locale: "ko" | "en";
}

export {metadata};

export function SiteDocument({children, locale}: SiteDocumentProps) {
  const publisherId = getAdPublisherId();
  return (
    <html data-theme="light" lang={locale} style={{colorScheme: "light"}} suppressHydrationWarning>
      <head>
        {publisherId && <meta name="google-adsense-account" content={publisherId} />}
      </head>
      <body>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {`(function(){var root=document.documentElement;var theme="light";try{var preference=window.localStorage.getItem("site-theme");if(preference==="dark"){theme="dark";}else if(preference==="system"){theme=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}var fontPreference=window.localStorage.getItem("site-font");if(fontPreference==="pretendard"){root.dataset.font=fontPreference;}else{delete root.dataset.font;}}catch(error){delete root.dataset.font;}root.dataset.theme=theme;root.style.colorScheme=theme;})();`}
        </Script>
        {children}
      </body>
    </html>
  );
}
