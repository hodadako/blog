const SLUG_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,199}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEX_PATTERN = /^[a-f0-9]{64}$/;
const MAX_JSON_BYTES = 64 * 1024;
const DEFAULT_TTL_SECONDS = 300;

type QuizOption = {
  id: string;
  text: string | null;
  imagePath: string | null;
  imageUrl?: string | null;
  altText: string | null;
  label: string | null;
};

type QuizChallengePayload = {
  challengeId: string;
  category: { code: string; name: string };
  question: { type: "TEXT_MULTIPLE_CHOICE" | "IMAGE_MULTIPLE_CHOICE"; prompt: string };
  options: QuizOption[];
  expiresAt: string;
};

type AuthorizationClaims = {
  v: 1;
  typ: "comment_write_authorization";
  purpose: "COMMENT_WRITE";
  canonicalSlug: string;
  iat: number;
  exp: number;
  jti: string;
};

type CommentInput = {
  canonicalSlug: string;
  content: string;
  password: string;
  parentId: string | null;
  author: string;
  authorizationToken: string;
  idempotencyKey: string;
};

type JsonRecord = Record<string, unknown>;

class SupabaseApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "SupabaseApiError";
    this.status = status;
    this.code = code;
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readRequiredString(value: unknown): string {
  return readString(value) ?? "";
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function isCanonicalSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function hexEncode(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

async function hmacBytes(secret: string, value: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return new Uint8Array(signature);
}

async function hmacHex(secret: string, value: string): Promise<string> {
  return hexEncode(await hmacBytes(secret, value));
}

async function signClaims(claims: AuthorizationClaims, secret: string): Promise<string> {
  const payload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(claims)));
  const signature = base64UrlEncode(await hmacBytes(secret, payload));
  return `${payload}.${signature}`;
}

async function verifyClaims(token: string, canonicalSlug: string, secret: string): Promise<AuthorizationClaims> {
  const [payload, signature] = token.split(".");
  if (!payload || !signature || payload.length > 8192 || signature.length > 256) {
    throw new Error("invalid-authorization");
  }

  let claims: unknown;
  try {
    claims = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
  } catch {
    throw new Error("invalid-authorization");
  }

  if (!isRecord(claims)
    || claims.v !== 1
    || claims.typ !== "comment_write_authorization"
    || claims.purpose !== "COMMENT_WRITE"
    || claims.canonicalSlug !== canonicalSlug
    || !isUuid(readRequiredString(claims.jti))
    || typeof claims.iat !== "number"
    || typeof claims.exp !== "number") {
    throw new Error("invalid-authorization");
  }

  const expected = await hmacBytes(secret, payload);
  let actual: Uint8Array;
  try {
    actual = base64UrlDecode(signature);
  } catch {
    throw new Error("invalid-authorization");
  }

  if (!constantTimeEqual(expected, actual) || claims.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error("invalid-authorization");
  }

  return claims as AuthorizationClaims;
}

function getAuthorizationSecret(env: Env): string {
  return env.COMMENT_AUTHORIZATION_SECRET || env.QUIZ_TOKEN_SECRET;
}

function getTtlSeconds(env: Env): number {
  const configured = Number(env.QUIZ_TTL_SECONDS || DEFAULT_TTL_SECONDS);
  return Number.isInteger(configured) ? Math.min(900, Math.max(60, configured)) : DEFAULT_TTL_SECONDS;
}

function getTrustedClientIp(request: Request): string {
  // Cloudflare strips/sets this value at the edge. User-controlled X-Forwarded-For
  // is deliberately ignored.
  return request.headers.get("CF-Connecting-IP")?.trim() || "unknown-client";
}

function getOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  return origin === "https://hodako.dev" || origin === "https://www.hodako.dev" || origin === "http://localhost:3000"
    ? origin
    : null;
}

function corsHeaders(request: Request): HeadersInit {
  const origin = getOrigin(request);
  return {
    ...(origin ? { "access-control-allow-origin": origin } : {}),
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type,x-admin-api-key",
    "access-control-max-age": "86400",
    "cache-control": "no-store",
    vary: "Origin",
  };
}

