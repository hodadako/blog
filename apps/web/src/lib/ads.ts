export type AdSite = "blog" | "guitar";
export type AdPlacementName = "article-end" | "article-inline" | "post-list" | "records" | "design-lab" | "song-end" | "song-list";

export interface AdUnitConfig {
  publisherId: string;
  unitId: string;
  site: AdSite;
  placement: AdPlacementName;
}

type AdEnvironment = Record<string, string | undefined>;

// Account supplied by the owner. Environment overrides also update verification.
export const VERIFIED_ADSENSE_ACCOUNT = "ca-pub-2583784505029772";

const placements = {
  blog: {
    "article-end": { enabled: true, flag: "ADS_BLOG_ARTICLE_END_ENABLED", unit: "ADSENSE_BLOG_ARTICLE_END_SLOT" },
    "article-inline": { enabled: false, flag: "ADS_BLOG_ARTICLE_INLINE_ENABLED", unit: "ADSENSE_BLOG_ARTICLE_INLINE_SLOT" },
    "post-list": { enabled: false, flag: "ADS_BLOG_POST_LIST_ENABLED", unit: "ADSENSE_BLOG_POST_LIST_SLOT" },
    records: { enabled: false, flag: "ADS_BLOG_RECORDS_ENABLED", unit: "ADSENSE_BLOG_RECORDS_SLOT" },
    "design-lab": { enabled: false, flag: "ADS_BLOG_DESIGN_LAB_ENABLED", unit: "ADSENSE_BLOG_DESIGN_LAB_SLOT" },
  },
  guitar: {
    "song-end": { enabled: false, flag: "ADS_GUITAR_SONG_END_ENABLED", unit: "ADSENSE_GUITAR_SONG_END_SLOT" },
    "song-list": { enabled: false, flag: "ADS_GUITAR_SONG_LIST_ENABLED", unit: "ADSENSE_GUITAR_SONG_LIST_SLOT" },
  },
} as const;

function flag(value: string | undefined, fallback = false): boolean {
  return value === undefined ? fallback : value === "true";
}

export function getAdPublisherId(source: AdEnvironment = process.env): string | null {
  const value = source.ADSENSE_PUBLISHER_ID ?? VERIFIED_ADSENSE_ACCOUNT;
  return /^ca-pub-\d{16}$/.test(value) ? value : null;
}

export function getAdConfig(site: AdSite, placement: AdPlacementName, source: AdEnvironment = process.env): AdUnitConfig | null {
  const available: Partial<Record<AdPlacementName, { enabled: boolean; flag: string; unit: string }>> = placements[site];
  const position = available[placement];
  const publisherId = getAdPublisherId(source);
  const unitId = position ? source[position.unit] : undefined;
  if (!position || !publisherId || !unitId || !/^\d+$/.test(unitId)) return null;
  if (!flag(source.ADS_ENABLED) || !flag(source.ADS_CONSENT_CONFIGURED)) return null;
  if (source.NODE_ENV !== "production" && !flag(source.ADS_ALLOW_DEVELOPMENT)) return null;
  if (!flag(source[site === "blog" ? "ADS_BLOG_ENABLED" : "ADS_GUITAR_ENABLED"], site === "blog")) return null;
  if (!flag(source[position.flag], position.enabled)) return null;
  return { publisherId, unitId, site, placement };
}

export function getAdsTxt(source: AdEnvironment = process.env): string | null {
  const publisher = getAdPublisherId(source);
  if (!publisher) return null;
  return `google.com, ${publisher.slice(3)}, DIRECT, f08c47fec0942fa0\nsubdomain=guitar.hodako.dev\n`;
}
