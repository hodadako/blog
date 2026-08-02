import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTrustedClientIp, isCanonicalSlug, isUuid, safeRedirectPath } from "@/lib/request-security";

describe("request security helpers", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers the trusted Vercel header over user-controlled X-Forwarded-For", () => {
    const request = new Request("https://hodako.dev", {
      headers: {
        "x-vercel-forwarded-for": "203.0.113.10",
        "x-forwarded-for": "198.51.100.20",
      },
    });

    expect(getTrustedClientIp(request)).toBe("203.0.113.10");
  });

  it("rejects external and protocol-relative redirects", () => {
    expect(safeRedirectPath("https://example.com", "/ko/blog")).toBe("/ko/blog");
    expect(safeRedirectPath("//example.com", "/ko/blog")).toBe("/ko/blog");
    expect(safeRedirectPath("/ko/blog/post", "/ko/blog")).toBe("/ko/blog/post");
  });

  it("validates canonical slugs and UUIDs", () => {
    expect(isCanonicalSlug("callback-and-async")).toBe(true);
    expect(isCanonicalSlug("../secret")).toBe(false);
    expect(isUuid("123e4567-e89b-42d3-a456-426614174000")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
  });
});
