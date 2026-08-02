import { consumeCommentRateLimit, deleteComment, updateComment } from "@/lib/comments";
import { getRequestSubjectHash, isUuid, safeRedirectPath } from "@/lib/request-security";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function redirectWithStatus(request: Request, redirectTo: string, status: string): Response {
  const url = new URL(safeRedirectPath(redirectTo, "/ko/blog"), request.url);
  url.searchParams.set("commentStatus", status);
  return Response.redirect(url, 303);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const params = await context.params;
  const formData = await request.formData();
  const intent = readString(formData, "intent");
  const password = readString(formData, "password");
  const content = readString(formData, "content");
  const redirectTo = readString(formData, "redirectTo");

  if (!isUuid(params.id) || (intent !== "edit" && intent !== "delete")) {
    return redirectWithStatus(request, redirectTo, "invalid-input");
  }

  const allowed = await consumeCommentRateLimit({
    action: `comment:${intent}`,
    subjectHash: getRequestSubjectHash(request),
    limit: 10,
    windowSeconds: 300,
  });

  if (!allowed) {
    return redirectWithStatus(request, redirectTo, "rate-limited");
  }

  try {
    if (intent === "edit") {
      await updateComment({ commentId: params.id, password, content });
    } else {
      await deleteComment({ commentId: params.id, password });
    }
  } catch {
    return redirectWithStatus(request, redirectTo, "comment-auth-failed");
  }

  return Response.redirect(new URL(safeRedirectPath(redirectTo, "/ko/blog"), request.url), 303);
}
