import {SUPPORTED_LOCALES, type AppLocale} from "@/lib/site";

interface LocaleSwitcherProps {
  currentLocale: AppLocale;
}

export function LocaleSwitcher({currentLocale}: LocaleSwitcherProps) {
  return (
    <div className="locale-switcher" aria-label="Locale switcher">
      {SUPPORTED_LOCALES.map((locale) => {
        const isActive = locale === currentLocale;

        return (
          <a
            className={isActive ? "locale-switcher__link locale-switcher__link--active" : "locale-switcher__link"}
            href={`/${locale}`}
            key={locale}
            lang={locale}
          >
            {locale.toUpperCase()}
          </a>
        );
      })}
    </div>
  );
}
