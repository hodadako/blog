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
  const latestPost = data.hero ?? data.recentPosts[0] ?? null;

  return (
    <div className="page-main">
      <section className="page-section hero-grid home-hero anchor-section" id="inspirations">
        <article className="surface-card stack-lg home-intro-card">
          <div className="page-header">
            <p className="section-eyebrow">{dictionary.home.aboutLabel}</p>
            <h1 className="page-title">{dictionary.home.heading}</h1>
            <p className="page-copy">{dictionary.home.intro}</p>
          </div>

          <div className="stack-md">
            <div className="stack-sm">
              <h2 className="section-title">{dictionary.home.aboutHeading}</h2>
              <p className="page-copy">{dictionary.home.aboutBody}</p>
              <p className="page-copy">{dictionary.home.aboutFocus}</p>
            </div>
          </div>
        </article>

        {latestPost ? (
          <a
            className="surface-card surface-card--narrow stack-md home-latest-post-card"
            href={`/${locale}/blog/${latestPost.slug}`}
          >
            <p className="section-eyebrow">{dictionary.home.featuredLabel}</p>
            <div className="stack-sm">
              <h2 className="card-title">{latestPost.title}</h2>
              <p className="card-copy">{latestPost.description}</p>
            </div>
            <div className="meta-row">
              <span>{latestPost.publishedAt}</span>
              <span>·</span>
              <span>{latestPost.readingTime}</span>
            </div>
          </a>
        ) : null}
      </section>
    </div>
  );
}
