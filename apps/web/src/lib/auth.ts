import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SessionClaims } from "@/lib/types";
import { requireAdminSecrets } from "@/lib/env";

export const ADMIN_SESSION_COOKIE = "blog_admin_session";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function secureCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function issueAdminSession(): string {
  const { sessionSecret } = requireAdminSecrets();
  const now = Math.floor(Date.now() / 1000);
  const claims: SessionClaims = {
    sub: "admin",
    iat: now,
    exp: now + ADMIN_SESSION_MAX_AGE_SECONDS,
  };
  const payload = base64UrlEncode(JSON.stringify(claims));
  const signature = sign(payload, sessionSecret);
  return `${payload}.${signature}`;
}

export function verifyAdminSession(token: string | undefined): SessionClaims | null {
  if (!token) {
    return null;
  }

  const { sessionSecret } = requireAdminSecrets();
  const [payload, signature] = token.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload, sessionSecret);

  if (!secureCompare(signature, expected)) {
    return null;
  }

  const claims = JSON.parse(base64UrlDecode(payload)) as SessionClaims;
  const now = Math.floor(Date.now() / 1000);

  if (claims.sub !== "admin" || claims.exp <= now) {
    return null;
  }

  return claims;
}

export function readAdminSessionFromCookieHeader(cookieHeader: string | null): SessionClaims | null {
  if (!cookieHeader) {
    return null;
  }

  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`));

  if (!match) {
    return null;
  }

  return verifyAdminSession(match.slice(`${ADMIN_SESSION_COOKIE}=`.length));
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value) !== null;
}

export async function requireAdmin(locale: string): Promise<void> {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect(`/${locale}/admin/login?error=unauthorized`);
  }
}

export function verifyAdminPassword(password: string): boolean {
  const { password: adminPassword } = requireAdminSecrets();
  return secureCompare(password, adminPassword);
}

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  };
}

export function serializeAdminSessionCookie(token: string): string {
  const options = adminSessionCookieOptions();
  const secure = options.secure ? "; Secure" : "";
  return `${ADMIN_SESSION_COOKIE}=${token}; Path=${options.path}; HttpOnly; SameSite=${options.sameSite}; Max-Age=${options.maxAge}${secure}`;
}

export function serializeAdminSessionDeletionCookie(): string {
  return `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
