import type { AppLocale } from "@/lib/site";
import type { CommentEditorState, CommentItem } from "@/lib/types";

interface CommentListProps {
  comments: CommentItem[];
  locale: AppLocale;
  postSlug: string;
  heading: string;
  emptyLabel: string;
  summaryLabel: string;
  replyLabel: string;
  editLabel: string;
  deleteLabel: string;
  passwordLabel: string;
  contentLabel: string;
  submitEditLabel: string;
  submitDeleteLabel: string;
  activeEditor?: CommentEditorState | null;
}

function CommentNode({
  comment,
  locale,
  postSlug,
  replyLabel,
  editLabel,
  deleteLabel,
  passwordLabel,
  contentLabel,
  submitEditLabel,
  submitDeleteLabel,
  activeEditor,
}: {
  comment: CommentItem;
  locale: AppLocale;
  postSlug: string;
  replyLabel: string;
  editLabel: string;
  deleteLabel: string;
  passwordLabel: string;
  contentLabel: string;
  submitEditLabel: string;
  submitDeleteLabel: string;
  activeEditor?: CommentEditorState | null;
}) {
  const isEditing = activeEditor?.id === comment.id && activeEditor.mode === "edit";
  const isDeleting = activeEditor?.id === comment.id && activeEditor.mode === "delete";

  return (
    <article className="comment-item">
      <div className="comment-item__header">
        <div className="stack-sm">
          <strong>{comment.authorName}</strong>
          <span className="meta-row">{comment.createdAt}</span>
        </div>
        <span className={`status-pill status-pill--${comment.status}`}>{comment.status}</span>
      </div>
      <p className="comment-item__body">{comment.content}</p>
      <div className="button-row">
        <a className="text-link" href={`/${locale}/blog/${postSlug}?replyTo=${comment.id}#comment-form`}>
          {replyLabel}
        </a>
        <a className="text-link" href={`/${locale}/blog/${postSlug}?commentAction=edit&commentId=${comment.id}#comment-${comment.id}`}>
          {editLabel}
        </a>
        <a className="text-link" href={`/${locale}/blog/${postSlug}?commentAction=delete&commentId=${comment.id}#comment-${comment.id}`}>
          {deleteLabel}
        </a>
      </div>
      {isEditing ? (
        <form action={`/api/comments/${comment.id}`} className="form-grid" id={`comment-${comment.id}`} method="post">
          <input name="intent" type="hidden" value="edit" />
          <input name="redirectTo" type="hidden" value={`/${locale}/blog/${postSlug}`} />
          <label className="field">
            <span className="field__label">{passwordLabel}</span>
            <input className="field__input" name="password" required type="password" />
          </label>
          <label className="field">
            <span className="field__label">{contentLabel}</span>
            <textarea className="field__textarea" defaultValue={comment.content} name="content" required />
          </label>
          <div className="button-row">
            <button className="button button--secondary" type="submit">{submitEditLabel}</button>
          </div>
        </form>
      ) : null}
      {isDeleting ? (
        <form action={`/api/comments/${comment.id}`} className="form-grid" id={`comment-${comment.id}`} method="post">
          <input name="intent" type="hidden" value="delete" />
          <input name="redirectTo" type="hidden" value={`/${locale}/blog/${postSlug}`} />
          <label className="field">
            <span className="field__label">{passwordLabel}</span>
            <input className="field__input" name="password" required type="password" />
          </label>
          <div className="button-row">
            <button className="button" type="submit">{submitDeleteLabel}</button>
          </div>
        </form>
      ) : null}
      {comment.replies.length > 0 ? (
        <div className="comment-replies stack-md">
          {comment.replies.map((reply) => (
            <CommentNode
              activeEditor={activeEditor}
              comment={reply}
              contentLabel={contentLabel}
              deleteLabel={deleteLabel}
              editLabel={editLabel}
              key={reply.id}
              locale={locale}
              passwordLabel={passwordLabel}
              postSlug={postSlug}
              replyLabel={replyLabel}
              submitDeleteLabel={submitDeleteLabel}
              submitEditLabel={submitEditLabel}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function CommentList({
  comments,
  locale,
  postSlug,
  heading,
  emptyLabel,
  summaryLabel,
  replyLabel,
  editLabel,
  deleteLabel,
  passwordLabel,
  contentLabel,
  submitEditLabel,
  submitDeleteLabel,
  activeEditor,
}: CommentListProps) {
  return (
    <section className="stack-md">
      <div className="stack-sm">
        <h2 className="card-title">{heading}</h2>
        <p className="card-copy">{comments.length > 0 ? summaryLabel : emptyLabel}</p>
      </div>

      <div className="stack-md">
        {comments.length === 0 ? (
          <div className="surface-card empty-state">{emptyLabel}</div>
        ) : (
          comments.map((comment) => (
            <CommentNode
              activeEditor={activeEditor}
              comment={comment}
              contentLabel={contentLabel}
              deleteLabel={deleteLabel}
              editLabel={editLabel}
              key={comment.id}
              locale={locale}
              passwordLabel={passwordLabel}
              postSlug={postSlug}
              replyLabel={replyLabel}
              submitDeleteLabel={submitDeleteLabel}
              submitEditLabel={submitEditLabel}
            />
          ))
        )}
      </div>
    </section>
  );
}
