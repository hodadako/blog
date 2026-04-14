import { env } from "@/lib/env";
import { getAllLocalizedPostSitemapEntries } from "@/lib/content";

export default async function sitemap() {
  const posts = await getAllLocalizedPostSitemapEntries();

  return posts
    .filter((post) => !post.draft)
    .map((post) => ({
      url: `${env.siteUrl}/${post.locale}/blog/${post.slug}`,
      lastModified: post.updatedAt ?? post.publishedAt,
      alternates: {
        languages: Object.fromEntries(
          Object.entries(post.alternates).map(([locale, slug]) => [locale, `${env.siteUrl}/${locale}/blog/${slug}`]),
        ),
      },
    }));
}
