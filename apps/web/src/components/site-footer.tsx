import {TextLink} from "@/components/ui";
import {UiLink} from "@/components/ui-link";
import type {Route} from "next";
import {getDictionary, type AppLocale} from "@/lib/site";

export function SiteFooter({locale, postsHref, postsLabel}: {locale: AppLocale; postsHref?: Route; postsLabel?: string}) {
  const dictionary = getDictionary(locale);

  return (
    <footer className="publication-footer" role="contentinfo">
      <span>{dictionary.siteName}</span>
      <nav aria-label={locale === "ko" ? "하단 탐색" : "Footer navigation"}>
        <UiLink href={postsHref ?? `/${locale}/blog`}>{postsLabel ?? dictionary.navigation.blog}</UiLink>
        <TextLink href="https://github.com/hodadako">GitHub</TextLink>
      </nav>
    </footer>
  );
}
