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
  const statusMessages: Record<string, string> = locale === "ko"
    ? {
        "invalid-input": "댓글 입력값을 확인해 주세요.",
        "post-not-found": "게시된 글을 찾을 수 없습니다.",
        "rate-limited": "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
        "invalid-authorization": "댓글 작성 권한이 만료되었거나 이미 사용되었습니다. 다시 인증해 주세요.",
        "invalid-parent": "답글을 작성할 수 없는 댓글입니다.",
        "duplicate-comment": "같은 내용을 연속으로 등록할 수 없습니다.",
        "idempotency-conflict": "같은 요청 키에 다른 내용이 사용되었습니다.",
        "comment-auth-failed": "댓글 비밀번호가 일치하지 않거나 변경할 수 없는 댓글입니다.",
      }
    : {
        "invalid-input": "Please check the comment fields.",
        "post-not-found": "The published post could not be found.",
        "rate-limited": "Too many requests. Please try again later.",
        "invalid-authorization": "The comment authorization expired or was already used. Please verify again.",
        "invalid-parent": "This comment cannot receive a reply.",
        "duplicate-comment": "The same content cannot be posted repeatedly.",
        "idempotency-conflict": "The same request key was used with different content.",
        "comment-auth-failed": "The password did not match or the comment cannot be changed.",
      };
  const statusMessage = commentStatus ? statusMessages[commentStatus] ?? quizLabels.unavailable : null;

  return (
    <section className="page-section comment-grid anchor-section" id="comments">
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
      {statusMessage ? <p className="status-text">{statusMessage}</p> : null}
    </section>
  );
}
