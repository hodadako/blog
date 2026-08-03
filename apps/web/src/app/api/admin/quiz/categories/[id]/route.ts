import { readAdminSessionFromCookieHeader } from "@/lib/auth";
import { isUuid } from "@/lib/request-security";
import { updateWorkerQuizCategory } from "@/lib/worker-admin";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  if (!readAdminSessionFromCookieHeader(request.headers.get("cookie"))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  if (!isUuid(id)) return Response.json({ error: "invalid-id" }, { status: 400 });
  try {
    const body = await request.json() as { name?: unknown; description?: unknown; active?: unknown };
    await updateWorkerQuizCategory(id, {
      ...(typeof body.name === "string" ? { name: body.name } : {}),
      ...(typeof body.description === "string" ? { description: body.description } : {}),
      ...(typeof body.active === "boolean" ? { active: body.active } : {}),
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "invalid-request" }, { status: 400 });
  }
}
