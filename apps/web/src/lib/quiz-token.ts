import { createHmac, timingSafeEqual } from "node:crypto";
import type { CommentAuthorizationClaims, QuizChallengeClaims } from "@/lib/types";
import { requireQuizSecret } from "@/lib/env";

function encode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function signaturesMatch(left: string, right: string): boolean {
  const leftDigest = createHmac("sha256", "signature-comparison").update(left).digest();
  const rightDigest = createHmac("sha256", "signature-comparison").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

function parseSignedToken(token: string): unknown {
  const parts = token.split(".");

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error("Malformed token.");
  }

  const [payload, signature] = parts;
  const expected = sign(payload, requireQuizSecret());

  if (!signaturesMatch(signature, expected)) {
    throw new Error("Token signature mismatch.");
  }

  return JSON.parse(decode(payload)) as unknown;
}

function isIntegerInRange(value: unknown, minimum: number, maximum: number): value is number {
  return Number.isInteger(value) && Number(value) >= minimum && Number(value) <= maximum;
}

export function verifyQuizChallengeToken(
  token: string,
  expectedSlug: string,
  answer: string,
): QuizChallengeClaims {
  const value = parseSignedToken(token);

  if (!value || typeof value !== "object") {
    throw new Error("Invalid challenge claims.");
  }

  const claims = value as Partial<QuizChallengeClaims>;
  const now = Math.floor(Date.now() / 1000);

  if (
    claims.v !== 1
    || claims.typ !== "comment_quiz_challenge"
    || claims.slug !== expectedSlug
    || (claims.locale !== "ko" && claims.locale !== "en")
    || !isIntegerInRange(claims.left, 1, 9)
    || !isIntegerInRange(claims.right, 1, 9)
    || !isIntegerInRange(claims.iat, 0, Number.MAX_SAFE_INTEGER)
    || !isIntegerInRange(claims.exp, 0, Number.MAX_SAFE_INTEGER)
    || claims.iat > now + 30
    || claims.exp <= now
    || claims.exp - claims.iat > 900
  ) {
    throw new Error("Challenge token is invalid or expired.");
  }

  if (String(claims.left + claims.right) !== answer.trim()) {
    throw new Error("Quiz answer mismatch.");
  }

  return claims as QuizChallengeClaims;
}

export function issueCommentAuthorizationToken(
  canonicalSlug: string,
  authorizationId: string,
  expiresAt: Date,
): string {
  const now = Math.floor(Date.now() / 1000);
  const claims: CommentAuthorizationClaims = {
    v: 1,
    typ: "comment_write_authorization",
    purpose: "COMMENT_WRITE",
    canonicalSlug,
    iat: now,
    exp: Math.floor(expiresAt.getTime() / 1000),
    jti: authorizationId,
  };
  const payload = encode(JSON.stringify(claims));
  return `${payload}.${sign(payload, requireQuizSecret())}`;
}

export function verifyCommentAuthorizationToken(
  token: string,
  expectedSlug: string,
): CommentAuthorizationClaims {
  const value = parseSignedToken(token);

  if (!value || typeof value !== "object") {
    throw new Error("Invalid authorization claims.");
  }

  const claims = value as Partial<CommentAuthorizationClaims>;
  const now = Math.floor(Date.now() / 1000);
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (
    claims.v !== 1
    || claims.typ !== "comment_write_authorization"
    || claims.purpose !== "COMMENT_WRITE"
    || claims.canonicalSlug !== expectedSlug
    || typeof claims.jti !== "string"
    || !uuidPattern.test(claims.jti)
    || !isIntegerInRange(claims.iat, 0, Number.MAX_SAFE_INTEGER)
    || !isIntegerInRange(claims.exp, 0, Number.MAX_SAFE_INTEGER)
    || claims.iat > now + 30
    || claims.exp <= now
    || claims.exp - claims.iat > 900
  ) {
    throw new Error("Authorization token is invalid or expired.");
  }

  return claims as CommentAuthorizationClaims;
}
