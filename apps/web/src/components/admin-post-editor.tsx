import type {AdminCopy, AppLocale} from "@/lib/site";
import type {AdminPostListItem, PostEditorDraft} from "@/lib/types";

interface AdminPostEditorProps {
  commentsHref: string;
  copy: AdminCopy;
  locale: AppLocale;
  posts: AdminPostListItem[];
  sessionLabel: string;
  draft: PostEditorDraft;
}

export function AdminPostEditor({
  commentsHref,
  copy,
  locale,
  posts,
  sessionLabel,
  draft,
}: AdminPostEditorProps) {
  return (
    <div className="admin-grid">
      <aside className="admin-list">
        <div className="stack-sm">
          <h2 className="card-title">{copy.sidebarHeading}</h2>
          <p className="card-copy">{sessionLabel}</p>
          <a className="text-link" href={commentsHref}>
            {copy.commentsLink}
          </a>
        </div>

        <div className="stack-sm">
            {posts.map((post) => (
              <article className="admin-list__item" key={post.slug}>
                <div className="stack-sm">
                  <strong>{post.title}</strong>
                  <span className="meta-row">{post.updatedAt}</span>
                </div>
                <div className="tag-list">
                  <span className={`status-pill status-pill--${post.status}`}>{post.status}</span>
                  <span className="pill">{post.locale.toUpperCase()}</span>
                </div>
              </article>
          ))}
        </div>
      </aside>

      <section className="surface-card stack-md">
        <div className="stack-sm">
          <p className="section-eyebrow">{copy.editorEyebrow}</p>
          <h2 className="card-title">{copy.editorHeading}</h2>
          <p className="card-copy">{copy.editorCopy}</p>
        </div>

        <form action="/api/admin/posts" className="form-grid" method="post">
          <input name="locale" type="hidden" value={locale} />

          <label className="field">
            <span className="field__label">{copy.fields.slug}</span>
            <input className="field__input" defaultValue={draft.slug} name="slug" required type="text" />
          </label>

          <label className="field">
            <span className="field__label">{copy.fields.title}</span>
            <input className="field__input" defaultValue={draft.title} name="title" required type="text" />
          </label>

          <label className="field">
            <span className="field__label">{copy.fields.description}</span>
            <textarea className="field__textarea" defaultValue={draft.description} name="description" required />
          </label>

          <label className="field">
            <span className="field__label">{copy.fields.tags}</span>
            <input className="field__input" defaultValue={draft.tags} name="tags" required type="text" />
          </label>

          <label className="field">
            <span className="field__label">{copy.fields.status}</span>
            <select className="field__select" defaultValue={draft.draft ? "draft" : "published"} name="status">
              <option value="draft">draft</option>
              <option value="published">published</option>
            </select>
          </label>

          <label className="field">
            <span className="field__label">publishedAt</span>
            <input className="field__input" defaultValue={draft.publishedAt} name="publishedAt" required type="date" />
          </label>

          <label className="field">
            <span className="field__label">updatedAt</span>
            <input className="field__input" defaultValue={draft.updatedAt} name="updatedAt" required type="date" />
          </label>

          <label className="field">
            <span className="field__label">{copy.fields.content}</span>
            <textarea className="field__textarea" defaultValue={draft.body} name="content" required />
          </label>

          <div className="button-row">
            <button className="button button--secondary" name="intent" type="submit" value="save-draft">
              {copy.saveDraftLabel}
            </button>
            <button className="button" name="intent" type="submit" value="publish">
              {copy.publishLabel}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
