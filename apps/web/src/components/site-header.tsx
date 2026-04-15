import {Suspense} from "react";
import Link from "next/link";
import {LocaleSwitcher} from "@/components/locale-switcher";
import {getDictionary, type AppLocale} from "@/lib/site";

interface SiteHeaderProps {
  locale: AppLocale;
}

export function SiteHeader({locale}: SiteHeaderProps) {
  const dictionary = getDictionary(locale);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand-lockup" href={`/${locale}`}>
          <span className="brand-lockup__eyebrow">{dictionary.siteTagline}</span>
          <strong className="brand-lockup__title">{dictionary.siteName}</strong>
        </Link>

        <div className="site-nav">
          <nav className="site-nav__links" aria-label={dictionary.navigation.label}>
            <Link className="site-nav__link" href={`/${locale}/projects`}>
              {dictionary.navigation.projects}
            </Link>
            <Link className="site-nav__link" href={`/${locale}/blog`}>
              {dictionary.navigation.blog}
            </Link>
            <Link className="site-nav__link" href={`/${locale}/inspirations`}>
              {dictionary.navigation.inspirations}
            </Link>
          </nav>
          <Suspense>
            <LocaleSwitcher currentLocale={locale} />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
