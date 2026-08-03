import { WorkerApiError, workerRequest } from "@/lib/worker-client";
import { isUuid, safeRedirectPath } from "@/lib/request-security";

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

  if (!isUuid(params.id) || (intent !== "edit" && intent !== "delete") || password.length < 8 || password.length > 72 || (intent === "edit" && (!content.trim() || content.trim().length > 5000))) {
    return redirectWithStatus(request, redirectTo, "invalid-input");
  }

  try {
    await workerRequest<{ ok: true }>(`/comments/${params.id}`, {
      method: intent === "edit" ? "PATCH" : "DELETE",
      body: JSON.stringify({ password, ...(intent === "edit" ? { content } : {}) }),
    });
  } catch (error) {
    const code = error instanceof WorkerApiError ? error.code : "worker-unavailable";
    return redirectWithStatus(request, redirectTo, code === "rate-limited" ? "rate-limited" : "comment-auth-failed");
  }

  return Response.redirect(new URL(safeRedirectPath(redirectTo, "/ko/blog"), request.url), 303);
}
