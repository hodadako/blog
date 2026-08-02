import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  issueCommentAuthorizationToken,
  verifyCommentAuthorizationToken,
  verifyQuizChallengeToken,
} from "@/lib/quiz-token";

const TEST_SECRET = "test-secret-that-is-long-enough-for-hmac";

function signClaims(claims: object): string {
  const payload = Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
  const signature = createHmac("sha256", TEST_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

describe("comment authorization tokens", () => {
  beforeEach(() => {
    process.env.QUIZ_TOKEN_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.QUIZ_TOKEN_SECRET;
  });

  it("validates a quiz challenge without storing the answer in its claims", () => {
    const now = Math.floor(Date.now() / 1000);
    const token = signClaims({
      v: 1,
      typ: "comment_quiz_challenge",
      slug: "callback",
      locale: "ko",
      left: 2,
      right: 3,
      iat: now,
      exp: now + 300,
    });

    expect(verifyQuizChallengeToken(token, "callback", " 5 ").slug).toBe("callback");
    expect(JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString("utf8"))).not.toHaveProperty("answer");
  });

  it("rejects a wrong quiz answer", () => {
    const now = Math.floor(Date.now() / 1000);
    const token = signClaims({
      v: 1,
      typ: "comment_quiz_challenge",
      slug: "callback",
      locale: "ko",
      left: 2,
      right: 3,
      iat: now,
      exp: now + 300,
    });

    expect(() => verifyQuizChallengeToken(token, "callback", "6")).toThrow("Quiz answer mismatch");
  });

  it("binds a short-lived authorization to its purpose and canonical slug", () => {
    const id = "123e4567-e89b-42d3-a456-426614174000";
    const token = issueCommentAuthorizationToken("callback", id, new Date(Date.now() + 5 * 60 * 1000));

    expect(verifyCommentAuthorizationToken(token, "callback")).toMatchObject({
      purpose: "COMMENT_WRITE",
      canonicalSlug: "callback",
      jti: id,
    });
    expect(() => verifyCommentAuthorizationToken(token, "another-post")).toThrow("invalid or expired");
  });
});
