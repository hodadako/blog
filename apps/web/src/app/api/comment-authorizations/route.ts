import { WorkerApiError, workerRequest } from "@/lib/worker-client";
import { isCanonicalSlug } from "@/lib/request-security";

function errorResponse(error: string, status: number): Response {
  return Response.json({ error }, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request): Promise<Response> {
  let body: { canonicalSlug?: unknown; inviteToken?: unknown };
  try {
    body = await request.json() as { canonicalSlug?: unknown; inviteToken?: unknown };
  } catch {
    return errorResponse("invalid-json", 400);
  }

  const canonicalSlug = typeof body.canonicalSlug === "string" ? body.canonicalSlug.trim() : "";
  const inviteToken = typeof body.inviteToken === "string" ? body.inviteToken.trim() : "";
  if (!isCanonicalSlug(canonicalSlug) || !inviteToken) {
    return errorResponse("two-step-authorization-required", 410);
  }

  try {
    const result = await workerRequest<{ authorizationToken: string; expiresAt: string }>("/comment-authorizations", {
      method: "POST",
      body: JSON.stringify({ canonicalSlug, inviteToken }),
    });
    return Response.json(result, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    const code = error instanceof WorkerApiError ? error.code : "worker-unavailable";
    return errorResponse(code, error instanceof WorkerApiError ? error.status : 503);
  }
}

export async function GET(): Promise<Response> {
  return errorResponse("two-step-authorization-required", 410);
}