function json(request: Request, data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: corsHeaders(request) });
}

function empty(request: Request, status: number): Response {
  return new Response(null, { status, headers: corsHeaders(request) });
}

async function readJson(request: Request): Promise<unknown> {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > MAX_JSON_BYTES) {
    throw new Error("request-too-large");
  }

  const body = await request.text();
  if (body.length > MAX_JSON_BYTES) {
    throw new Error("request-too-large");
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new Error("invalid-json");
  }
}

async function supabaseRequest(env: Env, path: string, init: RequestInit = {}): Promise<unknown> {
  const baseUrl = env.SUPABASE_URL.replace(/\/$/, "");
  const headers = new Headers(init.headers);
  headers.set("apikey", env.SUPABASE_SERVICE_ROLE_KEY);
  headers.set("authorization", `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`);
  headers.set("content-type", "application/json");
  headers.set("accept", "application/json");

  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...init,
    headers,
  });
  const text = await response.text();
  if (text.length > 2 * 1024 * 1024) {
    throw new SupabaseApiError("supabase-response-too-large", 502);
  }

  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const record = isRecord(payload) ? payload : {};
    throw new SupabaseApiError(
      readString(record.message) ?? readString(record.hint) ?? "supabase-request-failed",
      response.status,
      readString(record.code) ?? undefined,
    );
  }

  return payload;
}

async function supabaseRpc(env: Env, functionName: string, args: JsonRecord): Promise<unknown> {
  return supabaseRequest(env, `rpc/${functionName}`, {
    method: "POST",
    body: JSON.stringify(args),
  });
}

async function consumeRateLimit(env: Env, action: string, subjectHash: string, limit: number, windowSeconds: number): Promise<boolean> {
  const result = await supabaseRpc(env, "consume_comment_rate_limit", {
    input_action: action,
    input_subject_hash: subjectHash,
    input_limit: limit,
    input_window_seconds: windowSeconds,
  });
  return result === true;
}

async function hashClientIp(request: Request, env: Env): Promise<string> {
  return hmacHex(env.IP_HASH_SECRET, getTrustedClientIp(request));
}

function buildImageUrl(env: Env, imagePath: string | null): string | null {
  if (!imagePath) {
    return null;
  }
  if (/^https:\/\//.test(imagePath)) {
    return imagePath;
  }
  const base = env.QUIZ_IMAGE_BASE_URL.replace(/\/$/, "");
  return `${base}/${imagePath.replace(/^\//, "")}`;
}

function parseChallengePayload(value: unknown): QuizChallengePayload {
  if (!isRecord(value)
    || !isUuid(readRequiredString(value.challengeId))
    || !isRecord(value.category)
    || !isRecord(value.question)
    || !Array.isArray(value.options)
    || typeof value.expiresAt !== "string") {
    throw new Error("invalid-challenge-response");
  }

  const categoryCode = readString(value.category.code);
  const categoryName = readString(value.category.name);
  const questionType = readString(value.question.type);
  const prompt = readString(value.question.prompt);
  if (!categoryCode || !categoryName || !prompt || (questionType !== "TEXT_MULTIPLE_CHOICE" && questionType !== "IMAGE_MULTIPLE_CHOICE")) {
    throw new Error("invalid-challenge-response");
  }

  const options: QuizOption[] = [];
  for (const option of value.options) {
    if (!isRecord(option) || !isUuid(readRequiredString(option.id))) {
      throw new Error("invalid-challenge-response");
    }
    options.push({
      id: readRequiredString(option.id),
      text: readString(option.text),
      imagePath: readString(option.imagePath),
      altText: readString(option.altText),
      label: readString(option.label),
    });
  }
  if (options.length !== 5) {
    throw new Error("invalid-challenge-response");
  }

  return {
    challengeId: readRequiredString(value.challengeId),
    category: { code: categoryCode, name: categoryName },
    question: { type: questionType, prompt },
    options,
    expiresAt: value.expiresAt,
  };
}

