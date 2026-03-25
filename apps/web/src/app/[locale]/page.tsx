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
  const recentPosts = data.recentPosts.length > 0 ? data.recentPosts : data.hero ? [data.hero] : [];

  return (
    <div className="page-main">
      <section className="page-section hero-grid home-hero">
        <div className="stack-md">
          <p className="section-eyebrow">{dictionary.home.eyebrow}</p>
          <h1 className="page-title">{dictionary.home.heading}</h1>
          <p className="page-copy">{dictionary.home.intro}</p>
          <div className="button-row">
            <a className="button" href={`/${locale}/blog`}>
              {dictionary.home.primaryCta}
            </a>
            <a className="button button--secondary" href={`/${locale}#inspirations`}>
              {dictionary.home.secondaryCta}
            </a>
          </div>
        </div>

        {data.hero ? (
          <article className="surface-card hero-card feature-story stack-md">
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

      <section className="page-section anchor-section" id="projects">
        <div className="page-header">
          <p className="section-eyebrow">{dictionary.home.projectsLabel}</p>
          <h2 className="section-title">{dictionary.home.projectsHeading}</h2>
          <p className="page-copy">{dictionary.home.projectsCopy}</p>
        </div>
        <div className="project-grid">
          {dictionary.home.projects.map((project, index) => (
            <article className="project-card" key={project.title}>
              <p className="project-card__index">{String(index + 1).padStart(2, "0")}</p>
              <h3 className="card-title">{project.title}</h3>
              <p className="card-copy">{project.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-section anchor-section" id="inspirations">
        <div className="page-header">
          <p className="section-eyebrow">{dictionary.home.recentLabel}</p>
          <h2 className="section-title">{dictionary.home.recentHeading}</h2>
          <p className="page-copy">{dictionary.home.recentCopy}</p>
        </div>
        <div className="cards-grid">
          {recentPosts.map((post) => (
            <PostCard key={post.slug} locale={locale} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
