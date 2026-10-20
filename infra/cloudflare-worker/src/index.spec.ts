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
    if (url.endsWith("/rpc/create_comment_with_authorization")) {
      return Response.json(overrides.comment ?? [{
        comment_id: "123e4567-e89b-42d3-a456-426614174098",
        replayed: false,
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

  it("hashes a comment password with the Workers-compatible PBKDF2 format", async () => {
    mockSupabase({ authorization: [{
      authorization_id: "123e4567-e89b-42d3-a456-426614174099",
      canonical_slug: "2025-retrospective",
      expires_at: "2099-08-03T15:00:00.000Z",
    }] });
    const authorizationResponse = await worker.fetch(new Request("https://quiz.hodako.dev/quiz/challenges/123e4567-e89b-42d3-a456-426614174000/verify", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.10" },
      body: JSON.stringify({ selectedOptionId: question.options[0].id }),
    }), env);
    const authorization = await authorizationResponse.json() as { authorizationToken?: string };

    const response = await worker.fetch(new Request("https://quiz.hodako.dev/comments", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.10" },
      body: JSON.stringify({
        canonicalSlug: "2025-retrospective",
        content: "댓글 비밀번호 해시 테스트",
        password: "test-password-123",
        parentId: null,
        author: "테스트",
        authorizationToken: authorization.authorizationToken,
        idempotencyKey: "123e4567-e89b-42d3-a456-426614174097",
      }),
    }), env);

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ commentId: "123e4567-e89b-42d3-a456-426614174098" });
  });

  it("lists, assigns, and clears post quiz category mappings through the admin API", async () => {
    const categoryId = "123e4567-e89b-42d3-a456-426614174010";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes("/rest/v1/post_threads?")) {
        if (init?.method === "POST") {
          const body = JSON.parse(String(init.body)) as Record<string, unknown>;
          return Response.json([{ canonical_slug: "legal-alien", quiz_category_id: body.quiz_category_id }]);
        }
        return Response.json([{ canonical_slug: "2025-retrospective", quiz_category_id: null }]);
      }
      if (url.includes("/rest/v1/quiz_categories?")) {
        return Response.json([{ id: categoryId }]);
      }
      return Response.json([]);
    });

    const listResponse = await worker.fetch(new Request("https://quiz.hodako.dev/admin/quiz/post-mappings", {
      headers: { "x-admin-api-key": env.ADMIN_API_SECRET },
    }), env);
    expect(listResponse.status).toBe(200);
    expect(await listResponse.json()).toEqual([{ canonical_slug: "2025-retrospective", quiz_category_id: null }]);

    const assignResponse = await worker.fetch(new Request("https://quiz.hodako.dev/admin/quiz/post-mappings", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-api-key": env.ADMIN_API_SECRET },
      body: JSON.stringify({ canonicalSlug: "legal-alien", categoryId }),
    }), env);
    expect(assignResponse.status).toBe(200);
    expect(await assignResponse.json()).toEqual({ item: { canonical_slug: "legal-alien", quiz_category_id: categoryId } });

    const clearResponse = await worker.fetch(new Request("https://quiz.hodako.dev/admin/quiz/post-mappings", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-api-key": env.ADMIN_API_SECRET },
      body: JSON.stringify({ canonicalSlug: "legal-alien", categoryId: null }),
    }), env);
    expect(clearResponse.status).toBe(200);
    expect(await clearResponse.json()).toEqual({ item: { canonical_slug: "legal-alien", quiz_category_id: null } });
    expect(fetchMock).toHaveBeenCalled();
  });

  it("rejects malformed post quiz mappings before touching Supabase", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json([]));
    const response = await worker.fetch(new Request("https://quiz.hodako.dev/admin/quiz/post-mappings", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-api-key": env.ADMIN_API_SECRET },
      body: JSON.stringify({ canonicalSlug: "../private", categoryId: null }),
    }), env);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid-post-quiz-mapping-input" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects inactive or unknown quiz categories", async () => {
    const categoryId = "123e4567-e89b-42d3-a456-426614174010";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/rest/v1/quiz_categories?")) return Response.json([]);
      return Response.json([]);
    });
    const response = await worker.fetch(new Request("https://quiz.hodako.dev/admin/quiz/post-mappings", {
      method: "PATCH",
      headers: { "content-type": "application/json", "x-admin-api-key": env.ADMIN_API_SECRET },
      body: JSON.stringify({ canonicalSlug: "legal-alien", categoryId }),
    }), env);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid-quiz-category" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
