import type {AdminCommentsCopy, AppLocale} from "@/lib/site";
import type {CommentModerationItem} from "@/lib/types";

interface AdminCommentsTableProps {
  copy: AdminCommentsCopy;
  items: CommentModerationItem[];
  locale: AppLocale;
}

export function AdminCommentsTable({copy, items, locale}: AdminCommentsTableProps) {
  return (
    <div className="table-card">
      <div className="stack-sm">
        <h2 className="table-title">{copy.tableHeading}</h2>
        <p className="table-copy">{copy.tableCopy}</p>
      </div>

      <div className="stack-sm">
        {items.map((item) => (
          <article className="table-row" key={item.id}>
            <div className="table-row__header">
              <div className="stack-sm">
                <strong>{item.authorName}</strong>
                <span className="meta-row">
                  {item.slug} · {item.createdAt}
                </span>
                {item.ipHashPreview ? <span className="meta-row">{copy.ipHashLabel} · {item.ipHashPreview}</span> : null}
              </div>
              <div className="tag-list">
                <span className={`status-pill status-pill--${item.status}`}>{item.status}</span>
                <span className="pill">{locale.toUpperCase()}</span>
              </div>
            </div>

             <p className="table-copy">{item.content}</p>

             <form action={`/api/admin/comments/${item.id}`} className="button-row" method="post">
               <input name="locale" type="hidden" value={locale} />

               <button className="button button--secondary" name="decision" type="submit" value="published">
                 {copy.approveLabel}
               </button>
               <button className="button" name="decision" type="submit" value="hidden">
                 {copy.hideLabel}
                </button>
               {item.ipHashPreview ? (
                 <button className="button button--secondary" name="decision" type="submit" value="blacklist_ip">
                   {copy.blacklistIpLabel}
                 </button>
               ) : null}
              </form>
          </article>
        ))}
      </div>
    </div>
  );
}
