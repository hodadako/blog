import type {Route} from "next";
import Link from "next/link";
import {INSPIRATION_TYPES, type InspirationArchiveYear} from "@/lib/inspirations";
import {buildPageTitle, getDictionary, type AppLocale, type InspirationType} from "@/lib/site";

interface InspirationsArchiveProps {
  locale: AppLocale;
  archive: Array<InspirationArchiveYear>;
  activeType?: InspirationType;
}

function getArchiveEntryCount(archive: Array<InspirationArchiveYear>): number {
  return archive.reduce(
    (sum, year) => sum + year.months.reduce((yearSum, month) => yearSum + month.items.length, 0),
    0,
  );
}

function getInspirationFilterHref(locale: AppLocale, type?: InspirationType): Route {
  return (type ? `/${locale}/inspirations/${type}` : `/${locale}/inspirations`) as Route;
}

export function buildInspirationsMetadata(locale: AppLocale, activeType?: InspirationType): {title: string; description: string} {
  const dictionary = getDictionary(locale);
  const typeLabel = activeType ? ` · ${dictionary.inspirationsPage.types[activeType]}` : "";

  return {
    title: buildPageTitle(locale, `${dictionary.inspirationsPage.heading}${typeLabel}`),
    description: dictionary.inspirationsPage.intro,
  };
}

export function InspirationsArchive({locale, archive, activeType}: InspirationsArchiveProps) {
  const dictionary = getDictionary(locale);
  const totalEntries = getArchiveEntryCount(archive);
  const heading = activeType
    ? `${dictionary.inspirationsPage.heading} · ${dictionary.inspirationsPage.types[activeType]}`
    : dictionary.inspirationsPage.heading;

  return (
    <div className="page-main inspirations-page">
      <section className="page-section">
        <article className="surface-card stack-lg">
          <h1 className="sr-only">{heading}</h1>

          <div className="stack-md">
            <p className="page-copy">{dictionary.inspirationsPage.intro}</p>
            <p className="page-copy">{dictionary.inspirationsPage.note}</p>
          </div>

          <div className="summary-grid">
            <article className="stat-card">
              <p className="stat-card__value">{archive.length}</p>
              <p className="stat-card__label">{dictionary.inspirationsPage.yearsStatLabel}</p>
            </article>
            <article className="stat-card">
              <p className="stat-card__value">{totalEntries}</p>
              <p className="stat-card__label">{dictionary.inspirationsPage.entriesStatLabel}</p>
            </article>
            <article className="stat-card">
              <p className="stat-card__value">{INSPIRATION_TYPES.length}</p>
              <p className="stat-card__label">{dictionary.inspirationsPage.typesStatLabel}</p>
            </article>
          </div>

          <nav aria-label={dictionary.inspirationsPage.typesStatLabel} className="tag-list">
            <Link
              aria-current={activeType ? undefined : "page"}
              className={`pill inspirations-filter${activeType ? "" : " inspirations-filter--active"}`}
              href={getInspirationFilterHref(locale)}
            >
              {dictionary.inspirationsPage.allTypesLabel}
            </Link>

            {INSPIRATION_TYPES.map((type) => {
              const isActive = type === activeType;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`pill inspirations-filter${isActive ? " inspirations-filter--active" : ""}`}
                  href={getInspirationFilterHref(locale, type)}
                  key={type}
                >
                  {dictionary.inspirationsPage.types[type]}
                </Link>
              );
            })}
          </nav>
        </article>
      </section>

      <section className="page-section">
        {archive.length > 0 ? (
          <div className="inspirations-years">
            {archive.map((year) => {
              const yearEntryCount = year.months.reduce((sum, month) => sum + month.items.length, 0);

              return (
                <section className="inspiration-year" key={year.year}>
                  <header className="inspiration-year__header">
                    <p className="section-eyebrow">{dictionary.inspirationsPage.yearLabel}</p>
                    <h2 className="page-title inspiration-year__title">{year.year}</h2>
                    <p className="list-copy">
                      {yearEntryCount} {dictionary.inspirationsPage.entriesLabel}
                    </p>
                  </header>

                  <div className="inspiration-year__months">
                    {year.months.map((month) => (
                      <section className="surface-card stack-md inspiration-month" key={month.key}>
                        <header className="inspiration-month__header">
                          <div className="stack-sm">
                            <p className="section-eyebrow">{month.key}</p>
                            <h3 className="section-title">{month.label}</h3>
                          </div>
                          <div className="meta-row">
                            <span>{month.items.length}</span>
                            <span>{dictionary.inspirationsPage.entriesLabel}</span>
                          </div>
                        </header>

                        <div className="archive-list">
                          {month.items.map((item) => (
                            <article className={`post-card inspiration-entry${item.imageUrl ? " post-card--with-icon inspiration-entry--with-image" : ""}`} key={item.id}>
                              <a className="post-card__surface inspiration-entry__surface" href={item.href} rel="noreferrer" target="_blank">
                                <div className={item.imageUrl ? "post-card__lead post-card__lead--with-icon" : "post-card__lead"}>
                                  <div className="post-card__content inspiration-entry__content">
                                    <span className="pill inspiration-entry__type">{dictionary.inspirationsPage.types[item.type]}</span>

                                    <div className="stack-sm">
                                      <h4 className="post-card__title">{item.title}</h4>
                                      {item.summary ? <p className="post-card__summary">{item.summary}</p> : null}
                                    </div>

                                    <div className="meta-row">
                                      <span>{item.source}</span>
                                      <span>·</span>
                                      <span>{item.dateLabel}</span>
                                    </div>
                                  </div>

                                  {item.imageUrl ? (
                                    <div aria-hidden="true" className="post-card__icon-frame">
                                      <img
                                        alt=""
                                        className="post-card__icon"
                                        decoding="async"
                                        height="192"
                                        loading="lazy"
                                        src={item.imageUrl}
                                        width="192"
                                      />
                                    </div>
                                  ) : null}
                                </div>
                              </a>
                            </article>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <article className="surface-card empty-state">
            <p>{dictionary.inspirationsPage.emptyLabel}</p>
          </article>
        )}
      </section>
    </div>
  );
}
