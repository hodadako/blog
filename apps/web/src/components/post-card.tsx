import {getDictionary, type AppLocale} from "@/lib/site";
import type {PostSummary} from "@/lib/types";

interface PostCardProps {
  locale: AppLocale;
  post: PostSummary;
  variant?: "default" | "wide";
}

export function PostCard({locale, post, variant = "default"}: PostCardProps) {
  const cardClassName = variant === "wide" ? "post-card surface-card" : "post-card";
  const dictionary = getDictionary(locale);

  return (
    <article className={cardClassName}>
      <div className="stack-sm">
        <p className="section-eyebrow">{post.canonicalSlug}</p>
        <h2 className="post-card__title">{post.title}</h2>
        <p className="post-card__summary">{post.description}</p>
      </div>

      <div className="meta-row">
        <span>{post.publishedAt}</span>
        <span>·</span>
        <span>{post.readingTime}</span>
      </div>

      <div className="tag-list">
        {post.tags.map((tag) => (
          <span className="pill" key={tag}>
            #{tag}
          </span>
        ))}
      </div>

      <a className="text-link" href={`/${locale}/blog/${post.slug}`}>
        {dictionary.post.readMoreLabel}
      </a>
    </article>
  );
}
