import { createHmac, randomUUID } from "node:crypto";
import type { QuizTokenClaims } from "@/lib/types";
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

export function issueQuizPassToken(slug: string, anonId: string, expiresInSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const claims: QuizTokenClaims = {
    v: 1,
    typ: "comment_quiz_pass",
    slug,
    anonId,
    iat: now,
    exp: now + expiresInSeconds,
    jti: randomUUID(),
  };
  const payload = encode(JSON.stringify(claims));
  const signature = sign(payload, requireQuizSecret());
  return `${payload}.${signature}`;
}

export function verifyQuizPassToken(token: string, expectedSlug: string): QuizTokenClaims {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    throw new Error("Malformed quiz token.");
  }

  const expected = sign(payload, requireQuizSecret());

  if (signature !== expected) {
    throw new Error("Quiz token signature mismatch.");
  }

  const claims = JSON.parse(decode(payload)) as QuizTokenClaims;
  const now = Math.floor(Date.now() / 1000);

  if (claims.typ !== "comment_quiz_pass" || claims.slug !== expectedSlug || claims.exp <= now) {
    throw new Error("Quiz token is invalid or expired.");
  }

  return claims;
}
