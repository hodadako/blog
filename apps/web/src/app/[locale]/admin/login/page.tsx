import {buildPageTitle, getDictionary, resolveLocale, resolveRouteParams} from "@/lib/site";

interface AdminLoginParams {
  locale: string;
}

interface AdminLoginProps {
  params: Promise<AdminLoginParams>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({params}: AdminLoginProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);
  const dictionary = getDictionary(locale);

  return {
    title: buildPageTitle(locale, dictionary.adminLogin.heading),
    description: dictionary.adminLogin.intro,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AdminLoginPage({params, searchParams}: AdminLoginProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);
  const dictionary = getDictionary(locale);
  const resolvedSearchParams = (await Promise.resolve(searchParams)) as Record<string, string | string[] | undefined> | undefined;
  const error = typeof resolvedSearchParams?.error === "string" ? resolvedSearchParams.error : undefined;

  return (
    <div className="page-main">
      <section className="page-section">
        <div className="surface-card surface-card--narrow stack-md">
          <p className="section-eyebrow">{dictionary.adminLogin.eyebrow}</p>
          <h1 className="section-title">{dictionary.adminLogin.heading}</h1>
          <p className="page-copy">{dictionary.adminLogin.intro}</p>

          <form action="/api/admin/login" className="form-grid" method="post">
            <input name="locale" type="hidden" value={locale} />
            <input name="redirectTo" type="hidden" value={`/${locale}/admin`} />

            <label className="field">
              <span className="field__label">{dictionary.adminLogin.passwordLabel}</span>
              <input className="field__input" name="password" required type="password" />
            </label>

            <div className="button-row">
              <button className="button" type="submit">
                {dictionary.adminLogin.submitLabel}
              </button>
            </div>
          </form>

          <p className="status-text">{error ? `${dictionary.adminLogin.helperText} (${error})` : dictionary.adminLogin.helperText}</p>
        </div>
      </section>
    </div>
  );
}
