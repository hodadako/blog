import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, isSupportedLocale } from "@/lib/site";

const PUBLIC_FILE = /\.(.*)$/;

function detectLocale(request: NextRequest): string {
  const preferred = request.headers.get("accept-language") ?? "";
  const normalized = preferred.toLowerCase();

  if (normalized.includes("ko")) {
    return "ko";
  }

  if (normalized.includes("en")) {
    return "en";
  }

  return DEFAULT_LOCALE;
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    PUBLIC_FILE.test(pathname) ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && isSupportedLocale(firstSegment)) {
    return NextResponse.next();
  }

  const locale = detectLocale(request);
  const nextUrl = request.nextUrl.clone();
  nextUrl.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;

  return NextResponse.redirect(nextUrl);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
