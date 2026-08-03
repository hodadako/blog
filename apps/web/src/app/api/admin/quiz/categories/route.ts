import { readAdminSessionFromCookieHeader } from "@/lib/auth";
import { createWorkerQuizCategory } from "@/lib/worker-admin";

export async function POST(request: Request): Promise<Response> {
  if (!readAdminSessionFromCookieHeader(request.headers.get("cookie"))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json() as { code?: unknown; name?: unknown; description?: unknown };
    const item = await createWorkerQuizCategory({
      code: typeof body.code === "string" ? body.code : "",
      name: typeof body.name === "string" ? body.name : "",
      description: typeof body.description === "string" ? body.description : "",
    });
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "invalid-request" }, { status: 400 });
  }
}
