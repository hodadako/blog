import { WorkerApiError, workerRequest } from "@/lib/worker-client";
import { isCanonicalSlug, isUuid, safeRedirectPath } from "@/lib/request-security";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function redirectWithStatus(request: Request, redirectTo: string, status: string): Response {
  const url = new URL(safeRedirectPath(redirectTo, "/ko/blog"), request.url);
  url.searchParams.set("commentStatus", status);
  return Response.redirect(url, 303);
}

export async function POST(request: Request): Promise<Response> {
  const formData = await request.formData();
  const input = {
    canonicalSlug: readString(formData, "canonicalSlug").trim(),
    parentId: readString(formData, "parentId") || null,
    author: readString(formData, "author"),
    password: readString(formData, "password"),
    content: readString(formData, "content"),
    authorizationToken: readString(formData, "authorizationToken"),
    idempotencyKey: readString(formData, "idempotencyKey"),
  };
  const redirectTo = readString(formData, "redirectTo");

  if (!isCanonicalSlug(input.canonicalSlug)
    || (input.parentId !== null && !isUuid(input.parentId))
    || input.author.trim().length < 1 || input.author.trim().length > 80
    || input.password.length < 8 || input.password.length > 72
    || input.content.trim().length < 1 || input.content.trim().length > 5000
    || input.authorizationToken.length < 64 || input.authorizationToken.length > 4096
    || !isUuid(input.idempotencyKey)) {
    return redirectWithStatus(request, redirectTo, "invalid-input");
  }

  try {
    await workerRequest<{ commentId: string; replayed: boolean }>("/comments", {
      method: "POST",
      body: JSON.stringify(input),
    });
  } catch (error) {
    const code = error instanceof WorkerApiError ? error.code : "worker-unavailable";
    const status = code === "rate-limited"
      ? "rate-limited"
      : code === "invalid-parent-comment"
        ? "invalid-parent"
        : code === "duplicate-comment"
          ? "duplicate-comment"
          : code === "idempotency-conflict"
            ? "idempotency-conflict"
            : code === "post-not-found"
              ? "post-not-found"
              : code === "invalid-authorization"
                ? "invalid-authorization"
                : "worker-unavailable";
    return redirectWithStatus(request, redirectTo, status);
  }

  return Response.redirect(new URL(safeRedirectPath(redirectTo, "/ko/blog"), request.url), 303);
}
