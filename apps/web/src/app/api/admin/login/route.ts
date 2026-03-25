import { issueAdminSession, serializeAdminSessionCookie, verifyAdminPassword } from "@/lib/auth";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request): Promise<Response> {
  const formData = await request.formData();
  const password = readString(formData, "password");
  const redirectTo = readString(formData, "redirectTo");
  const locale = readString(formData, "locale") || "ko";

  if (!verifyAdminPassword(password)) {
    return Response.redirect(new URL(`/${locale}/admin/login?error=invalid-password`, request.url), 303);
  }

  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL(redirectTo || `/${locale}/admin`, request.url).toString(),
      "Set-Cookie": serializeAdminSessionCookie(issueAdminSession()),
    },
  });
}
