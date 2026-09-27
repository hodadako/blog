import {notFound} from "next/navigation";
import {RecordView} from "../../record-view";
import {getCollectionHref, getRecordHref} from "../../records-navigation";
import {getRecordsCollection, isRecordType} from "@/lib/records";
import {buildPageTitle, getDictionary, resolveLocale, resolveRouteParams, SUPPORTED_LOCALES, type RecordType} from "@/lib/site";

interface RecordPageParams {
  locale: string;
  type: string;
  id: string;
}

interface RecordPageProps {
  params: Promise<RecordPageParams>;
  searchParams: Promise<{from?: string}>;
}

export async function generateStaticParams(): Promise<Array<RecordPageParams>> {
  return SUPPORTED_LOCALES.flatMap((locale) =>
    getRecordsCollection(locale).map((item) => ({locale, type: item.type, id: item.id})),
  );
}

export async function generateMetadata({params}: RecordPageProps): Promise<{title: string; description: string}> {
  const {locale: rawLocale, type, id} = await resolveRouteParams(params);
  const locale = resolveLocale(rawLocale);
  const item = getRecordsCollection(locale).find((entry) => entry.id === id && entry.type === type);

  if (!item) {
    notFound();
  }

  return {title: buildPageTitle(locale, item.title), description: item.summary};
}

export default async function RecordPage({params, searchParams}: RecordPageProps) {
  const {locale: rawLocale, type, id} = await resolveRouteParams(params);
  const locale = resolveLocale(rawLocale);

  if (!isRecordType(type)) {
    notFound();
  }

  const allRecords = getRecordsCollection(locale);
  const item = allRecords.find((entry) => entry.id === id && entry.type === type);

  if (!item) {
    notFound();
  }

  const query = await searchParams;
  const filterType: RecordType | undefined = query.from && isRecordType(query.from) && query.from === item.type
    ? query.from
    : undefined;
  const collection = filterType ? allRecords.filter((entry) => entry.type === filterType) : allRecords;
  const index = collection.findIndex((entry) => entry.id === item.id);
  const dictionary = getDictionary(locale);

  return (
    <RecordView
      backHref={getCollectionHref(locale, filterType)}
      index={index}
      item={item}
      labels={dictionary.recordsPage}
      nextHref={index < collection.length - 1 ? getRecordHref(locale, collection[index + 1], filterType) : undefined}
      previousHref={index > 0 ? getRecordHref(locale, collection[index - 1], filterType) : undefined}
      total={collection.length}
    />
  );
}
