import { describe, expect, it } from "vitest";
import { getAdConfig, getAdPublisherId, getAdsTxt, VERIFIED_ADSENSE_ACCOUNT } from "./ads";

const enabled = {
  NODE_ENV: "production", ADS_ENABLED: "true", ADS_CONSENT_CONFIGURED: "true",
  ADSENSE_PUBLISHER_ID: "ca-pub-1234567890123456", ADSENSE_BLOG_ARTICLE_END_SLOT: "5678",
  ADSENSE_GUITAR_SONG_END_SLOT: "1234",
};

describe("manual advertising configuration", () => {
  it("defaults to no ad units, while retaining owner-provided verification", () => {
    expect(getAdConfig("blog", "article-end", {})).toBeNull();
    expect(getAdPublisherId({})).toBe(VERIFIED_ADSENSE_ACCOUNT);
    expect(getAdsTxt({})).toBe("google.com, pub-2583784505029772, DIRECT, f08c47fec0942fa0\nsubdomain=guitar.hodako.dev\n");
  });

  it("permits only the article-end default after explicit global and consent setup", () => {
    expect(getAdConfig("blog", "article-end", enabled)?.unitId).toBe("5678");
    for (const placement of ["article-inline", "post-list", "records", "design-lab", "song-end"] as const) {
      expect(getAdConfig("blog", placement, enabled)).toBeNull();
    }
  });

  it("fails closed for missing, malformed or confused IDs", () => {
    for (const publisher of ["", "pub-1234567890123456", "1234", "ca-pub-1"]) {
      expect(getAdConfig("blog", "article-end", {...enabled, ADSENSE_PUBLISHER_ID: publisher})).toBeNull();
      expect(getAdsTxt({ADSENSE_PUBLISHER_ID: publisher})).toBeNull();
    }
    for (const slot of [undefined, "", "ca-pub-1234567890123456", "slot-1"]) {
      expect(getAdConfig("blog", "article-end", {...enabled, ADSENSE_BLOG_ARTICLE_END_SLOT: slot})).toBeNull();
    }
  });

  it("requires each global, policy, site and placement gate", () => {
    for (const key of ["ADS_ENABLED", "ADS_CONSENT_CONFIGURED", "ADS_BLOG_ENABLED", "ADS_BLOG_ARTICLE_END_ENABLED"]) {
      expect(getAdConfig("blog", "article-end", {...enabled, [key]: "false"})).toBeNull();
    }
    expect(getAdConfig("blog", "article-end", {...enabled, ADS_ENABLED: "1"})).toBeNull();
  });

  it("never enables development implicitly", () => {
    const dev = {...enabled, NODE_ENV: "development"};
    expect(getAdConfig("blog", "article-end", dev)).toBeNull();
    expect(getAdConfig("blog", "article-end", {...dev, ADS_ALLOW_DEVELOPMENT: "true"})).not.toBeNull();
  });

  it("isolates Guitar activation from Blog activation", () => {
    expect(getAdConfig("guitar", "song-end", enabled)).toBeNull();
    const guitar = {...enabled, ADS_BLOG_ENABLED: "false", ADS_GUITAR_ENABLED: "true", ADS_GUITAR_SONG_END_ENABLED: "true"};
    expect(getAdConfig("guitar", "song-end", guitar)?.unitId).toBe("1234");
    expect(getAdConfig("blog", "article-end", guitar)).toBeNull();
    expect(getAdConfig("guitar", "song-list", guitar)).toBeNull();
  });

  it("uses the environment override for both verification and seller authorization", () => {
    expect(getAdPublisherId(enabled)).toBe(enabled.ADSENSE_PUBLISHER_ID);
    expect(getAdsTxt(enabled)).toContain("google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0");
  });
});
