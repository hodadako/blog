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
      <SiteHeader locale={locale} />
      <main>{children}</main>
      <footer className="site-footer">
        <p className="footer-note">{dictionary.footer.note}</p>
        <div className="site-footer__nav">
          <a className="text-link" href={`/${locale}#projects`}>
            {dictionary.navigation.projects}
          </a>
          <a className="text-link" href={`/${locale}/blog`}>
            {dictionary.navigation.blog}
          </a>
          <a className="text-link" href={`/${locale}#inspirations`}>
            {dictionary.navigation.inspirations}
          </a>
        </div>
      </footer>
    </div>
  );
}
