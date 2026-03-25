interface Env {
  QUIZ_TOKEN_SECRET: string;
  QUIZ_TTL_SECONDS: string;
}

interface ChallengeClaims {
  v: 1;
  typ: "comment_quiz_challenge";
  slug: string;
  locale: string;
  answer: string;
  iat: number;
  exp: number;
}

interface PassClaims {
  v: 1;
  typ: "comment_quiz_pass";
  slug: string;
  anonId: string;
  iat: number;
  exp: number;
  jti: string;
}

function encode(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decode(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return atob(padded);
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
  return encode(String.fromCharCode(...Array.from(new Uint8Array(signature))));
}

async function issueToken<T extends ChallengeClaims | PassClaims>(claims: T, secret: string): Promise<string> {
  const payload = encode(JSON.stringify(claims));
  const signature = await sign(payload, secret);
  return `${payload}.${signature}`;
}

async function verifyChallengeToken(token: string, secret: string): Promise<ChallengeClaims> {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    throw new Error("Malformed token.");
  }
  const expected = await sign(payload, secret);
  if (expected !== signature) {
    throw new Error("Signature mismatch.");
  }
  const claims = JSON.parse(decode(payload)) as ChallengeClaims;
  const now = Math.floor(Date.now() / 1000);
  if (claims.typ !== "comment_quiz_challenge" || claims.exp <= now) {
    throw new Error("Expired challenge.");
  }
  return claims;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return json({}, 204);
    }

    const url = new URL(request.url);
    const ttl = Number(env.QUIZ_TTL_SECONDS || "300");

    if (request.method === "GET" && url.pathname === "/challenge") {
      const slug = url.searchParams.get("slug") ?? "unknown";
      const locale = url.searchParams.get("locale") ?? "ko";
      const left = crypto.getRandomValues(new Uint32Array(1))[0] % 9 + 1;
      const right = crypto.getRandomValues(new Uint32Array(1))[0] % 9 + 1;
      const now = Math.floor(Date.now() / 1000);
      const prompt = `${left} + ${right} = ?`;
      const challengeToken = await issueToken(
        {
          v: 1,
          typ: "comment_quiz_challenge",
          slug,
          locale,
          answer: String(left + right),
          iat: now,
          exp: now + ttl,
        },
        env.QUIZ_TOKEN_SECRET,
      );
      return json({ prompt, challengeToken, expiresAt: new Date((now + ttl) * 1000).toISOString() });
    }

    if (request.method === "POST" && url.pathname === "/verify") {
      const body = (await request.json()) as {
        slug: string;
        challengeToken: string;
        answer: string;
      };
      const challenge = await verifyChallengeToken(body.challengeToken, env.QUIZ_TOKEN_SECRET);
      if (challenge.slug !== body.slug || challenge.answer !== body.answer.trim()) {
        return json({ error: "invalid-answer" }, 400);
      }
      const now = Math.floor(Date.now() / 1000);
      const verifiedToken = await issueToken(
        {
          v: 1,
          typ: "comment_quiz_pass",
          slug: challenge.slug,
          anonId: crypto.randomUUID(),
          iat: now,
          exp: now + ttl,
          jti: crypto.randomUUID(),
        },
        env.QUIZ_TOKEN_SECRET,
      );
      return json({ verifiedToken, expiresAt: new Date((now + ttl) * 1000).toISOString() });
    }

    return json({ error: "not-found" }, 404);
  },
};