function toPublicChallenge(env: Env, value: unknown): QuizChallengePayload {
  const payload = parseChallengePayload(value);
  return {
    ...payload,
    options: payload.options.map((option) => ({
      id: option.id,
      text: option.text,
      imagePath: null,
      imageUrl: buildImageUrl(env, option.imagePath),
      altText: option.altText,
      label: option.label,
    })),
  };
}

function getRpcRow(value: unknown): JsonRecord | null {
  if (Array.isArray(value) && value.length > 0 && isRecord(value[0])) {
    return value[0];
  }
  return isRecord(value) ? value : null;
}

function mapSupabaseError(error: unknown): { status: number; code: string } {
  const message = error instanceof SupabaseApiError ? error.message : error instanceof Error ? error.message : "request-failed";
  if (message.includes("rate-limited")) return { status: 429, code: "rate-limited" };
  if (message.includes("incorrect") || message.includes("not-allowed")) return { status: 401, code: "quiz-answer-incorrect" };
  if (message.includes("invite")) return { status: 401, code: "invalid-invite-token" };
  if (message.includes("post-not-found")) return { status: 404, code: "post-not-found" };
  if (message.includes("no-quiz")) return { status: 409, code: "no-quiz-available" };
  if (message.includes("expired") || message.includes("used") || message.includes("authorization")) return { status: 401, code: "invalid-authorization" };
  if (message.includes("parent")) return { status: 422, code: "invalid-parent-comment" };
  if (message.includes("duplicate")) return { status: 409, code: "duplicate-comment" };
  if (message.includes("idempotency")) return { status: 409, code: "idempotency-conflict" };
  return { status: 500, code: "internal-error" };
}

function hashCommentRequest(input: CommentInput, secret: string): Promise<string> {
  return hmacHex(secret, JSON.stringify({
    canonicalSlug: input.canonicalSlug,
    parentId: input.parentId,
    author: input.author.trim(),
    content: input.content.trim(),
    password: input.password,
  }));
}

async function hashCommentPassword(password: string, pepper: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`${password}${pepper}`),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const iterations = 120_000;
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    256,
  );
  return `pbkdf2-sha256$${iterations}$${base64UrlEncode(salt)}$${base64UrlEncode(new Uint8Array(bits))}`;
}

async function verifyCommentPassword(password: string, storedHash: string, pepper: string): Promise<boolean> {
  const [algorithm, iterationText, saltText, expectedText] = storedHash.split("$");
  const iterations = Number(iterationText);
  if (algorithm !== "pbkdf2-sha256" || !Number.isInteger(iterations) || iterations < 100_000 || iterations > 500_000 || !saltText || !expectedText) {
    return false;
  }
  try {
    const salt = base64UrlDecode(saltText);
    const saltBuffer = new ArrayBuffer(salt.byteLength);
    new Uint8Array(saltBuffer).set(salt);
    const expected = base64UrlDecode(expectedText);
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(`${password}${pepper}`), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: saltBuffer, iterations, hash: "SHA-256" }, key, expected.length * 8);
    return constantTimeEqual(expected, new Uint8Array(bits));
  } catch {
    return false;
  }
}

function isValidCommentInput(value: JsonRecord): value is JsonRecord & CommentInput {
  const canonicalSlug = readRequiredString(value.canonicalSlug);
  const content = readRequiredString(value.content);
  const password = readRequiredString(value.password);
  const author = readRequiredString(value.author);
  const authorizationToken = readRequiredString(value.authorizationToken);
  const idempotencyKey = readRequiredString(value.idempotencyKey);
  const parentId = value.parentId === null || value.parentId === undefined ? null : readRequiredString(value.parentId);
  return isCanonicalSlug(canonicalSlug)
    && content.trim().length >= 1 && content.trim().length <= 5000
    && password.length >= 8 && password.length <= 72
    && author.trim().length >= 1 && author.trim().length <= 80
    && authorizationToken.length >= 64 && authorizationToken.length <= 4096
    && isUuid(idempotencyKey)
    && (parentId === null || isUuid(parentId));
}

