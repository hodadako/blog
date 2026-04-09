import {CommentAvailabilityGate} from "@/components/comment-availability-gate";
import {CommentForm} from "@/components/comment-form";
import {CommentList} from "@/components/comment-list";
import { MarkdownArticle } from "@/lib/markdown";
import {buildPageTitle, getDictionary, resolveLocale, resolveRouteParams} from "@/lib/site";
import {getBlogPostPageData} from "@/lib/server/blog";
import { findCanonicalSlugByLocalizedSlug, findLocalizedSlug, getAllPostParams, getLocalizedPostVariants } from "@/lib/content";
import { listPublishedComments } from "@/lib/comments";
import type { CommentEditorState } from "@/lib/types";
import { redirect } from "next/navigation";

interface BlogPostParams {
  locale: string;
  slug: string;
}

interface BlogPostProps {
  params: Promise<BlogPostParams>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
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

export default async function BlogPostPage({params, searchParams}: BlogPostProps) {
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
          <a className="button" href={`/${locale}/blog`}>
            {dictionary.post.backToBlog}
          </a>
        </section>
      </div>
    );
  }

  const comments = await listPublishedComments(post.canonicalSlug).catch(() => []);
  const resolvedSearchParams = (await Promise.resolve(searchParams)) as Record<string, string | string[] | undefined> | undefined;
  const replyTo = typeof resolvedSearchParams?.replyTo === "string" ? resolvedSearchParams.replyTo : null;
  const commentAction = typeof resolvedSearchParams?.commentAction === "string" ? resolvedSearchParams.commentAction : undefined;
  const commentId = typeof resolvedSearchParams?.commentId === "string" ? resolvedSearchParams.commentId : undefined;
  const activeEditor: CommentEditorState | null =
    commentAction && commentId && (commentAction === "edit" || commentAction === "delete")
      ? { id: commentId, mode: commentAction }
      : null;

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

      <CommentAvailabilityGate locale={locale} slug={post.canonicalSlug}>
        <section className="page-section comment-grid">
          <CommentList
            activeEditor={activeEditor}
            comments={comments}
            contentLabel={dictionary.post.commentContentLabel}
            deleteLabel={dictionary.post.deleteLabel}
            editLabel={dictionary.post.editLabel}
            heading={dictionary.post.commentsHeading}
            emptyLabel={dictionary.post.commentsEmpty}
            locale={locale}
            passwordLabel={dictionary.post.commentPasswordLabel}
            postSlug={post.slug}
            replyLabel={dictionary.post.replyLabel}
            submitDeleteLabel={dictionary.post.submitDeleteLabel}
            submitEditLabel={dictionary.post.submitEditLabel}
            summaryLabel={`${comments.length} ${dictionary.post.commentsCountLabel}`}
          />
          <CommentForm
            locale={locale}
            canonicalSlug={post.canonicalSlug}
            heading={dictionary.post.commentFormHeading}
            helperText={dictionary.post.commentFormCopy}
            parentId={replyTo}
            parentLabel={dictionary.post.parentLabel}
            quizLabels={{
              loading: dictionary.post.quizLoading,
              question: dictionary.post.quizQuestion,
              answer: dictionary.post.quizAnswer,
              verify: dictionary.post.quizVerify,
              verified: dictionary.post.quizVerified,
              unavailable: dictionary.post.quizUnavailable,
              frontendOnly: dictionary.post.quizFrontendOnly,
            }}
            redirectTo={`/${locale}/blog/${post.slug}`}
            submitLabel={dictionary.post.commentSubmitLabel}
            authorLabel={dictionary.post.commentAuthorLabel}
            passwordLabel={dictionary.post.commentPasswordLabel}
            contentLabel={dictionary.post.commentContentLabel}
          />
        </section>
      </CommentAvailabilityGate>
    </div>
  );
}
