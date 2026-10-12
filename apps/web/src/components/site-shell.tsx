import type { ReactNode } from "react";
import {SiteHeader} from "@/components/site-header";
import {ThemeBackground} from "@/components/theme-background";
import {ThemeProvider} from "@/components/theme-context";
import {SkipLink} from "@/components/skip-link";
import type {AppLocale} from "@/lib/site";

interface SiteShellProps {
  children: ReactNode;
  locale: AppLocale;
}

export function SiteShell({children, locale}: SiteShellProps) {
  return (
    <ThemeProvider>
      <div className="site-shell" lang={locale}>
        <div aria-hidden="true" className="site-shell__sky">
          <span className="site-shell__sky-layer site-shell__sky-layer--glow" />
          <span className="site-shell__sky-layer site-shell__sky-layer--stars" />
          <span className="site-shell__sky-layer site-shell__sky-layer--stars-far" />
          <span className="site-shell__meteor site-shell__meteor--one" />
          <span className="site-shell__meteor site-shell__meteor--two" />
          <span className="site-shell__meteor site-shell__meteor--three" />
          <span className="site-shell__meteor site-shell__meteor--four" />
          <span className="site-shell__meteor site-shell__meteor--five" />
          <span className="site-shell__meteor site-shell__meteor--six" />
        </div>

        <ThemeBackground />

        <div className="site-shell__chrome">
          <SkipLink label={locale === "ko" ? "본문으로 건너뛰기" : "Skip to content"} />
          <SiteHeader locale={locale} />
          <div className="site-shell__content">
            <main id="main-content" tabIndex={-1}>{children}</main>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
