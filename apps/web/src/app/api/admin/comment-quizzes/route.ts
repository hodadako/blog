import { readAdminSessionFromCookieHeader } from "@/lib/auth";
import { disableCommentQuiz, upsertCommentQuiz } from "@/lib/comments";
import { isPublishedCanonicalSlug } from "@/lib/content";
import { isCanonicalSlug } from "@/lib/request-security";

function unauthorized(): Response {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}

export async function POST(request: Request): Promise<Response> {
  if (!readAdminSessionFromCookieHeader(request.headers.get("cookie"))) {
    return unauthorized();
  }

  const body = await request.json() as { canonicalSlug?: unknown; prompt?: unknown; answers?: unknown };
  const canonicalSlug = typeof body.canonicalSlug === "string" ? body.canonicalSlug.trim() : "";
  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  const answers = Array.isArray(body.answers) ? body.answers.filter((value): value is string => typeof value === "string") : [];

  if (!isCanonicalSlug(canonicalSlug) || !(await isPublishedCanonicalSlug(canonicalSlug))) {
    return Response.json({ error: "post-not-found" }, { status: 404 });
  }

  try {
    const item = await upsertCommentQuiz({ slug: canonicalSlug, prompt, answers });
    return Response.json({ item }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "invalid-request" }, { status: 400 });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  if (!readAdminSessionFromCookieHeader(request.headers.get("cookie"))) {
    return unauthorized();
  }

  const body = await request.json() as { canonicalSlug?: unknown };
  const canonicalSlug = typeof body.canonicalSlug === "string" ? body.canonicalSlug.trim() : "";

  if (!isCanonicalSlug(canonicalSlug)) {
    return Response.json({ error: "invalid-slug" }, { status: 400 });
  }

  await disableCommentQuiz(canonicalSlug);
  return new Response(null, { status: 204 });
}
