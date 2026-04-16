import {existsSync} from "node:fs";
import path from "node:path";
import type {Metadata} from "next";
import Link from "next/link";
import {buildPageTitle, getDictionary, resolveLocale, resolveRouteParams} from "@/lib/site";
import {getHomePageData} from "@/lib/server/blog";

const PROFILE_IMAGE_SRC = "/images/profile-photo.jpg";
const PROFILE_IMAGE_FILE_PATH = path.resolve(process.cwd(), "public/images/profile-photo.jpg");

function hasProfileImage(): boolean {
  return existsSync(PROFILE_IMAGE_FILE_PATH);
}

interface HomePageParams {
  locale: string;
}

interface HomePageProps {
  params: Promise<HomePageParams>;
}

export async function generateMetadata({params}: HomePageProps): Promise<Metadata> {
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
  const profileImageAvailable = hasProfileImage();

  return (
    <div className="page-main">
      <section className="page-section hero-grid home-hero anchor-section" id="inspirations">
        <article className="surface-card stack-lg home-intro-card">
          <div className="home-intro-card__layout">
            <div className="stack-lg home-intro-card__content">
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
            </div>

            <div className="home-intro-card__profile">
              <div className="home-intro-card__media">
                <div className="post-card__icon-frame home-intro-card__photo-frame">
                  {profileImageAvailable ? (
                    <img
                      alt={dictionary.home.profileImageAlt}
                      className="post-card__icon home-intro-card__photo"
                      decoding="async"
                      height="192"
                      src={PROFILE_IMAGE_SRC}
                      width="192"
                    />
                  ) : <span aria-label={dictionary.home.profilePlaceholder} className="home-intro-card__placeholder" />}
                </div>
              </div>
            </div>
          </div>
        </article>

        <div className="home-hero__aside">
          {latestPost ? (
            <Link
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
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}
