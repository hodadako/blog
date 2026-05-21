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
    <html data-theme="light" lang="ko" style={{colorScheme: "light"}} suppressHydrationWarning>
      <body>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {`(function(){try{var root=document.documentElement;var theme=window.localStorage.getItem("site-theme");if(theme!=="light"&&theme!=="dark"){theme="light";}root.dataset.theme=theme;root.style.colorScheme=theme;var fontPreference=window.localStorage.getItem("site-font");if(fontPreference==="pretendard"){root.dataset.font=fontPreference;}else{delete root.dataset.font;}}catch(error){document.documentElement.dataset.theme="light";document.documentElement.style.colorScheme="light";delete document.documentElement.dataset.font;}})();`}
        </Script>
        {children}
      </body>
    </html>
  );
}
