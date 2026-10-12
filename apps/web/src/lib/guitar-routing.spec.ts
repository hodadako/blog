import { describe, expect, it } from "vitest";
import { getGuitarRedirectExclusionPattern, isGuitarHost, resolveGuitarPath } from "./guitar-routing";

describe("Guitar host routing", () => {
  it("matches only configured exact hosts after port normalization", () => {
    expect(isGuitarHost("GUITAR.HODAKO.DEV:443")).toBe(true);
    expect(isGuitarHost("guitar.localhost:3000")).toBe(true);
    expect(isGuitarHost("preview-guitar.hodako.dev")).toBe(false);
    expect(isGuitarHost("guitar.example.com", "guitar.example.com,preview.example.com")).toBe(true);
  });

  it("keeps external URLs free of the internal route prefix", () => {
    expect(resolveGuitarPath("/")).toEqual({ kind: "rewrite", pathname: "/guitar" });
    expect(resolveGuitarPath("/songs")).toEqual({ kind: "rewrite", pathname: "/guitar/songs" });
    expect(resolveGuitarPath("/songs/artist--song")).toEqual({
      kind: "rewrite",
      pathname: "/guitar/songs/artist--song",
    });
  });

  it("rejects blog, API, and internal implementation paths on Guitar hosts", () => {
    for (const pathname of ["/ko", "/blog/post", "/api/comments", "/guitar", "/songs/unknown.slug"]) {
      expect(resolveGuitarPath(pathname)).toEqual({ kind: "not-found" });
    }
  });

  it("allows only framework and declared public SEO/assets to pass through", () => {
    expect(resolveGuitarPath("/sitemap.xml").kind).toBe("pass");
    expect(resolveGuitarPath("/robots.txt").kind).toBe("pass");
    expect(resolveGuitarPath("/_next/static/app.js").kind).toBe("pass");
    expect(resolveGuitarPath("/fonts/ko/woff/Title_Bold.woff").kind).toBe("pass");
  });

  it("builds a redirect condition that excludes every Guitar host", () => {
    const pattern = new RegExp(getGuitarRedirectExclusionPattern("guitar.example.com,preview.example.com"));
    expect(pattern.test("blog.example.com")).toBe(true);
    expect(pattern.test("guitar.example.com")).toBe(false);
    expect(pattern.test("preview.example.com:3000")).toBe(false);
  });
});
