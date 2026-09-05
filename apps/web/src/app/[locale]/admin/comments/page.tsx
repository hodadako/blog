import {AdminCommentsTable} from "@/components/admin-comments-table";
import {AdminInviteTokens} from "@/components/admin-invite-tokens";
import {AdminPostQuizMappings} from "@/components/admin-post-quiz-mappings";
import {AdminQuizBank} from "@/components/admin-quiz-bank";
import { requireAdmin } from "@/lib/auth";
import {getAdminPostMetadata} from "@/lib/content";
import { getWorkerPostQuizMappings, getWorkerQuizBank, listWorkerAdminComments, listWorkerInviteTokens } from "@/lib/worker-admin";
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
  const [data, inviteTokens, quizBank, mappings, posts] = await Promise.all([
    listWorkerAdminComments().catch(() => []),
    listWorkerInviteTokens().catch(() => []),
    getWorkerQuizBank().catch(() => ({ categories: [], questions: [], options: [] })),
    getWorkerPostQuizMappings().catch(() => []),
    getAdminPostMetadata().catch(() => []),
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
        <AdminPostQuizMappings categories={quizBank.categories} initialMappings={mappings} initialPosts={posts} locale={locale} />
        <AdminQuizBank initialBank={quizBank} locale={locale} />
        <AdminInviteTokens initialItems={inviteTokens} locale={locale} />
      </section>
    </div>
  );
}
