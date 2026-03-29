import type {AppLocale} from "@/lib/site";
import type {PostSummary} from "@/lib/types";

interface PostCardProps {
  locale: AppLocale;
  post: PostSummary;
}

export function PostCard({locale, post}: PostCardProps) {
  return (
    <article className="post-card">
      <a className="post-card__surface" href={`/${locale}/blog/${post.slug}`}>
        <div className="post-card__content">
          <h2 className="post-card__title">{post.title}</h2>
          <p className="post-card__summary">{post.description}</p>
        </div>

        <div className="post-card__aside">
          <div className="meta-row">
            <span>{post.publishedAt}</span>
            <span>·</span>
            <span>{post.readingTime}</span>
          </div>

          {post.tags.length > 0 ? (
            <div className="tag-list">
              {post.tags.map((tag) => (
                <span className="pill" key={tag}>
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </a>
    </article>
  );
}
