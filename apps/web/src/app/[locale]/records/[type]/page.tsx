import {notFound} from "next/navigation";
import {buildRecordsMetadata, RecordsCollection} from "../collection";
import {RECORD_TYPES, getRecordsCollection, isRecordType} from "@/lib/records";
import {SUPPORTED_LOCALES, resolveLocale, resolveRouteParams} from "@/lib/site";

interface FilteredRecordsPageParams {
  locale: string;
  type: string;
}

interface FilteredRecordsPageProps {
  params: Promise<FilteredRecordsPageParams>;
}

export async function generateStaticParams(): Promise<Array<{locale: string; type: string}>> {
  return SUPPORTED_LOCALES.flatMap((locale) => RECORD_TYPES.map((type) => ({locale, type})));
}

export async function generateMetadata({params}: FilteredRecordsPageProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);

  return buildRecordsMetadata(locale, isRecordType(routeParams.type) ? routeParams.type : undefined);
}

export default async function FilteredRecordsPage({params}: FilteredRecordsPageProps) {
  const routeParams = await resolveRouteParams(params);

  if (!isRecordType(routeParams.type)) {
    notFound();
  }

  const locale = resolveLocale(routeParams.locale);
  const collection = getRecordsCollection(locale, routeParams.type);

  return <RecordsCollection activeType={routeParams.type} collection={collection} locale={locale} />;
}
