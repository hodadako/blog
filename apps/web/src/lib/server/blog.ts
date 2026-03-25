import type { AppLocale } from "@/lib/site";
import { getPostBySlug, getPostsByLocale } from "@/lib/content";

export async function getHomePageData(locale: AppLocale) {
  const posts = await getPostsByLocale(locale);

  return {
    hero: posts[0] ?? null,
    recentPosts: posts.slice(1, 4),
    stats: [
      { label: locale === "ko" ? "로케일" : "Locales", value: "2" },
      { label: locale === "ko" ? "SSR 페이지" : "SSR pages", value: "3" },
      { label: locale === "ko" ? "동적 기능" : "Dynamic features", value: "Comments" },
    ],
  };
}

export async function getBlogIndexPageData(locale: AppLocale) {
  return {
    posts: await getPostsByLocale(locale),
  };
}

export async function getBlogPostPageData(locale: AppLocale, slug: string) {
  return getPostBySlug(locale, slug);
}
