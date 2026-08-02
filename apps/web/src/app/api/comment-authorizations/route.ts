import {
  consumeCommentRateLimit,
  createCommentAuthorization,
  getActiveCommentQuiz,
  verifyInviteToken,
  verifyConfiguredQuizAnswer,
} from "@/lib/comments";
import { isPublishedCanonicalSlug } from "@/lib/content";
import { issueCommentAuthorizationToken, verifyQuizChallengeToken } from "@/lib/quiz-token";
import { getRequestSubjectHash, isCanonicalSlug } from "@/lib/request-security";

const MAX_BODY_BYTES = 4096;

interface AuthorizationRequest {
  canonicalSlug?: unknown;
  challengeToken?: unknown;
  quizAnswer?: unknown;
  inviteToken?: unknown;
}

function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request): Promise<Response> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (contentLength > MAX_BODY_BYTES) {
    return jsonError("request-too-large", 413);
  }

  const allowed = await consumeCommentRateLimit({
    action: "authorization:create",
    subjectHash: getRequestSubjectHash(request),
    limit: 10,
    windowSeconds: 300,
  });

  if (!allowed) {
    return jsonError("rate-limited", 429);
  }

  let body: AuthorizationRequest;

  try {
    body = await request.json() as AuthorizationRequest;
  } catch {
    return jsonError("invalid-json", 400);
  }

  const canonicalSlug = typeof body.canonicalSlug === "string" ? body.canonicalSlug.trim() : "";
  const challengeToken = typeof body.challengeToken === "string" ? body.challengeToken : "";
  const quizAnswer = typeof body.quizAnswer === "string" ? body.quizAnswer : "";
  const inviteToken = typeof body.inviteToken === "string" ? body.inviteToken.trim() : "";
  const hasQuiz = Boolean(quizAnswer.trim());
  const hasInvite = Boolean(inviteToken);

  if (!isCanonicalSlug(canonicalSlug) || hasQuiz === hasInvite) {
    return jsonError("invalid-authorization-request", 400);
  }

  if (!(await isPublishedCanonicalSlug(canonicalSlug))) {
    return jsonError("post-not-found", 404);
  }

  let source: "quiz" | "invite";

  try {
    if (hasQuiz) {
      const configuredResult = await verifyConfiguredQuizAnswer(canonicalSlug, quizAnswer);

      if (configuredResult === false) {
        return jsonError("invalid-quiz-answer", 401);
      }

      if (configuredResult === null) {
        if (!challengeToken) {
          return jsonError("missing-challenge-token", 400);
        }
        verifyQuizChallengeToken(challengeToken, canonicalSlug, quizAnswer);
      }
      source = "quiz";
    } else {
      if (!(await verifyInviteToken(inviteToken))) {
        return jsonError("invalid-invite-token", 401);
      }
      source = "invite";
    }
  } catch {
    return jsonError(hasQuiz ? "invalid-quiz-answer" : "invalid-invite-token", 401);
  }

  const authorization = await createCommentAuthorization({ slug: canonicalSlug, source });
  const expiresAt = new Date(authorization.expires_at);
  const authorizationToken = issueCommentAuthorizationToken(canonicalSlug, authorization.id, expiresAt);

  return Response.json(
    { authorizationToken, expiresAt: expiresAt.toISOString() },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const canonicalSlug = url.searchParams.get("canonicalSlug")?.trim() ?? "";

  if (!isCanonicalSlug(canonicalSlug) || !(await isPublishedCanonicalSlug(canonicalSlug))) {
    return jsonError("post-not-found", 404);
  }

  const allowed = await consumeCommentRateLimit({
    action: "challenge:read",
    subjectHash: getRequestSubjectHash(request),
    limit: 30,
    windowSeconds: 300,
  });

  if (!allowed) {
    return jsonError("rate-limited", 429);
  }

  const quiz = await getActiveCommentQuiz(canonicalSlug);
  return Response.json(
    quiz ? { type: "configured", prompt: quiz.prompt } : { type: "generated" },
    { headers: { "cache-control": "no-store" } },
  );
}
