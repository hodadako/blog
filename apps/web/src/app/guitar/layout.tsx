import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {SiteDocument} from "@/components/site-document";
import styles from "./guitar.module.css";
import { guitarHref } from "@/lib/guitar-links";
import { ThemeProvider } from "@/components/theme-context";
import { ThemePreferenceSelect } from "@/features/guitar/components/theme-preference";
import {SiteFooter} from "@/components/site-footer";
import {getDictionary} from "@/lib/site";

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
          <div className={styles.identity}>
            <a className="brand-lockup" href="https://www.hodako.dev/ko/blog">
              <strong className="brand-lockup__title">{getDictionary("ko").siteName}</strong>
            </a>
            <nav aria-label="주요 탐색">
              <Link aria-current="location" className={styles.sectionLink} href={guitarHref("/songs")}>악보</Link>
            </nav>
          </div>
          <ThemePreferenceSelect />
        </header>
        <main className={styles.main}>{children}</main>
        <div className={styles.footer}><SiteFooter locale="ko" postsHref={guitarHref("/songs")} postsLabel="Songs" /></div>
      </div>
    </ThemeProvider>
    </SiteDocument>
  );
}
