import { describe, expect, it } from "vitest";
import worker from "./index";

const env = {
  QUIZ_TTL_SECONDS: "300",
  QUIZ_TOKEN_SECRET: "test-secret-that-is-long-enough-for-hmac",
} as Env;

describe("quiz worker", () => {
  it("issues a bounded signed challenge without an answer claim", async () => {
    const response = await worker.fetch(new Request("https://quiz.hodako.dev/challenge?slug=callback&locale=ko"), env);
    const result = await response.json() as { challengeToken: string; prompt: string };
    const claims = JSON.parse(atob(result.challengeToken.split(".")[0].replace(/-/g, "+").replace(/_/g, "/"))) as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(result.prompt).toMatch(/^\d \+ \d = \?$/);
    expect(claims).not.toHaveProperty("answer");
    expect(claims).toMatchObject({ typ: "comment_quiz_challenge", slug: "callback", locale: "ko" });
  });

  it("returns a bodyless successful preflight", async () => {
    const response = await worker.fetch(new Request("https://quiz.hodako.dev/challenge", {
      method: "OPTIONS",
      headers: { origin: "https://hodako.dev" },
    }), env);

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("access-control-allow-origin")).toBe("https://hodako.dev");
  });

  it("rejects invalid slugs", async () => {
    const response = await worker.fetch(new Request("https://quiz.hodako.dev/challenge?slug=../secret&locale=ko"), env);
    expect(response.status).toBe(400);
  });
});
