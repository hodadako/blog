import { readAdminSessionFromCookieHeader } from "@/lib/auth";
import { isCanonicalSlug, isUuid } from "@/lib/request-security";
import { getWorkerPostQuizMappings, updateWorkerPostQuizMapping } from "@/lib/worker-admin";

function unauthorized(): Response {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}

export async function GET(request: Request): Promise<Response> {
  if (!readAdminSessionFromCookieHeader(request.headers.get("cookie"))) {
    return unauthorized();
  }

  try {
    const items = await getWorkerPostQuizMappings();
    return Response.json({ items }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "request-failed" }, { status: 400 });
  }
}

export async function PATCH(request: Request): Promise<Response> {
  if (!readAdminSessionFromCookieHeader(request.headers.get("cookie"))) {
    return unauthorized();
  }

  try {
    const body = await request.json() as { canonicalSlug?: unknown; categoryId?: unknown };
    const canonicalSlug = typeof body.canonicalSlug === "string" ? body.canonicalSlug.trim() : "";
    const categoryId = body.categoryId === null ? null : typeof body.categoryId === "string" ? body.categoryId : "";
    if (!isCanonicalSlug(canonicalSlug) || (categoryId !== null && !isUuid(categoryId))) {
      return Response.json({ error: "invalid-post-quiz-mapping-input" }, { status: 400 });
    }

    const item = await updateWorkerPostQuizMapping(canonicalSlug, categoryId);
    return Response.json({ item }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "request-failed" }, { status: 400 });
  }
}