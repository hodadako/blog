"use client";

import {useId, type ChangeEvent} from "react";
import {useRouter} from "next/navigation";
import {getDictionary, isSupportedLocale, SUPPORTED_LOCALES, type AppLocale} from "@/lib/site";

interface LocaleSwitcherProps {
  currentLocale: AppLocale;
}

export function LocaleSwitcher({currentLocale}: LocaleSwitcherProps) {
  const dictionary = getDictionary(currentLocale);
  const router = useRouter();
  const selectId = useId();

  function handleLocaleChange(event: ChangeEvent<HTMLSelectElement>): void {
    const nextLocale = event.currentTarget.value;

    if (!isSupportedLocale(nextLocale) || nextLocale === currentLocale) {
      return;
    }

    router.push(`/${nextLocale}`);
  }

  return (
    <div className="locale-switcher">
      <label className="locale-switcher__label" htmlFor={selectId}>
        {dictionary.navigation.languageLabel}
      </label>
      <select className="field__select locale-switcher__select" defaultValue={currentLocale} id={selectId} onChange={handleLocaleChange}>
        {SUPPORTED_LOCALES.map((locale) => (
          <option key={locale} lang={locale} value={locale}>
            {dictionary.navigation.localeNames[locale]}
          </option>
        ))}
      </select>
    </div>
  );
}
