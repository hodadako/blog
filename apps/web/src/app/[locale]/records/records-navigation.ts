import type {Route} from "next";
import type {RecordItem} from "@/lib/records";
import type {AppLocale, RecordType} from "@/lib/site";

export function getCollectionHref(locale: AppLocale, type?: RecordType): Route {
  return (type ? `/${locale}/records/${type}` : `/${locale}/records`) as Route;
}

export function getRecordHref(locale: AppLocale, item: RecordItem, filterType?: RecordType): Route {
  const path = `/${locale}/records/${item.type}/${item.id}`;
  return (filterType ? `${path}?from=${filterType}` : path) as Route;
}

export function getCollectionScrollKey(locale: AppLocale, type?: RecordType): string {
  return `records-scroll:${locale}:${type ?? "all"}`;
}
