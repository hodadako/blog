import { hashCommentIp } from "@/lib/comments-crypto";

export function getTrustedClientIp(request: Request): string | null {
  const vercelForwardedFor = request.headers.get("x-vercel-forwarded-for");
  const vercelIp = vercelForwardedFor?.split(",")[0]?.trim();

  if (vercelIp) {
    return vercelIp;
  }

  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();

  if (cloudflareIp) {
    return cloudflareIp;
  }

  if (process.env.NODE_ENV !== "production") {
    return request.headers.get("x-real-ip")?.trim() || null;
  }

  return null;
}

export function getRequestSubjectHash(request: Request): string {
  const ip = getTrustedClientIp(request);

  if (ip) {
    return hashCommentIp(ip);
  }

  const fallback = `${request.headers.get("user-agent") ?? "unknown"}:${request.headers.get("accept-language") ?? "unknown"}`;
  return hashCommentIp(`missing-ip:${fallback}`);
}

export function safeRedirectPath(value: string, fallback: string): string {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  return value;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function isCanonicalSlug(value: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,199}$/.test(value);
}