async function handleChallengeIssue(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  if (!isRecord(body) || !isCanonicalSlug(readRequiredString(body.canonicalSlug))) {
    return json(request, { error: "invalid-request" }, 400);
  }
  const canonicalSlug = readRequiredString(body.canonicalSlug);
  const ipHash = await hashClientIp(request, env);
  if (!(await consumeRateLimit(env, "quiz:challenge", ipHash, 10, 300))) {
    return json(request, { error: "rate-limited" }, 429);
  }
  const result = await supabaseRpc(env, "issue_quiz_challenge", {
    input_canonical_slug: canonicalSlug,
    input_requester_ip_hash: ipHash,
    input_ttl_seconds: getTtlSeconds(env),
  });
  return json(request, toPublicChallenge(env, result));
}

async function handleCreateComment(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  if (!isRecord(body) || !isValidCommentInput(body)) {
    return json(request, { error: "invalid-comment-input" }, 400);
  }
  const input = body as CommentInput;
  let claims: AuthorizationClaims;
  try {
    claims = await verifyClaims(input.authorizationToken, input.canonicalSlug, getAuthorizationSecret(env));
  } catch {
    return json(request, { error: "invalid-authorization" }, 401);
  }
  const ipHash = await hashClientIp(request, env);
  const requestHash = await hashCommentRequest(input, env.COMMENT_PASSWORD_PEPPER);
  const passwordHash = await hashCommentPassword(input.password, env.COMMENT_PASSWORD_PEPPER);
  try {
    const result = await supabaseRpc(env, "create_comment_with_authorization", {
      input_authorization_id: claims.jti,
      input_canonical_slug: input.canonicalSlug,
      input_idempotency_key: input.idempotencyKey,
      input_request_hash: requestHash,
      input_parent_id: input.parentId,
      input_author_name: input.author,
      input_body_markdown: input.content,
      input_password_hash: passwordHash,
      input_ip_hash: ipHash,
    });
    const row = getRpcRow(result);
    const commentId = row ? readString(row.comment_id) : null;
    if (!commentId || !isUuid(commentId)) {
      throw new Error("invalid-comment-response");
    }
    return json(request, { commentId, replayed: row?.replayed === true }, 201);
  } catch (error) {
    const mapped = mapSupabaseError(error);
    return json(request, { error: mapped.code }, mapped.status);
  }
}

async function handleListComments(request: Request, env: Env, canonicalSlug: string): Promise<Response> {
  if (!isCanonicalSlug(canonicalSlug)) {
    return json(request, { error: "invalid-request" }, 400);
  }
  const query = new URLSearchParams({
    canonical_slug: `eq.${canonicalSlug}`,
    status: "in.(published,deleted)",
    order: "created_at.asc",
    limit: "500",
  });
  const result = await supabaseRequest(env, `comments_with_thread?${query.toString()}`);
  return json(request, Array.isArray(result) ? result : []);
}

async function handleCommentMutation(request: Request, env: Env, commentId: string): Promise<Response> {
  if (!isUuid(commentId)) {
    return json(request, { error: "invalid-request" }, 400);
  }
  const body = await readJson(request);
  if (!isRecord(body)) {
    return json(request, { error: "invalid-request" }, 400);
  }
  const password = readRequiredString(body.password);
  const content = readString(body.content);
  if (password.length < 8 || password.length > 72 || (request.method === "PATCH" && (!content || content.trim().length > 5000))) {
    return json(request, { error: "invalid-input" }, 400);
  }
  const query = new URLSearchParams({
    id: `eq.${commentId}`,
    select: "id,status,password_hash,canonical_slug,ip_hash",
    limit: "1",
  });
  const rows = await supabaseRequest(env, `comments_admin_with_thread?${query.toString()}`);
  const row = Array.isArray(rows) && isRecord(rows[0]) ? rows[0] : null;
  if (!row || row.status !== "published") {
    return json(request, { error: "comment-not-found" }, 404);
  }
  if (!(await verifyCommentPassword(password, readRequiredString(row.password_hash), env.COMMENT_PASSWORD_PEPPER))) {
    return json(request, { error: "comment-auth-failed" }, 401);
  }

  const update = request.method === "PATCH"
    ? { body_markdown: content?.trim(), body_html: content?.trim(), updated_at: new Date().toISOString() }
    : { status: "deleted", deleted_at: new Date().toISOString(), body_markdown: "", body_html: "", updated_at: new Date().toISOString() };
  await supabaseRequest(env, `comments?id=eq.${commentId}&status=eq.published`, {
    method: "PATCH",
    headers: { prefer: "return=minimal" },
    body: JSON.stringify(update),
  });
  return json(request, { ok: true, canonicalSlug: readRequiredString(row.canonical_slug) });
}

