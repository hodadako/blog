import {notFound} from "next/navigation";
import {buildInspirationsMetadata, InspirationsArchive} from "../archive";
import {INSPIRATION_TYPES, getInspirationsArchive, isInspirationType} from "@/lib/inspirations";
import {SUPPORTED_LOCALES, resolveLocale, resolveRouteParams} from "@/lib/site";

interface FilteredInspirationsPageParams {
  locale: string;
  type: string;
}

interface FilteredInspirationsPageProps {
  params: Promise<FilteredInspirationsPageParams>;
}

export async function generateStaticParams(): Promise<Array<{locale: string; type: string}>> {
  return SUPPORTED_LOCALES.flatMap((locale) => INSPIRATION_TYPES.map((type) => ({locale, type})));
}

export async function generateMetadata({params}: FilteredInspirationsPageProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);

  return buildInspirationsMetadata(locale, isInspirationType(routeParams.type) ? routeParams.type : undefined);
}

export default async function FilteredInspirationsPage({params}: FilteredInspirationsPageProps) {
  const routeParams = await resolveRouteParams(params);

  if (!isInspirationType(routeParams.type)) {
    notFound();
  }

  const locale = resolveLocale(routeParams.locale);
  const archive = getInspirationsArchive(locale, routeParams.type);

  return <InspirationsArchive activeType={routeParams.type} archive={archive} locale={locale} />;
}
