import "./globals.css";
import type { ReactNode } from "react";
import { env } from "@/lib/env";

const metadata = {
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
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
