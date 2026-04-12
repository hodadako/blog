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
        <a className="brand-lockup" href={`/${locale}`}>
          <span className="brand-lockup__eyebrow">{dictionary.siteTagline}</span>
          <strong className="brand-lockup__title">{dictionary.siteName}</strong>
        </a>

        <div className="site-nav">
          <nav className="site-nav__links" aria-label={dictionary.navigation.label}>
            <a className="site-nav__link" href={`/${locale}/projects`}>
              {dictionary.navigation.projects}
            </a>
            <a className="site-nav__link" href={`/${locale}/blog`}>
              {dictionary.navigation.blog}
            </a>
            <a className="site-nav__link" href={`/${locale}/inspirations`}>
              {dictionary.navigation.inspirations}
            </a>
          </nav>
          <LocaleSwitcher currentLocale={locale} />
        </div>
      </div>
    </header>
  );
}
