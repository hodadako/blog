"use client";

import {useSelectedLayoutSegments} from "next/navigation";
import {getDictionary, type AppLocale} from "@/lib/site";

interface SiteFooterProps {
  locale: AppLocale;
}

export function SiteFooter({locale}: SiteFooterProps) {
  const dictionary = getDictionary(locale);
  const segments = useSelectedLayoutSegments();
  const isBlogRoute = segments[0] === "blog";

  if (isBlogRoute) {
    return null;
  }

  return (
    <footer className="site-footer">
      <p className="footer-note">{dictionary.footer.note}</p>
    </footer>
  );
}
