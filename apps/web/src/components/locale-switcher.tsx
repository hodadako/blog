"use client";

import {useEffect} from "react";
import {usePathname} from "next/navigation";
import {DropdownMenu} from "@/components/dropdown-menu";
import {getDictionary, SUPPORTED_LOCALES, type AppLocale} from "@/lib/site";

export function LocaleSwitcher({currentLocale}: {currentLocale: AppLocale}) {
  const dictionary = getDictionary(currentLocale);
  const pathname = usePathname();
  useEffect(() => { document.documentElement.lang = currentLocale; }, [currentLocale]);
  function navigate(nextLocale: string): void {
    const translationPath = document.querySelector("[data-article-translations]")?.getAttribute(`data-translation-${nextLocale}`);
    const nextPathname = translationPath || (pathname === `/${currentLocale}`
      ? `/${nextLocale}`
      : pathname.startsWith(`/${currentLocale}/`)
        ? pathname.replace(`/${currentLocale}/`, `/${nextLocale}/`)
        : `/${nextLocale}`);
    const nextSearch = window.location.search;

    window.location.assign(nextSearch ? `${nextPathname}${nextSearch}` : nextPathname);
  }
  return <DropdownMenu className="locale-switcher" label={dictionary.navigation.languageLabel} value={currentLocale} onValueChange={navigate}
    options={SUPPORTED_LOCALES.map(locale => ({value: locale, label: dictionary.navigation.localeNames[locale]}))} />;
}
