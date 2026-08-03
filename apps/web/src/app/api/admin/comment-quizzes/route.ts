import { readAdminSessionFromCookieHeader } from "@/lib/auth";

function unauthorized(): Response {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}

function retired(): Response {
  return Response.json({ error: "question-bank-api-required" }, { status: 410 });
}

export async function POST(request: Request): Promise<Response> {
  if (!readAdminSessionFromCookieHeader(request.headers.get("cookie"))) return unauthorized();
  return retired();
}

export async function DELETE(request: Request): Promise<Response> {
  if (!readAdminSessionFromCookieHeader(request.headers.get("cookie"))) return unauthorized();
  return retired();
}