function isAdminRequest(request: Request, env: Env): boolean {
  const provided = request.headers.get("x-admin-api-key") ?? "";
  const expected = env.ADMIN_API_SECRET ?? "";
  return Boolean(expected) && constantTimeEqual(new TextEncoder().encode(provided), new TextEncoder().encode(expected));
}

async function handleAdmin(request: Request, env: Env, pathname: string): Promise<Response> {
  if (!isAdminRequest(request, env)) {
    return json(request, { error: "unauthorized" }, 401);
  }
  if (pathname === "/admin/comments" && request.method === "GET") {
    const result = await supabaseRequest(env, "comments_admin_with_thread?order=created_at.desc&limit=500");
    return json(request, Array.isArray(result) ? result : []);
  }
  if (pathname.startsWith("/admin/comments/") && request.method === "PATCH") {
    const commentId = pathname.slice("/admin/comments/".length);
    if (!isUuid(commentId)) return json(request, { error: "invalid-id" }, 400);
    const body = await readJson(request);
    if (!isRecord(body)) return json(request, { error: "invalid-input" }, 400);
    if (body.blacklist === true) {
      const rows = await supabaseRequest(env, `comments_admin_with_thread?id=eq.${commentId}&select=ip_hash&limit=1`);
      const ipHash = Array.isArray(rows) && isRecord(rows[0]) ? readString(rows[0].ip_hash) : null;
      if (!ipHash || !HEX_PATTERN.test(ipHash)) return json(request, { error: "comment-ip-unavailable" }, 422);
      await supabaseRequest(env, "comment_ip_blacklist", { method: "POST", headers: { prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ ip_hash: ipHash, source_comment_id: commentId }) });
    } else {
      const status = readString(body.status);
      if (status !== "published" && status !== "hidden" && status !== "deleted") return json(request, { error: "invalid-status" }, 400);
      const update = status === "deleted" ? { status, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() } : { status, deleted_at: null, updated_at: new Date().toISOString() };
      await supabaseRequest(env, `comments?id=eq.${commentId}`, { method: "PATCH", headers: { prefer: "return=minimal" }, body: JSON.stringify(update) });
    }
    return json(request, { ok: true });
  }
  if (pathname === "/admin/invite-tokens" && request.method === "GET") {
    const result = await supabaseRequest(env, "invite_tokens?select=id,label,is_active,created_at,revoked_at&order=created_at.desc&limit=500");
    return json(request, Array.isArray(result) ? result : []);
  }
  if (pathname === "/admin/invite-tokens" && request.method === "POST") {
    const body = await readJson(request);
    const label = isRecord(body) ? readRequiredString(body.label).trim() : "";
    if (label.length < 1 || label.length > 80) return json(request, { error: "invalid-label" }, 400);
    const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = base64UrlEncode(tokenBytes);
    const tokenHash = await hmacHex(env.INVITE_TOKEN_PEPPER, `invite-token:${token}`);
    const result = await supabaseRequest(env, "invite_tokens?select=id,label,is_active,created_at,revoked_at", { method: "POST", headers: { prefer: "return=representation" }, body: JSON.stringify({ label, token_hash: tokenHash }) });
    const row = Array.isArray(result) && isRecord(result[0]) ? result[0] : null;
    return json(request, { item: row, token }, 201);
  }
  if (pathname === "/admin/invite-tokens" && request.method === "DELETE") {
    const body = await readJson(request);
    const id = isRecord(body) ? readRequiredString(body.id) : "";
    if (!isUuid(id)) return json(request, { error: "invalid-id" }, 400);
    await supabaseRequest(env, `invite_tokens?id=eq.${id}`, { method: "PATCH", headers: { prefer: "return=minimal" }, body: JSON.stringify({ is_active: false, revoked_at: new Date().toISOString() }) });
    return empty(request, 204);
  }
  if (pathname === "/admin/quiz/questions" && request.method === "GET") {
    const [categories, questions, options] = await Promise.all([
      supabaseRequest(env, "quiz_categories?select=id,code,name,description,active&order=code.asc&limit=200"),
      supabaseRequest(env, "quiz_questions?select=id,category_id,type,prompt,explanation,difficulty,active,version&order=created_at.desc&limit=1000"),
      supabaseRequest(env, "quiz_options?select=id,question_id,text,image_path,alt_text,label,is_correct,display_order&order=display_order.asc&limit=5000"),
    ]);
    return json(request, {
      categories: Array.isArray(categories) ? categories : [],
      questions: Array.isArray(questions) ? questions : [],
      options: Array.isArray(options) ? options : [],
    });
  }
  if (pathname === "/admin/quiz/questions" && request.method === "POST") {
    const body = await readJson(request);
    if (!isRecord(body) || !Array.isArray(body.options) || body.options.length !== 5) {
      return json(request, { error: "invalid-quiz-question-input" }, 400);
    }
    const categoryCode = readRequiredString(body.categoryCode).trim().toUpperCase();
    const type = readRequiredString(body.type);
    const prompt = readRequiredString(body.prompt).trim();
    const questionId = body.questionId === null || body.questionId === undefined ? null : readRequiredString(body.questionId);
    const difficulty = typeof body.difficulty === "number" ? body.difficulty : 1;
    if (!/^[A-Z][A-Z0-9_]*$/.test(categoryCode) || (questionId !== null && !isUuid(questionId)) || (type !== "TEXT_MULTIPLE_CHOICE" && type !== "IMAGE_MULTIPLE_CHOICE") || prompt.length < 1 || prompt.length > 1000 || !Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
      return json(request, { error: "invalid-quiz-question-input" }, 400);
    }
    const result = await supabaseRpc(env, "upsert_quiz_question_with_options", {
      input_question_id: questionId,
      input_category_code: categoryCode,
      input_type: type,
      input_prompt: prompt,
      input_explanation: readRequiredString(body.explanation),
      input_difficulty: difficulty,
      input_active: body.active !== false,
      input_options: body.options,
    });
    return json(request, result, 201);
  }
  if (pathname === "/admin/quiz/categories" && request.method === "GET") {
    const result = await supabaseRequest(env, "quiz_categories?select=id,code,name,description,active&order=code.asc&limit=200");
    return json(request, Array.isArray(result) ? result : []);
  }
  if (pathname === "/admin/quiz/categories" && request.method === "POST") {
    const body = await readJson(request);
    const code = isRecord(body) ? readRequiredString(body.code).trim().toUpperCase() : "";
    const name = isRecord(body) ? readRequiredString(body.name).trim() : "";
    const description = isRecord(body) ? readRequiredString(body.description).trim() : "";
    if (!/^[A-Z][A-Z0-9_]*$/.test(code) || code.length < 2 || code.length > 32 || name.length < 1 || name.length > 80 || description.length > 500) {
      return json(request, { error: "invalid-category-input" }, 400);
    }
    const result = await supabaseRequest(env, "quiz_categories?select=id,code,name,description,active", { method: "POST", headers: { prefer: "return=representation" }, body: JSON.stringify({ code, name, description }) });
    return json(request, Array.isArray(result) ? result[0] : result, 201);
  }
  const categoryMatch = pathname.match(/^\/admin\/quiz\/categories\/([^/]+)$/);
  if (categoryMatch && request.method === "PATCH") {
    const categoryId = categoryMatch[1];
    if (!isUuid(categoryId)) return json(request, { error: "invalid-id" }, 400);
    const body = await readJson(request);
    if (!isRecord(body)) return json(request, { error: "invalid-category-input" }, 400);
    const update: JsonRecord = {};
    if (typeof body.name === "string") update.name = body.name.trim();
    if (typeof body.description === "string") update.description = body.description.trim();
    if (typeof body.active === "boolean") update.active = body.active;
    if (Object.keys(update).length === 0) return json(request, { error: "invalid-category-input" }, 400);
    await supabaseRequest(env, `quiz_categories?id=eq.${categoryId}`, { method: "PATCH", headers: { prefer: "return=minimal" }, body: JSON.stringify(update) });
    return json(request, { ok: true });
  }
  return json(request, { error: "not-found" }, 404);
}

