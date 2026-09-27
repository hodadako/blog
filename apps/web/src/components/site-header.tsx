import {Suspense} from "react";
import Link from "next/link";
import {FontToggle} from "@/components/font-toggle";
import {LocaleSwitcher} from "@/components/locale-switcher";
import {MobileHeaderShell} from "@/components/mobile-header-shell";
import {SiteNavLinks} from "@/components/site-nav-links";
import {ThemeToggle} from "@/components/theme-toggle";
import {getDictionary, type AppLocale} from "@/lib/site";

const SHOW_PROJECTS_NAV = false;

interface SiteHeaderProps {
  locale: AppLocale;
}

export function SiteHeader({locale}: SiteHeaderProps) {
  const dictionary = getDictionary(locale);

  return (
    <header className="site-header">
      <MobileHeaderShell>
        <div className="site-header__inner">
          <Link className="brand-lockup" href={`/${locale}/blog`}>
            <span className="brand-lockup__eyebrow">{dictionary.siteTagline}</span>
            <strong className="brand-lockup__title">{dictionary.siteName}</strong>
          </Link>

          <div className="site-nav">
            <SiteNavLinks
              blogLabel={dictionary.navigation.blog}
              label={dictionary.navigation.label}
              locale={locale}
              projectsLabel={dictionary.navigation.projects}
              recordsLabel={dictionary.navigation.records}
              showProjects={SHOW_PROJECTS_NAV}
            />
            <div className="site-nav__controls">
              <Suspense>
                <LocaleSwitcher currentLocale={locale} />
              </Suspense>
              <FontToggle />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </MobileHeaderShell>
    </header>
  );
}
