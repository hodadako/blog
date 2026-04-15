"use client";

import {useSearchParams} from "next/navigation";
import {CommentForm} from "@/components/comment-form";
import {CommentList} from "@/components/comment-list";
import type {AppLocale} from "@/lib/site";
import type {CommentEditorState, CommentItem} from "@/lib/types";

interface PostCommentsPanelProps {
  authorLabel: string;
  canonicalSlug: string;
  comments: CommentItem[];
  commentContentLabel: string;
  commentFormCopy: string;
  commentFormHeading: string;
  commentPasswordLabel: string;
  commentSubmitLabel: string;
  commentsCountLabel: string;
  commentsEmpty: string;
  commentsHeading: string;
  contentLabel: string;
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

export function PostCommentsPanel({
  authorLabel,
  canonicalSlug,
  comments,
  commentContentLabel,
  commentFormCopy,
  commentFormHeading,
  commentPasswordLabel,
  commentSubmitLabel,
  commentsCountLabel,
  commentsEmpty,
  commentsHeading,
  contentLabel,
  deleteLabel,
  editLabel,
  locale,
  parentLabel,
  postSlug,
  quizLabels,
  replyLabel,
  submitDeleteLabel,
  submitEditLabel,
}: PostCommentsPanelProps) {
  const searchParams = useSearchParams();
  const replyTo = searchParams.get("replyTo");
  const commentAction = searchParams.get("commentAction");
  const commentId = searchParams.get("commentId");
  const commentStatus = searchParams.get("commentStatus");
  const activeEditor: CommentEditorState | null =
    commentAction && commentId && (commentAction === "edit" || commentAction === "delete")
      ? {id: commentId, mode: commentAction}
      : null;

  return (
    <section className="page-section comment-grid">
      <CommentList
        activeEditor={activeEditor}
        comments={comments}
        contentLabel={contentLabel}
        deleteLabel={deleteLabel}
        editLabel={editLabel}
        heading={commentsHeading}
        emptyLabel={commentsEmpty}
        locale={locale}
        passwordLabel={commentPasswordLabel}
        postSlug={postSlug}
        replyLabel={replyLabel}
        submitDeleteLabel={submitDeleteLabel}
        submitEditLabel={submitEditLabel}
        summaryLabel={`${comments.length} ${commentsCountLabel}`}
      />
      <CommentForm
        locale={locale}
        canonicalSlug={canonicalSlug}
        heading={commentFormHeading}
        helperText={commentFormCopy}
        parentId={replyTo}
        parentLabel={parentLabel}
        quizLabels={quizLabels}
        redirectTo={`/${locale}/blog/${postSlug}`}
        submitLabel={commentSubmitLabel}
        authorLabel={authorLabel}
        passwordLabel={commentPasswordLabel}
        contentLabel={commentContentLabel}
      />
      {commentStatus === "frontend-only" ? <p className="status-text">{quizLabels.unavailable}</p> : null}
    </section>
  );
}