async function handlePostViews(request: Request, env: Env, canonicalSlug: string): Promise<Response> {
  if (!isCanonicalSlug(canonicalSlug)) return json(request, { error: "invalid-request" }, 400);
  if (request.method === "GET") {
    const query = new URLSearchParams({ canonical_slug: `eq.${canonicalSlug}`, select: "view_count", limit: "1" });
    const rows = await supabaseRequest(env, `post_threads?${query.toString()}`);
    const row = Array.isArray(rows) && isRecord(rows[0]) ? rows[0] : null;
    return json(request, { viewCount: typeof row?.view_count === "number" ? row.view_count : 0 });
  }
  const result = await supabaseRpc(env, "increment_post_view_count", { input_canonical_slug: canonicalSlug });
  const viewCount = typeof result === "number" ? result : Number(result);
  return json(request, { viewCount: Number.isFinite(viewCount) ? viewCount : 0 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      if (request.method === "OPTIONS") {
        return empty(request, 204);
      }

      const url = new URL(request.url);
      const pathname = url.pathname;

      if (pathname === "/quiz/challenges" && request.method === "POST") {
        return await handleChallengeIssue(request, env);
      }
      const verifyMatch = pathname.match(/^\/quiz\/challenges\/([^/]+)\/verify$/);
      if (verifyMatch && request.method === "POST") {
        const body = await readJson(request);
        if (!isRecord(body) || !isUuid(readRequiredString(body.selectedOptionId))) {
          return json(request, { error: "invalid-request" }, 400);
        }
        const challengeId = verifyMatch[1];
        const ipHash = await hashClientIp(request, env);
        if (!(await consumeRateLimit(env, "quiz:verify", ipHash, 20, 300))) {
          return json(request, { error: "rate-limited" }, 429);
        }
        const result = await supabaseRpc(env, "verify_quiz_challenge_and_issue_authorization", {
          input_challenge_id: challengeId,
          input_selected_option_id: readRequiredString(body.selectedOptionId),
          input_requester_ip_hash: ipHash,
          input_ttl_seconds: getTtlSeconds(env),
        });
        const row = getRpcRow(result);
        const outcome = row ? readString(row.outcome) : null;
        if (outcome === "INCORRECT") {
          return json(request, { error: "quiz-answer-incorrect" }, 401);
        }
        if (outcome === "EXPIRED") {
          return json(request, { error: "challenge-expired-or-used" }, 401);
        }
        const authorizationId = row ? readString(row.authorization_id) : null;
        const canonicalSlug = row ? readString(row.canonical_slug) : null;
        const expiresAt = row ? readString(row.expires_at) : null;
        if (!authorizationId || !canonicalSlug || !expiresAt || !isUuid(authorizationId) || !isCanonicalSlug(canonicalSlug)) {
          throw new Error("invalid-authorization-response");
        }
        const now = Math.floor(Date.now() / 1000);
        const authorizationToken = await signClaims({ v: 1, typ: "comment_write_authorization", purpose: "COMMENT_WRITE", canonicalSlug, iat: now, exp: Math.floor(new Date(expiresAt).getTime() / 1000), jti: authorizationId }, getAuthorizationSecret(env));
        return json(request, { authorizationToken, expiresAt }, 201);
      }
      if (pathname === "/comment-authorizations" && request.method === "POST") {
        const body = await readJson(request);
        if (!isRecord(body) || !isCanonicalSlug(readRequiredString(body.canonicalSlug)) || !readRequiredString(body.inviteToken)) {
          return json(request, { error: "invalid-request" }, 400);
        }
        const canonicalSlug = readRequiredString(body.canonicalSlug);
        const ipHash = await hashClientIp(request, env);
        if (!(await consumeRateLimit(env, "invite:verify", ipHash, 10, 300))) {
          return json(request, { error: "rate-limited" }, 429);
        }
        const token = readRequiredString(body.inviteToken);
        if (token.length < 32 || token.length > 256) return json(request, { error: "invalid-invite-token" }, 401);
        let result: unknown;
        try {
          result = await supabaseRpc(env, "issue_invite_comment_authorization", { input_canonical_slug: canonicalSlug, input_token_hash: await hmacHex(env.INVITE_TOKEN_PEPPER, `invite-token:${token}`), input_ttl_seconds: getTtlSeconds(env) });
        } catch (error) {
          if (!env.QUIZ_TOKEN_SECRET || env.QUIZ_TOKEN_SECRET === env.INVITE_TOKEN_PEPPER) throw error;
          result = await supabaseRpc(env, "issue_invite_comment_authorization", { input_canonical_slug: canonicalSlug, input_token_hash: await hmacHex(env.QUIZ_TOKEN_SECRET, `invite-token:${token}`), input_ttl_seconds: getTtlSeconds(env) });
        }
        const row = getRpcRow(result);
        const authorizationId = row ? readString(row.authorization_id) : null;
        const expiresAt = row ? readString(row.expires_at) : null;
        if (!authorizationId || !expiresAt || !isUuid(authorizationId)) throw new Error("invalid-authorization-response");
        const now = Math.floor(Date.now() / 1000);
        const authorizationToken = await signClaims({ v: 1, typ: "comment_write_authorization", purpose: "COMMENT_WRITE", canonicalSlug, iat: now, exp: Math.floor(new Date(expiresAt).getTime() / 1000), jti: authorizationId }, getAuthorizationSecret(env));
        return json(request, { authorizationToken, expiresAt }, 201);
      }
      if (pathname === "/comments" && request.method === "GET") {
        return await handleListComments(request, env, url.searchParams.get("canonicalSlug")?.trim() ?? "");
      }
      if (pathname === "/comments" && request.method === "POST") {
        return await handleCreateComment(request, env);
      }
      const commentMutation = pathname.match(/^\/comments\/([^/]+)$/);
      if (commentMutation && (request.method === "PATCH" || request.method === "DELETE")) {
        return await handleCommentMutation(request, env, commentMutation[1]);
      }
      if (pathname.startsWith("/admin/")) {
        if (pathname === "/admin/login-attempt" && request.method === "POST") {
          const ipHash = await hashClientIp(request, env);
          const allowed = await consumeRateLimit(env, "admin:login", ipHash, 5, 900);
          return allowed ? empty(request, 204) : json(request, { error: "rate-limited" }, 429);
        }
        return await handleAdmin(request, env, pathname);
      }
      const viewsMatch = pathname.match(/^\/post-views\/([^/]+)$/);
      if (viewsMatch && (request.method === "GET" || request.method === "POST")) {
        return await handlePostViews(request, env, viewsMatch[1]);
      }
      // The old arithmetic endpoint is intentionally gone. Clients must use the
      // persisted five-option challenge flow above.
      if (pathname === "/challenge") {
        return json(request, { error: "legacy-challenge-disabled" }, 410);
      }
      return json(request, { error: "not-found" }, 404);
    } catch (error) {
      const mapped = mapSupabaseError(error);
      console.error(JSON.stringify({
        message: "quiz worker request failed",
        error: error instanceof Error ? error.message : "unknown",
        status: mapped.status,
        path: new URL(request.url).pathname,
      }));
      return json(request, { error: mapped.status === 500 ? "internal-error" : mapped.code }, mapped.status);
    }
  },
} satisfies ExportedHandler<Env>;
