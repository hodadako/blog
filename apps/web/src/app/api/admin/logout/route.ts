import { serializeAdminSessionDeletionCookie } from "@/lib/auth";

export async function POST(request: Request): Promise<Response> {
  const formData = await request.formData();
  const locale = typeof formData.get("locale") === "string" ? String(formData.get("locale")) : "ko";
  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL(`/${locale}/admin/login`, request.url).toString(),
      "Set-Cookie": serializeAdminSessionDeletionCookie(),
    },
  });
}
