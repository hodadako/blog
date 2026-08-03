import { readAdminSessionFromCookieHeader } from "@/lib/auth";
import { resolveLocale } from "@/lib/site";
import type { CommentStatus } from "@/lib/types";
import { blacklistWorkerCommentIp, moderateWorkerComment } from "@/lib/worker-admin";

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
    await blacklistWorkerCommentIp(params.id);
  } else {
    await moderateWorkerComment(params.id, decision as CommentStatus);
  }

  return Response.redirect(new URL(`/${locale}/admin/comments`, request.url), 303);
}
