import { readAdminSessionFromCookieHeader } from "@/lib/auth";
import { upsertWorkerQuizQuestion } from "@/lib/worker-admin";

function unauthorized(): Response {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}

export async function POST(request: Request): Promise<Response> {
  if (!readAdminSessionFromCookieHeader(request.headers.get("cookie"))) return unauthorized();
  try {
    const body = await request.json() as Parameters<typeof upsertWorkerQuizQuestion>[0];
    await upsertWorkerQuizQuestion(body);
    return Response.json({ ok: true }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "invalid-request" }, { status: 400 });
  }
}
