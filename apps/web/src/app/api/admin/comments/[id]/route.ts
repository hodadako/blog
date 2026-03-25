import { readAdminSessionFromCookieHeader } from "@/lib/auth";
import { blacklistCommentIp, moderateComment } from "@/lib/comments";
import { resolveLocale } from "@/lib/site";
import type { CommentStatus } from "@/lib/types";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const params = await context.params;
  const formData = await request.formData();
  const locale = resolveLocale(readString(formData, "locale") || "ko");
  const decision = readString(formData, "decision");

  if (!readAdminSessionFromCookieHeader(request.headers.get("cookie"))) {
    return Response.redirect(new URL(`/${locale}/admin/login?error=unauthorized`, request.url), 303);
  }

  if (decision === "blacklist_ip") {
    await blacklistCommentIp(params.id);
  } else {
    await moderateComment({ commentId: params.id, status: decision as CommentStatus });
  }

  return Response.redirect(new URL(`/${locale}/admin/comments`, request.url), 303);
}
