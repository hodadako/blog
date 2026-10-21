import type { Metadata } from "next";
import {UiLink} from "@/components/ui-link";
import type { ReactNode } from "react";
import {SiteDocument} from "@/components/site-document";
import styles from "./guitar.module.css";
import { guitarHref } from "@/lib/guitar-links";
import { ThemeProvider } from "@/components/theme-context";
import {SiteFooter} from "@/components/site-footer";

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
          <nav aria-label="주요 탐색">
            <UiLink aria-current="page" className={styles.sectionLink} href={guitarHref("/songs")}>악보</UiLink>
          </nav>
        </header>
        <main className={styles.main}>{children}</main>
        <div className={styles.footer}><SiteFooter locale="ko" postsHref={guitarHref("/songs")} postsLabel="Songs" privacyHref="https://www.hodako.dev/ko/privacy" /></div>
      </div>
    </ThemeProvider>
    </SiteDocument>
  );
}
