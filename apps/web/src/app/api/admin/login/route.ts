import { issueAdminSession, serializeAdminSessionCookie, verifyAdminPassword } from "@/lib/auth";
import { consumeCommentRateLimit } from "@/lib/comments";
import { getRequestSubjectHash, safeRedirectPath } from "@/lib/request-security";
import { resolveLocale } from "@/lib/site";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request): Promise<Response> {
  const formData = await request.formData();
  const password = readString(formData, "password");
  const locale = resolveLocale(readString(formData, "locale") || "ko");
  const fallback = `/${locale}/admin`;
  const redirectTo = safeRedirectPath(readString(formData, "redirectTo"), fallback);
  const allowed = await consumeCommentRateLimit({
    action: "admin:login",
    subjectHash: getRequestSubjectHash(request),
    limit: 5,
    windowSeconds: 900,
  });

  if (!allowed) {
    return Response.redirect(new URL(`/${locale}/admin/login?error=rate-limited`, request.url), 303);
  }

  if (!verifyAdminPassword(password)) {
    return Response.redirect(new URL(`/${locale}/admin/login?error=invalid-password`, request.url), 303);
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL(redirectTo, request.url).toString(),
      "Set-Cookie": serializeAdminSessionCookie(issueAdminSession()),
    },
  });
}
