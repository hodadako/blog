import {PostCard} from "@/components/post-card";
import {buildPageTitle, getDictionary, resolveLocale, resolveRouteParams} from "@/lib/site";
import {getHomePageData} from "@/lib/server/blog";

interface HomePageParams {
  locale: string;
}

interface HomePageProps {
  params: Promise<HomePageParams>;
}

export async function generateMetadata({params}: HomePageProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);
  const dictionary = getDictionary(locale);

  return {
    title: buildPageTitle(locale),
    description: dictionary.home.intro,
  };
}

export default async function LocaleHomePage({params}: HomePageProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);
  const dictionary = getDictionary(locale);
  const data = await getHomePageData(locale);

  return (
    <div className="page-main">
      <section className="page-section hero-grid">
        <div className="stack-md">
          <p className="section-eyebrow">{dictionary.home.eyebrow}</p>
          <h1 className="page-title">{dictionary.home.heading}</h1>
          <p className="page-copy">{dictionary.home.intro}</p>
          <div className="button-row">
            <a className="button" href={`/${locale}/blog`}>
              {dictionary.home.primaryCta}
            </a>
            <a className="button button--secondary" href={`/${locale}/admin/login`}>
              {dictionary.home.secondaryCta}
            </a>
          </div>
        </div>

        {data.hero ? (
          <article className="surface-card hero-card stack-md">
            <p className="section-eyebrow">{dictionary.home.featuredLabel}</p>
            <h2 className="section-title">{data.hero.title}</h2>
            <p className="list-copy">{data.hero.description}</p>
            <div className="meta-row">
              <span>{data.hero.publishedAt}</span>
              <span>·</span>
              <span>{data.hero.readingTime}</span>
            </div>
            <div className="tag-list">
              {data.hero.tags.map((tag) => (
                <span className="pill" key={tag}>
                  #{tag}
                </span>
              ))}
            </div>
            <a className="text-link" href={`/${locale}/blog/${data.hero.slug}`}>
              {dictionary.home.featuredCta}
            </a>
          </article>
        ) : null}
      </section>

      <section className="page-section">
        <div className="page-header">
          <p className="section-eyebrow">{dictionary.home.statsLabel}</p>
          <h2 className="section-title">{dictionary.home.statsHeading}</h2>
        </div>
        <div className="stats-grid">
          {data.stats.map((stat) => (
            <div className="stat-card" key={stat.label}>
              <p className="stat-card__value">{stat.value}</p>
              <p className="stat-card__label">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-section">
        <div className="page-header">
          <p className="section-eyebrow">{dictionary.home.recentLabel}</p>
          <h2 className="section-title">{dictionary.home.recentHeading}</h2>
          <p className="page-copy">{dictionary.home.recentCopy}</p>
        </div>
        <div className="cards-grid">
          {data.recentPosts.map((post) => (
            <div key={post.slug}>
              <PostCard locale={locale} post={post} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
