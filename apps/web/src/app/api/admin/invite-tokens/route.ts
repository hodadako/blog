import { readAdminSessionFromCookieHeader } from "@/lib/auth";
import { isUuid } from "@/lib/request-security";
import { createWorkerInviteToken, revokeWorkerInviteToken } from "@/lib/worker-admin";

function unauthorized(): Response {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}

export async function POST(request: Request): Promise<Response> {
  if (!readAdminSessionFromCookieHeader(request.headers.get("cookie"))) {
    return unauthorized();
  }

  const body = await request.json() as { label?: unknown };
  const label = typeof body.label === "string" ? body.label : "";

  try {
    const result = await createWorkerInviteToken(label);
    return Response.json(result, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "invalid-request" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request): Promise<Response> {
  if (!readAdminSessionFromCookieHeader(request.headers.get("cookie"))) {
    return unauthorized();
  }

  const body = await request.json() as { id?: unknown };
  const id = typeof body.id === "string" ? body.id : "";

  if (!isUuid(id)) {
    return Response.json({ error: "invalid-id" }, { status: 400 });
  }

  await revokeWorkerInviteToken(id);
  return new Response(null, { status: 204 });
}
