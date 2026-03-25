import { createComment } from "@/lib/comments";
import { verifyQuizPassToken } from "@/lib/quiz-token";

const ANON_COOKIE_NAME = "blog_anon_id";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
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

  verifyQuizPassToken(quizToken, canonicalSlug);
  await createComment({
    slug: canonicalSlug,
    parentId: parentId || null,
    authorName: author,
    content,
    password,
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
