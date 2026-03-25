import {AdminPostEditor} from "@/components/admin-post-editor";
import { requireAdmin } from "@/lib/auth";
import {buildPageTitle, getDictionary, resolveLocale, resolveRouteParams} from "@/lib/site";
import {getAdminEditorPageData} from "@/lib/server/blog";

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
  const data = await getAdminEditorPageData(locale);

  return (
    <div className="page-main">
      <section className="page-section">
        <header className="page-header">
          <p className="section-eyebrow">{dictionary.admin.eyebrow}</p>
          <h1 className="page-title">{dictionary.admin.heading}</h1>
          <p className="page-copy">{dictionary.admin.intro}</p>
        </header>

        <div className="summary-grid">
          {data.stats.map((item) => (
            <div className="stat-card" key={item.label}>
              <p className="stat-card__value">{item.value}</p>
              <p className="stat-card__label">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-section">
        <AdminPostEditor
          commentsHref={`/${locale}/admin/comments`}
          copy={dictionary.admin}
          locale={locale}
          posts={data.posts}
          sessionLabel={locale === "ko" ? "로그인된 관리자 세션이 확인되었습니다." : "Authenticated admin session is active."}
          draft={data.draft}
        />
      </section>
    </div>
  );
}
