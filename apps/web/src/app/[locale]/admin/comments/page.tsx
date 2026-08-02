import {AdminCommentsTable} from "@/components/admin-comments-table";
import {AdminInviteTokens} from "@/components/admin-invite-tokens";
import {AdminCommentQuizzes} from "@/components/admin-comment-quizzes";
import { requireAdmin } from "@/lib/auth";
import { listAdminComments, listCommentQuizzes, listInviteTokens } from "@/lib/comments";
import {buildPageTitle, getDictionary, resolveLocale, resolveRouteParams} from "@/lib/site";

interface AdminCommentsParams {
  locale: string;
}

interface AdminCommentsProps {
  params: Promise<AdminCommentsParams>;
}

export async function generateMetadata({params}: AdminCommentsProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);
  const dictionary = getDictionary(locale);

  return {
    title: buildPageTitle(locale, dictionary.adminComments.heading),
    description: dictionary.adminComments.intro,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AdminCommentsPage({params}: AdminCommentsProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);
  await requireAdmin(locale);
  const dictionary = getDictionary(locale);
  const [data, inviteTokens, quizzes] = await Promise.all([
    listAdminComments().catch(() => []),
    listInviteTokens().catch(() => []),
    listCommentQuizzes().catch(() => []),
  ]);

  return (
    <div className="page-main">
      <section className="page-section">
        <header className="page-header">
          <p className="section-eyebrow">{dictionary.adminComments.eyebrow}</p>
          <h1 className="page-title">{dictionary.adminComments.heading}</h1>
          <p className="page-copy">{dictionary.adminComments.intro}</p>
        </header>
        <AdminCommentsTable copy={dictionary.adminComments} items={data} locale={locale} />
        <AdminCommentQuizzes initialItems={quizzes} locale={locale} />
        <AdminInviteTokens initialItems={inviteTokens} locale={locale} />
      </section>
    </div>
  );
}
