import {INSPIRATION_TYPES, getInspirationsArchive} from "@/lib/inspirations";
import {buildPageTitle, getDictionary, resolveLocale, resolveRouteParams} from "@/lib/site";

interface InspirationsPageParams {
  locale: string;
}

interface InspirationsPageProps {
  params: Promise<InspirationsPageParams>;
}

export async function generateMetadata({params}: InspirationsPageProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);
  const dictionary = getDictionary(locale);

  return {
    title: buildPageTitle(locale, dictionary.inspirationsPage.heading),
    description: dictionary.inspirationsPage.intro,
  };
}

export default async function InspirationsPage({params}: InspirationsPageProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);
  const dictionary = getDictionary(locale);
  const archive = getInspirationsArchive(locale);
  const totalEntries = archive.reduce(
    (sum, year) => sum + year.months.reduce((yearSum, month) => yearSum + month.items.length, 0),
    0,
  );

  return (
    <div className="page-main inspirations-page">
      <section className="page-section">
        <article className="surface-card stack-lg">
          <h1 className="sr-only">{dictionary.inspirationsPage.heading}</h1>

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

          <div className="tag-list">
            {INSPIRATION_TYPES.map((type) => (
              <span className="pill" key={type}>
                {dictionary.inspirationsPage.types[type]}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="page-section">
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
      </section>
    </div>
  );
}
