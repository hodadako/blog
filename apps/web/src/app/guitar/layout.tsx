import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {SiteDocument} from "@/components/site-document";
import styles from "./guitar.module.css";
import { guitarHref } from "@/lib/guitar-links";
import { ThemeProvider } from "@/components/theme-context";
import { ThemePreferenceSelect } from "@/features/guitar/components/theme-preference";

export const metadata: Metadata = {
  metadataBase: new URL("https://guitar.hodako.dev"),
  title: { default: "Hodako Guitar", template: "%s | Hodako Guitar" },
  description: "곡을 찾고 코드 악보를 편하게 읽는 공간입니다.",
};

export default function GuitarLayout({ children }: { children: ReactNode }) {
  return (
    <SiteDocument locale="ko">
    <ThemeProvider>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link className={styles.brand} href={guitarHref("/")}>Hodako Guitar</Link>
          <nav aria-label="주요 탐색" className={styles.nav}>
            <Link href={guitarHref("/songs")}>곡 목록</Link>
          </nav>
          <ThemePreferenceSelect />
        </header>
        <main className={styles.main}>{children}</main>
      </div>
    </ThemeProvider>
    </SiteDocument>
  );
}
