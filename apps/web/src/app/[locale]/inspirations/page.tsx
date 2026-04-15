import {buildInspirationsMetadata, InspirationsArchive} from "./archive";
import {getInspirationsArchive} from "@/lib/inspirations";
import {resolveLocale, resolveRouteParams} from "@/lib/site";

interface InspirationsPageParams {
  locale: string;
}

interface InspirationsPageProps {
  params: Promise<InspirationsPageParams>;
}

export async function generateMetadata({params}: InspirationsPageProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);

  return buildInspirationsMetadata(locale);
}

export default async function InspirationsPage({params}: InspirationsPageProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);
  const archive = getInspirationsArchive(locale);

  return <InspirationsArchive archive={archive} locale={locale} />;
}
