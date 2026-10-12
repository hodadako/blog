import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isSupportedLocale } from "@/lib/site";
import { isGuitarHost, resolveGuitarPath } from "@/lib/guitar-routing";

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
  const host = request.headers.get("host");

  if (pathname === "/__design-lab" || pathname.startsWith("/__design-lab/") || pathname === "/api/design-lab") {
    return new NextResponse(null, {status: 404});
  }

  // Host routing must happen before locale redirects. Do not trust forwarded host
  // headers: the request Host is the routing contract configured at the edge.
  if (isGuitarHost(host, process.env.GUITAR_HOSTS)) {
    const decision = resolveGuitarPath(pathname);

    if (decision.kind === "not-found") return new NextResponse(null, { status: 404 });
    // next.config rewrites these public paths after middleware. Letting Next
    // perform that internal rewrite avoids a second locale middleware pass.
    if (decision.kind === "rewrite") return NextResponse.next();

    return NextResponse.next();
  }

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  if (/\.[^/]+$/.test(pathname)) return NextResponse.next();

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
  matcher: ["/((?!_next).*)"],
};
