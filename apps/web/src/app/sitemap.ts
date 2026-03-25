import { env } from "@/lib/env";
import { getAllLocalizedPosts } from "@/lib/content";

export default async function sitemap() {
  const posts = await getAllLocalizedPosts();

  return posts
    .filter((post) => !post.draft)
    .map((post) => ({
      url: `${env.siteUrl}/${post.locale}/blog/${post.slug}`,
      lastModified: post.updatedAt ?? post.publishedAt,
      alternates: {
        languages: Object.fromEntries(
          post.availableLocales.map((locale) => [locale, `${env.siteUrl}/${locale}/blog/${post.slug}`]),
        ),
      },
    }));
}
