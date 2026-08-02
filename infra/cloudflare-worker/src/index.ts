interface ChallengeClaims {
  v: 1;
  typ: "comment_quiz_challenge";
  slug: string;
  locale: "ko" | "en";
  left: number;
  right: number;
  iat: number;
  exp: number;
}

const SLUG_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,199}$/;

function encode(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return encode(String.fromCharCode(...new Uint8Array(signature)));
}

async function issueChallengeToken(claims: ChallengeClaims, secret: string): Promise<string> {
  const payload = encode(JSON.stringify(claims));
  return `${payload}.${await sign(payload, secret)}`;
}

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin");
  const allowedOrigin = origin === "https://hodako.dev" || origin === "https://www.hodako.dev"
    ? origin
    : "https://hodako.dev";

  return {
    "access-control-allow-origin": allowedOrigin,
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    "vary": "Origin",
  };
}

function json(request: Request, data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      ...corsHeaders(request),
      "cache-control": "no-store",
    },
  });
}

function randomOneToNine(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] % 9 + 1;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: corsHeaders(request) });
      }

      const url = new URL(request.url);

      if (request.method !== "GET" || url.pathname !== "/challenge") {
        return json(request, { error: "not-found" }, 404);
      }

      const slug = url.searchParams.get("slug") ?? "";
      const locale = url.searchParams.get("locale");

      if (!SLUG_PATTERN.test(slug) || (locale !== "ko" && locale !== "en")) {
        return json(request, { error: "invalid-request" }, 400);
      }

      const configuredTtl = Number(env.QUIZ_TTL_SECONDS || "300");
      const ttl = Number.isInteger(configuredTtl) ? Math.min(900, Math.max(60, configuredTtl)) : 300;
      const left = randomOneToNine();
      const right = randomOneToNine();
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + ttl;
      const challengeToken = await issueChallengeToken(
        {
          v: 1,
          typ: "comment_quiz_challenge",
          slug,
          locale,
          left,
          right,
          iat: now,
          exp: expiresAt,
        },
        env.QUIZ_TOKEN_SECRET,
      );

      return json(request, {
        prompt: `${left} + ${right} = ?`,
        challengeToken,
        expiresAt: new Date(expiresAt * 1000).toISOString(),
      });
    } catch (error) {
      console.error(JSON.stringify({
        message: "quiz worker request failed",
        error: error instanceof Error ? error.message : "unknown",
        path: new URL(request.url).pathname,
      }));
      return json(request, { error: "internal-error" }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
