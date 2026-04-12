import type {AppLocale} from "@/lib/site";
import type {PostSummary} from "@/lib/types";

interface PostCardProps {
  locale: AppLocale;
  post: PostSummary;
}

export function PostCard({locale, post}: PostCardProps) {
  const cardClassName = post.iconUrl ? "post-card post-card--with-icon" : "post-card"
  const leadClassName = post.iconUrl
    ? "post-card__lead post-card__lead--with-icon"
    : "post-card__lead"

  return (
    <article className={cardClassName}>
      <a className="post-card__surface" href={`/${locale}/blog/${post.slug}`}>
        <div className={leadClassName}>
          <div className="post-card__content">
            <h2 className="post-card__title">{post.title}</h2>
            <p className="post-card__summary">{post.description}</p>
            <div className="meta-row">
              <span>{post.publishedAt}</span>
              <span>·</span>
              <span>{post.readingTime}</span>
            </div>
          </div>

          {post.iconUrl ? (
            <div aria-hidden="true" className="post-card__icon-frame">
              <img
                alt=""
                className="post-card__icon"
                decoding="async"
                height="192"
                loading="lazy"
                src={post.iconUrl}
                width="192"
              />
            </div>
          ) : null}
        </div>

        {post.tags.length > 0 ? (
          <div className="post-card__aside">
            <div className="tag-list">
              {post.tags.map((tag) => (
                <span className="pill" key={tag}>
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </a>
    </article>
  );
}
