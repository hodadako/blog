import {buildRecordsMetadata, RecordsCollection} from "./collection";
import {getRecordsCollection} from "@/lib/records";
import {resolveLocale, resolveRouteParams} from "@/lib/site";

interface RecordsPageParams {
  locale: string;
}

interface RecordsPageProps {
  params: Promise<RecordsPageParams>;
}

export async function generateMetadata({params}: RecordsPageProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);

  return buildRecordsMetadata(locale);
}

export default async function RecordsPage({params}: RecordsPageProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);
  const collection = getRecordsCollection(locale);

  return <RecordsCollection collection={collection} locale={locale} />;
}
