import {PostCard} from "@/components/post-card";
import {buildPageTitle, getDictionary, resolveLocale, resolveRouteParams} from "@/lib/site";
import {getBlogIndexPageData} from "@/lib/server/blog";

interface BlogIndexParams {
  locale: string;
}

interface BlogIndexProps {
  params: Promise<BlogIndexParams>;
}

export async function generateMetadata({params}: BlogIndexProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);
  const dictionary = getDictionary(locale);

  return {
    title: buildPageTitle(locale, dictionary.blogIndex.heading),
    description: dictionary.blogIndex.intro,
  };
}

export default async function BlogIndexPage({params}: BlogIndexProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);
  const dictionary = getDictionary(locale);
  const data = await getBlogIndexPageData(locale);

  return (
    <div className="page-main">
      <section className="page-section">
        <header className="page-header">
          <p className="section-eyebrow">{dictionary.blogIndex.eyebrow}</p>
          <h1 className="page-title">{dictionary.blogIndex.heading}</h1>
          <p className="page-copy">{dictionary.blogIndex.intro}</p>
        </header>
        <div className="stack-lg">
          {data.posts.map((post) => (
            <div key={post.slug}>
              <PostCard locale={locale} post={post} variant="wide" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
