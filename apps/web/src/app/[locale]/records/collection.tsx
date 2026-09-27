import {RECORD_TYPES, type RecordItem} from "@/lib/records";
import {buildPageTitle, getDictionary, type AppLocale, type RecordType} from "@/lib/site";
import {RecordsFilter, type RecordsFilterItem} from "./records-filter";
import {RecordsGrid} from "./records-grid";
import {getCollectionHref} from "./records-navigation";

interface RecordsCollectionProps {
  locale: AppLocale;
  collection: Array<RecordItem>;
  activeType?: RecordType;
}

export function buildRecordsMetadata(locale: AppLocale, activeType?: RecordType): {title: string; description: string} {
  const dictionary = getDictionary(locale);
  const typeLabel = activeType ? ` · ${dictionary.recordsPage.types[activeType]}` : "";

  return {
    title: buildPageTitle(locale, `${dictionary.recordsPage.heading}${typeLabel}`),
    description: dictionary.recordsPage.description,
  };
}

export function RecordsCollection({locale, collection, activeType}: RecordsCollectionProps) {
  const dictionary = getDictionary(locale);
  const filterItems: Array<RecordsFilterItem> = [
    {key: "all", href: getCollectionHref(locale), label: dictionary.recordsPage.allTypesLabel, active: !activeType},
    ...RECORD_TYPES.map((type) => ({
      key: type,
      href: getCollectionHref(locale, type),
      label: dictionary.recordsPage.types[type],
      active: type === activeType,
    })),
  ];

  return (
    <div className="page-main records-page">
      <RecordsFilter items={filterItems} label={dictionary.recordsPage.filterLabel} />

      {collection.length > 0 ? (
        <RecordsGrid
          collection={collection}
          filterType={activeType}
          locale={locale}
          typeLabels={dictionary.recordsPage.types}
        />
      ) : (
        <p className="records-empty">{dictionary.recordsPage.emptyLabel}</p>
      )}
    </div>
  );
}
