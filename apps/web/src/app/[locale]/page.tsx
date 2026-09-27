import {redirect} from "next/navigation";
import {resolveLocale, resolveRouteParams} from "@/lib/site";

interface LocaleHomeParams {
  locale: string;
}

interface LocaleHomeProps {
  params: Promise<LocaleHomeParams>;
}

export default async function LocaleHomePage({params}: LocaleHomeProps): Promise<never> {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);

  redirect(`/${locale}/blog`);
}
