import type {ReactNode} from "react";
import {SiteFooter} from "@/components/site-footer";
import {resolveLocale, resolveRouteParams} from "@/lib/site";

export default async function BlogLayout({children, params}: {
  children: ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await resolveRouteParams(params);
  return <>{children}<SiteFooter locale={resolveLocale(locale)} /></>;
}
