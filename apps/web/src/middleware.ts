import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isSupportedLocale } from "@/lib/site";

const PUBLIC_FILE = /\.(.*)$/;
const LOCALE_COOKIE_NAME = "site_locale";

function detectLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;

  if (cookieLocale && isSupportedLocale(cookieLocale)) {
    return cookieLocale;
  }

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
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE_NAME, firstSegment, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
    return response;
  }

  const locale = detectLocale(request);
  const nextUrl = request.nextUrl.clone();
  nextUrl.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;

  const response = NextResponse.redirect(nextUrl);
  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
