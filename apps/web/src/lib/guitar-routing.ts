const DEFAULT_GUITAR_HOSTS = ["guitar.hodako.dev", "guitar.localhost"];

function normalizeHost(host: string | null | undefined): string {
  return (host ?? "").trim().toLowerCase().replace(/:\d+$/, "");
}

export function getGuitarHosts(configuredHosts?: string): ReadonlySet<string> {
  const configured = configuredHosts
    ?.split(",")
    .map((host) => normalizeHost(host))
    .filter(Boolean);

  return new Set(configured?.length ? configured : DEFAULT_GUITAR_HOSTS);
}

export function isGuitarHost(host: string | null | undefined, configuredHosts?: string): boolean {
  return getGuitarHosts(configuredHosts).has(normalizeHost(host));
}

export type GuitarRouteDecision =
  | { kind: "rewrite"; pathname: string }
  | { kind: "pass" }
  | { kind: "not-found" };

const GUITAR_PUBLIC_ASSET = /^\/(?:favicon\.ico|fonts\/[^/]+\/[^/]+\/[^/]+|images\/[^/]+)$/;

export function resolveGuitarPath(pathname: string): GuitarRouteDecision {
  if (pathname === "/") return { kind: "rewrite", pathname: "/guitar" };
  if (pathname === "/songs") return { kind: "rewrite", pathname: "/guitar/songs" };

  const songMatch = pathname.match(/^\/songs\/([a-z0-9-]+--[a-z0-9-]+)$/);
  if (songMatch) return { kind: "rewrite", pathname: `/guitar/songs/${songMatch[1]}` };

  if (pathname === "/sitemap.xml" || pathname === "/robots.txt" || pathname.startsWith("/_next/")) {
    return { kind: "pass" };
  }

  if (GUITAR_PUBLIC_ASSET.test(pathname)) return { kind: "pass" };

  return { kind: "not-found" };
}

export function getGuitarRedirectExclusionPattern(configuredHosts?: string): string {
  const hosts = [...getGuitarHosts(configuredHosts)];
  const escaped = hosts.map((host) => host.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return `^(?!(${escaped.join("|")})(?::\\d+)?$).+$`;
}
