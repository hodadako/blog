import { requireAdmin } from "@/lib/auth";
import {buildPageTitle, getDictionary, resolveLocale, resolveRouteParams} from "@/lib/site";

interface AdminPageParams {
  locale: string;
}

interface AdminPageProps {
  params: Promise<AdminPageParams>;
}

export async function generateMetadata({params}: AdminPageProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);
  const dictionary = getDictionary(locale);

  return {
    title: buildPageTitle(locale, dictionary.admin.heading),
    description: dictionary.admin.intro,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AdminPage({params}: AdminPageProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);
  await requireAdmin(locale);
  const dictionary = getDictionary(locale);

  return (
    <div className="page-main">
      <section className="page-section">
        <header className="page-header">
          <p className="section-eyebrow">{dictionary.admin.eyebrow}</p>
          <h1 className="page-title">{dictionary.admin.heading}</h1>
          <p className="page-copy">{dictionary.admin.intro}</p>
        </header>

        <div className="summary-grid">
          <div className="stat-card">
            <p className="stat-card__value">Comments</p>
            <p className="stat-card__label">{locale === "ko" ? "현재 어드민은 댓글 관리 전용입니다." : "Admin is now dedicated to comment moderation."}</p>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="surface-card stack-md surface-card--narrow">
          <p className="section-eyebrow">Comment moderation</p>
          <h2 className="card-title">{locale === "ko" ? "포스트 작성은 로컬 markdown로 관리합니다." : "Post authoring now happens in local markdown files."}</h2>
          <p className="card-copy">
            {locale === "ko"
              ? "content/posts/{slug}/{locale}.md 파일을 로컬에서 수정하고 Git으로 배포하세요. 어드민에서는 댓글 검수만 수행합니다."
              : "Edit content/posts/{slug}/{locale}.md locally and deploy through Git. The admin area now focuses on comment moderation only."}
          </p>
          <div className="button-row">
            <a className="button" href={`/${locale}/admin/comments`}>
              {dictionary.admin.commentsLink}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
