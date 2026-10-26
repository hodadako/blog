import type { ReactNode } from "react";
import { Tag } from "@/components/ui";
import type { PostSummary } from "@/lib/types";

function getArticleTitleVariant(
  title: string,
): "short" | "medium" | "long" | "xlong" {
  const length = Array.from(title).length;

  if (length <= 20) return "short";
  if (length <= 40) return "medium";
  if (length <= 80) return "long";
  return "xlong";
}

/** Pure reading layout; server content and comments remain in the route. */
export function ArticleReading({
  post,
  children,
  translationKo,
  translationEn,
}: {
  post: Pick<
    PostSummary,
    "title" | "description" | "publishedAt" | "readingTime" | "tags"
  >;
  children: ReactNode;
  translationKo?: string;
  translationEn?: string;
}) {
  return (
    <section className="page-section page-section--article article-reading-card">
      <article
        className="stack-lg article-column article-column--detail blog-post-page__article"
        data-article-translations=""
        data-translation-ko={translationKo}
        data-translation-en={translationEn}
      >
        <header className="article-header article-header--framed">
          <h1
            className={`article-title article-title--${getArticleTitleVariant(post.title)}`}
          >
            {post.title}
          </h1>
          <p className="article-summary">{post.description}</p>
          <div className="meta-row">
            <span>{post.publishedAt}</span>
            <span>·</span>
            <span>{post.readingTime}</span>
          </div>
          <div className="tag-list">
            {post.tags.map((tag) => (
              <Tag key={tag}>#{tag}</Tag>
            ))}
          </div>
        </header>

        {children}
      </article>
    </section>
  );
}
