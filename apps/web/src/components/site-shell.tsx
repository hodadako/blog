import type { ReactNode } from "react";
import {SiteHeader} from "@/components/site-header";
import {getDictionary, type AppLocale} from "@/lib/site";

interface SiteShellProps {
  children: ReactNode;
  locale: AppLocale;
}

export function SiteShell({children, locale}: SiteShellProps) {
  const dictionary = getDictionary(locale);

  return (
    <div className="site-shell">
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

      <div className="site-shell__chrome">
        <SiteHeader locale={locale} />
        <div className="site-shell__content">
          <main>{children}</main>
          <footer className="site-footer">
            <p className="footer-note">{dictionary.footer.note}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
