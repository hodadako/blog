import { consumeCommentRateLimit, createComment, hashCommentRequest } from "@/lib/comments";
import { isPublishedCanonicalSlug } from "@/lib/content";
import { verifyCommentAuthorizationToken } from "@/lib/quiz-token";
import {
  getRequestSubjectHash,
  isCanonicalSlug,
  isUuid,
  safeRedirectPath,
} from "@/lib/request-security";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function redirectWithStatus(request: Request, redirectTo: string, status: string): Response {
  const url = new URL(safeRedirectPath(redirectTo, "/ko/blog"), request.url);
  url.searchParams.set("commentStatus", status);
  return Response.redirect(url, 303);
}

function isValidCommentInput(input: {
  slug: string;
  parentId: string;
  author: string;
  password: string;
  content: string;
  authorizationToken: string;
  idempotencyKey: string;
}): boolean {
  return isCanonicalSlug(input.slug)
    && (!input.parentId || isUuid(input.parentId))
    && input.author.trim().length >= 1
    && input.author.trim().length <= 80
    && input.password.length >= 8
    && input.password.length <= 72
    && input.content.trim().length >= 1
    && input.content.trim().length <= 5000
    && input.authorizationToken.length >= 64
    && input.authorizationToken.length <= 4096
    && isUuid(input.idempotencyKey);
}

export async function POST(request: Request): Promise<Response> {
  const formData = await request.formData();
  const input = {
    slug: readString(formData, "canonicalSlug").trim(),
    parentId: readString(formData, "parentId"),
    author: readString(formData, "author"),
    password: readString(formData, "password"),
    content: readString(formData, "content"),
    authorizationToken: readString(formData, "authorizationToken"),
    idempotencyKey: readString(formData, "idempotencyKey"),
  };
  const redirectTo = readString(formData, "redirectTo");

  if (!isValidCommentInput(input)) {
    return redirectWithStatus(request, redirectTo, "invalid-input");
  }

  if (!(await isPublishedCanonicalSlug(input.slug))) {
    return redirectWithStatus(request, redirectTo, "post-not-found");
  }

  const attemptAllowed = await consumeCommentRateLimit({
    action: "comment:create-attempt",
    subjectHash: getRequestSubjectHash(request),
    limit: 20,
    windowSeconds: 300,
  });

  if (!attemptAllowed) {
    return redirectWithStatus(request, redirectTo, "rate-limited");
  }

  let authorizationId: string;

  try {
    authorizationId = verifyCommentAuthorizationToken(input.authorizationToken, input.slug).jti;
  } catch {
    return redirectWithStatus(request, redirectTo, "invalid-authorization");
  }

  const parentId = input.parentId || null;
  const requestHash = hashCommentRequest({
    slug: input.slug,
    parentId,
    authorName: input.author.trim(),
    content: input.content.trim(),
    password: input.password,
  });

  try {
    await createComment({
      authorizationId,
      idempotencyKey: input.idempotencyKey,
      requestHash,
      slug: input.slug,
      parentId,
      authorName: input.author,
      content: input.content,
      password: input.password,
      ipHash: getRequestSubjectHash(request),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message.includes("rate-limited")
      ? "rate-limited"
      : message.includes("invalid-parent-comment")
        ? "invalid-parent"
        : message.includes("duplicate-comment")
          ? "duplicate-comment"
        : message.includes("idempotency-conflict")
            ? "idempotency-conflict"
            : "invalid-authorization";
    return redirectWithStatus(request, redirectTo, status);
  }

  return Response.redirect(new URL(safeRedirectPath(redirectTo, "/ko/blog"), request.url), 303);
}
