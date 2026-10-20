import Link from "next/link";
import type {Route} from "next";
import {getDictionary, type AppLocale} from "@/lib/site";

export function SiteFooter({locale, postsHref, postsLabel, privacyHref}: {locale: AppLocale; postsHref?: Route; postsLabel?: string; privacyHref?: string}) {
  const dictionary = getDictionary(locale);

  return (
    <footer className="publication-footer" role="contentinfo">
      <span>{dictionary.siteName}</span>
      <nav aria-label={locale === "ko" ? "하단 탐색" : "Footer navigation"}>
        <Link className="text-link" href={postsHref ?? `/${locale}/blog`}>{postsLabel ?? dictionary.navigation.blog}</Link>
        {privacyHref ? (
          <a className="text-link" href={privacyHref}>{locale === "ko" ? "개인정보 처리방침" : "Privacy"}</a>
        ) : (
          <a className="text-link" href={`/${locale}/privacy`}>{locale === "ko" ? "개인정보 처리방침" : "Privacy"}</a>
        )}
        <a className="text-link" href="https://github.com/hodadako">GitHub</a>
      </nav>
    </footer>
  );
}
