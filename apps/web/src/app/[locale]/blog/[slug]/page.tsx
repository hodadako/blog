import {Suspense} from "react";
import Link from "next/link";
import {PostCommentsPanel} from "@/components/post-comments-panel";
import { MarkdownArticle } from "@/lib/markdown";
import {buildPageTitle, getDictionary, resolveLocale, resolveRouteParams, type AppLocale} from "@/lib/site";
import {getBlogPostPageData} from "@/lib/server/blog";
import { findCanonicalSlugByLocalizedSlug, findLocalizedSlug, getAllPostParams, getLocalizedPostVariants } from "@/lib/content";
import { listPublishedComments } from "@/lib/comments";
import { redirect } from "next/navigation";

interface BlogPostParams {
  locale: string;
  slug: string;
}

interface BlogPostProps {
  params: Promise<BlogPostParams>;
}

interface BlogCommentsSectionProps {
  authorLabel: string;
  canonicalSlug: string;
  commentContentLabel: string;
  commentFormCopy: string;
  commentFormHeading: string;
  commentPasswordLabel: string;
  commentSubmitLabel: string;
  commentsCountLabel: string;
  commentsEmpty: string;
  commentsHeading: string;
  deleteLabel: string;
  editLabel: string;
  locale: AppLocale;
  parentLabel: string;
  postSlug: string;
  quizLabels: {
    answer: string;
    frontendOnly: string;
    loading: string;
    question: string;
    unavailable: string;
    verified: string;
    verify: string;
  };
  replyLabel: string;
  submitDeleteLabel: string;
  submitEditLabel: string;
}

async function BlogCommentsSection({canonicalSlug, ...props}: BlogCommentsSectionProps) {
  const comments = await listPublishedComments(canonicalSlug).catch(() => []);

  return (
    <PostCommentsPanel
      {...props}
      canonicalSlug={canonicalSlug}
      comments={comments}
      contentLabel={props.commentContentLabel}
    />
  );
}

export async function generateStaticParams(): Promise<Array<{locale: string; slug: string}>> {
  return getAllPostParams();
}

export async function generateMetadata({params}: BlogPostProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);
  const post = await getBlogPostPageData(locale, routeParams.slug);

  if (!post) {
    return {
      title: buildPageTitle(locale, "Post"),
      description: "Requested post was not found.",
    };
  }

  const variants = await getLocalizedPostVariants(post.canonicalSlug);

  return {
    title: buildPageTitle(locale, post.title),
    description: post.description,
    alternates: {
      canonical: `/${locale}/blog/${post.slug}`,
      languages: Object.fromEntries(
        variants.map((variant) => [variant.locale, `/${variant.locale}/blog/${variant.slug}`]),
      ),
    },
  };
}

export default async function BlogPostPage({params}: BlogPostProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);
  const dictionary = getDictionary(locale);
  const post = await getBlogPostPageData(locale, routeParams.slug);

  if (!post) {
    const canonicalSlug = await findCanonicalSlugByLocalizedSlug(locale, routeParams.slug);
    const fallbackSlug = canonicalSlug ? await findLocalizedSlug(canonicalSlug, locale) : null;

    if (fallbackSlug && fallbackSlug !== routeParams.slug) {
      redirect(`/${locale}/blog/${fallbackSlug}`);
    }

    return (
      <div className="page-main">
        <section className="page-section surface-card stack-md">
          <p className="section-eyebrow">{dictionary.post.notFoundEyebrow}</p>
          <h1 className="section-title">{dictionary.post.notFoundTitle}</h1>
          <p className="page-copy">{dictionary.post.notFoundCopy}</p>
          <Link className="button" href={`/${locale}/blog`}>
            {dictionary.post.backToBlog}
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="page-main blog-post-page">
      <section className="page-section page-section--article">
        <article className="stack-lg article-column article-column--detail blog-post-page__article">
          <header className="article-header article-header--framed">
            <h1 className="article-title">{post.title}</h1>
            <p className="article-summary">{post.description}</p>
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
          </header>

          <MarkdownArticle content={post.body} />
        </article>
      </section>

      <Suspense
        fallback={
          <section className="page-section comment-grid">
            <div className="surface-card empty-state">{dictionary.post.commentsHeading}</div>
          </section>
        }
      >
        <BlogCommentsSection
          authorLabel={dictionary.post.commentAuthorLabel}
          canonicalSlug={post.canonicalSlug}
          commentContentLabel={dictionary.post.commentContentLabel}
          commentFormCopy={dictionary.post.commentFormCopy}
          commentFormHeading={dictionary.post.commentFormHeading}
          commentPasswordLabel={dictionary.post.commentPasswordLabel}
          commentSubmitLabel={dictionary.post.commentSubmitLabel}
          commentsCountLabel={dictionary.post.commentsCountLabel}
          commentsEmpty={dictionary.post.commentsEmpty}
          commentsHeading={dictionary.post.commentsHeading}
          deleteLabel={dictionary.post.deleteLabel}
          editLabel={dictionary.post.editLabel}
          locale={locale}
          parentLabel={dictionary.post.parentLabel}
          postSlug={post.slug}
          quizLabels={{
            loading: dictionary.post.quizLoading,
            question: dictionary.post.quizQuestion,
            answer: dictionary.post.quizAnswer,
            verify: dictionary.post.quizVerify,
            verified: dictionary.post.quizVerified,
            unavailable: dictionary.post.quizUnavailable,
            frontendOnly: dictionary.post.quizFrontendOnly,
          }}
          replyLabel={dictionary.post.replyLabel}
          submitDeleteLabel={dictionary.post.submitDeleteLabel}
          submitEditLabel={dictionary.post.submitEditLabel}
        />
      </Suspense>
    </div>
  );
}
