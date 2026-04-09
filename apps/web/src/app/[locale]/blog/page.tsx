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
  const data = await getBlogIndexPageData(locale);

  return (
    <div className="page-main">
      <section className="page-section">
        <div className="archive-list">
          {data.posts.map((post) => (
            <PostCard key={post.slug} locale={locale} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
