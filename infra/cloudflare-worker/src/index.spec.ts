import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "./index";

const env = {
  QUIZ_TTL_SECONDS: "300",
  SUPABASE_URL: "https://hezknmxwxsiqhyjerhpl.supabase.co",
  QUIZ_IMAGE_BASE_URL: "https://raw.githubusercontent.com/hodadako/blog/main",
  QUIZ_TOKEN_SECRET: "test-secret-that-is-long-enough-for-hmac",
  COMMENT_AUTHORIZATION_SECRET: "authorization-secret-that-is-long-enough",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-test-key",
  IP_HASH_SECRET: "ip-hash-secret-that-is-long-enough",
  INVITE_TOKEN_PEPPER: "invite-pepper-that-is-long-enough",
  COMMENT_PASSWORD_PEPPER: "password-pepper-that-is-long-enough",
  ADMIN_API_SECRET: "admin-secret-that-is-long-enough",
} as Env;

const question = {
  challengeId: "123e4567-e89b-42d3-a456-426614174000",
  category: { code: "GENERAL", name: "General" },
  question: { type: "TEXT_MULTIPLE_CHOICE", prompt: "다음 중 프로그래밍 언어가 아닌 것은?" },
  options: [1, 2, 3, 4, 5].map((number) => ({
    id: `123e4567-e89b-42d3-a456-42661417400${number}`,
    text: `option-${number}`,
    imagePath: null,
    altText: null,
    label: `Option ${number}`,
  })),
  expiresAt: "2026-08-03T15:00:00.000Z",
};

function mockSupabase(overrides: Record<string, unknown> = {}): void {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.endsWith("/rpc/consume_comment_rate_limit")) {
      return Response.json(true);
    }
    if (url.endsWith("/rpc/issue_quiz_challenge")) {
      return Response.json(overrides.challenge ?? question);
    }
    if (url.endsWith("/rpc/verify_quiz_challenge_and_issue_authorization")) {
      return Response.json(overrides.authorization ?? [{
        authorization_id: "123e4567-e89b-42d3-a456-426614174099",
        canonical_slug: "2025-retrospective",
        expires_at: "2026-08-03T15:00:00.000Z",
      }]);
    }
    return Response.json([]);
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("quiz worker", () => {
  it("issues a five-option challenge without answer fields", async () => {
    mockSupabase();
    const response = await worker.fetch(new Request("https://quiz.hodako.dev/quiz/challenges", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.10" },
      body: JSON.stringify({ canonicalSlug: "2025-retrospective" }),
    }), env);
    const result = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(Array.isArray(result.options)).toBe(true);
    expect((result.options as unknown[]).length).toBe(5);
    expect(result).not.toHaveProperty("correctOptionId");
    expect(result).not.toHaveProperty("answer");
    expect(JSON.stringify(result)).not.toContain("isCorrect");
  });

  it("issues a short-lived authorization after option verification", async () => {
    mockSupabase();
    const response = await worker.fetch(new Request("https://quiz.hodako.dev/quiz/challenges/123e4567-e89b-42d3-a456-426614174000/verify", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.10" },
      body: JSON.stringify({ selectedOptionId: question.options[0].id }),
    }), env);
    const result = await response.json() as { authorizationToken?: string; expiresAt?: string };

    expect(response.status).toBe(201);
    expect(result.authorizationToken).toMatch(/^[^.]+\.[^.]+$/);
    expect(result.expiresAt).toBeTruthy();
    const payload = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(result.authorizationToken!.split(".")[0].replace(/-/g, "+").replace(/_/g, "/")), (char) => char.charCodeAt(0)))) as Record<string, unknown>;
    expect(payload).toMatchObject({ typ: "comment_write_authorization", purpose: "COMMENT_WRITE", canonicalSlug: "2025-retrospective" });
    expect(payload).not.toHaveProperty("answer");
  });

  it("returns a bodyless preflight and disables arithmetic challenges", async () => {
    const preflight = await worker.fetch(new Request("https://quiz.hodako.dev/quiz/challenges", {
      method: "OPTIONS",
      headers: { origin: "https://hodako.dev" },
    }), env);
    const legacy = await worker.fetch(new Request("https://quiz.hodako.dev/challenge?slug=callback&locale=ko"), env);

    expect(preflight.status).toBe(204);
    expect(await preflight.text()).toBe("");
    expect(preflight.headers.get("access-control-allow-origin")).toBe("https://hodako.dev");
    expect(legacy.status).toBe(410);
  });
});
