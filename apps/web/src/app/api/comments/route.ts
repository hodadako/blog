import { createComment, hashCommentIp } from "@/lib/comments";
import { verifyQuizPassToken } from "@/lib/quiz-token";

const ANON_COOKIE_NAME = "blog_anon_id";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function buildRedirectUrl(request: Request, redirectTo: string, status: "frontend-only"): string {
  const url = new URL(redirectTo || "/ko/blog", request.url);
  url.searchParams.set("commentStatus", status);
  return url.toString();
}

function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip");
}

export async function POST(request: Request): Promise<Response> {
  const formData = await request.formData();
  const canonicalSlug = readString(formData, "canonicalSlug");
  const author = readString(formData, "author");
  const password = readString(formData, "password");
  const content = readString(formData, "content");
  const redirectTo = readString(formData, "redirectTo");
  const parentId = readString(formData, "parentId");
  const quizToken = readString(formData, "quizToken");
  const quizStatus = readString(formData, "quizStatus");
  const ipHash = getClientIp(request) ? hashCommentIp(getClientIp(request) as string) : null;

  if (quizStatus === "frontend-only" || !quizToken) {
    return Response.redirect(buildRedirectUrl(request, redirectTo, "frontend-only"), 303);
  }

  try {
    verifyQuizPassToken(quizToken, canonicalSlug);
  } catch {
    return Response.redirect(buildRedirectUrl(request, redirectTo, "frontend-only"), 303);
  }

  await createComment({
    slug: canonicalSlug,
    parentId: parentId || null,
    authorName: author,
    content,
    password,
    ipHash,
  });

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL(redirectTo || "/ko/blog", request.url).toString(),
      "Set-Cookie": `${ANON_COOKIE_NAME}=${crypto.randomUUID()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 365}${secure}`,
    },
  });
}
