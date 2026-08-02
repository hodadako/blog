import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  hashCommentIp,
  hashCommentPassword,
  hashCommentRequest,
  normalizeQuizAnswer,
  verifyCommentPassword,
} from "@/lib/comments";

describe("comment security primitives", () => {
  beforeEach(() => {
    vi.stubEnv("COMMENT_PASSWORD_PEPPER", "test-comment-password-pepper");
    vi.stubEnv("COMMENT_IP_HASH_SECRET", "test-comment-ip-hash-secret");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("stores a salted scrypt password hash and verifies it", () => {
    const first = hashCommentPassword("correct horse battery staple");
    const second = hashCommentPassword("correct horse battery staple");

    expect(first).toMatch(/^scrypt\$/);
    expect(first).not.toBe(second);
    expect(verifyCommentPassword("correct horse battery staple", first)).toBe(true);
    expect(verifyCommentPassword("wrong password", first)).toBe(false);
  });

  it("normalizes quiz answers using the documented version 1 policy", () => {
    expect(normalizeQuizAnswer("  ＹＯＡＳＯＢＩ   Test  ")).toBe("yoasobi test");
  });

  it("uses keyed hashes for IP and idempotency request data", () => {
    const ipHash = hashCommentIp("203.0.113.10");
    const requestHash = hashCommentRequest({
      slug: "callback",
      parentId: null,
      authorName: "tester",
      content: "hello",
      password: "private password",
    });

    expect(ipHash).toMatch(/^[0-9a-f]{64}$/);
    expect(requestHash).toMatch(/^[0-9a-f]{64}$/);
    expect(requestHash).not.toContain("private password");
  });
});
