import type { ReactNode } from "react";
import {SiteShell} from "@/components/site-shell";
import {SUPPORTED_LOCALES, resolveLocale, resolveRouteParams} from "@/lib/site";

export async function generateStaticParams(): Promise<Array<{locale: string}>> {
  return SUPPORTED_LOCALES.map((locale) => ({locale}));
}

interface LocaleLayoutParams {
  locale: string;
}

interface LocaleLayoutProps {
  params: Promise<LocaleLayoutParams>;
  children: ReactNode;
}

export default async function LocaleLayout({children, params}: LocaleLayoutProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);

  return <SiteShell locale={locale}>{children}</SiteShell>;
}
