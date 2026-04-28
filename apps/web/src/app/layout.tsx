import "./globals.css";
import Script from "next/script";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { env } from "@/lib/env";

const metadata: Metadata = {
  title: {
    default: "hodako's blog",
    template: "%s | hodako's blog",
  },
  description: "Minimal multilingual blog scaffold for public posts and lightweight admin flows.",
  metadataBase: new URL(env.siteUrl),
};

interface RootLayoutProps {
  children: ReactNode;
}

export {metadata};

export default function RootLayout({children}: RootLayoutProps) {
  return (
    <html suppressHydrationWarning lang="ko">
      <body>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {`(function(){try{var theme=window.localStorage.getItem("site-theme");if(theme!=="light"&&theme!=="dark"){theme="light";}document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;}catch(error){document.documentElement.dataset.theme="light";document.documentElement.style.colorScheme="light";}})();`}
        </Script>
        {children}
      </body>
    </html>
  );
}
