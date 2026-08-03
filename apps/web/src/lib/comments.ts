import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { requireCommentPepper, requireQuizSecret } from "@/lib/env";
import type { CommentItem, CommentModerationItem, CommentQuizItem, CommentStatus, InviteTokenItem } from "@/lib/types";

interface PostThreadRecord {
  id: string;
  canonical_slug: string;
}

interface CommentRow {
  id: string;
  parent_id: string | null;
  author_name: string;
  body_markdown: string;
  status: CommentStatus;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  password_hash: string;
  canonical_slug: string;
  ip_hash: string | null;
}

interface CommentAuthorizationRow {
  id: string;
  expires_at: string;
}

interface InviteTokenRow {
  id: string;
  label: string;
  is_active: boolean;
  created_at: string;
  revoked_at: string | null;
}

interface CommentQuizRow {
  canonical_slug: string;
  prompt: string;
  answer_hashes: string[];
  is_active: boolean;
  updated_at: string;
}

interface BlacklistRow {
  ip_hash: string;
}

function formatPasswordHash(salt: Buffer, hash: Buffer): string {
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

function parsePasswordHash(value: string): { salt: Buffer; hash: Buffer } {
  const [algorithm, salt, hash] = value.split("$");

  if (algorithm !== "scrypt" || !salt || !hash) {
    throw new Error("Unsupported password hash format.");
  }

  return {
    salt: Buffer.from(salt, "hex"),
    hash: Buffer.from(hash, "hex"),
  };
}

export function hashCommentPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(`${password}${requireCommentPepper()}`, salt, 64);
  return formatPasswordHash(salt, hash);
}

export function verifyCommentPassword(password: string, passwordHash: string): boolean {
  const { salt, hash } = parsePasswordHash(passwordHash);
  const candidate = scryptSync(`${password}${requireCommentPepper()}`, salt, 64);
  return timingSafeEqual(hash, candidate);
}

function getSupabaseErrorCode(error: { code?: string } | null): string | undefined {
  return error?.code;
}

export { hashCommentIp } from "@/lib/comments-crypto";

export function hashCommentRequest(input: {
  slug: string;
  parentId: string | null;
  authorName: string;
  content: string;
  password: string;
}): string {
  return createHmac("sha256", requireCommentPepper()).update(JSON.stringify(input)).digest("hex");
}

function hashInviteToken(token: string): string {
  return createHmac("sha256", requireQuizSecret()).update(`invite-token:${token}`).digest("hex");
}

export function normalizeQuizAnswer(answer: string): string {
  return answer.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("ko-KR");
}

function hashQuizAnswer(answer: string): string {
  return createHmac("sha256", requireQuizSecret())
    .update(`quiz-answer-v1:${normalizeQuizAnswer(answer)}`)
    .digest("hex");
}

export function formatIpHashPreview(ipHash: string | null): string | null {
  if (!ipHash) {
    return null;
  }

  return `${ipHash.slice(0, 10)}…`;
}

export async function isBlockedIpHash(ipHash: string | null): Promise<boolean> {
  if (!ipHash) {
    return false;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("comment_ip_blacklist")
    .select("ip_hash")
    .eq("ip_hash", ipHash)
    .maybeSingle();

  if (getSupabaseErrorCode(error) === "42P01") {
    return false;
  }

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function getOrCreatePostThread(slug: string): Promise<PostThreadRecord> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("post_threads")
    .upsert({ canonical_slug: slug }, { onConflict: "canonical_slug" })
    .select("id, canonical_slug")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function normalizeCommentContent(row: CommentRow): string {
  if (row.status === "deleted" || row.deleted_at) {
    return "[deleted]";
  }

  return row.body_markdown;
}

function buildCommentTree(rows: CommentRow[]): CommentItem[] {
  const map = new Map<string, CommentItem>();

  rows.forEach((row) => {
    map.set(row.id, {
      id: row.id,
      slug: row.canonical_slug,
      parentId: row.parent_id,
      authorName: row.author_name,
      content: normalizeCommentContent(row),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      replies: [],
    });
  });

  const roots: CommentItem[] = [];

  rows.forEach((row) => {
    const item = map.get(row.id);

    if (!item) {
      return;
    }

    if (row.parent_id) {
      const parent = map.get(row.parent_id);

      if (parent) {
        parent.replies.push(item);
        return;
      }
    }

    roots.push(item);
  });

  return roots;
}

export async function listPublishedComments(slug: string): Promise<CommentItem[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("comments_with_thread")
    .select("id, parent_id, author_name, body_markdown, status, deleted_at, created_at, updated_at, canonical_slug")
    .eq("canonical_slug", slug)
    .in("status", ["published", "deleted"])
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return buildCommentTree((data ?? []) as CommentRow[]);
}

export async function listAdminComments(): Promise<CommentModerationItem[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("comments_admin_with_thread")
    .select("id, parent_id, author_name, body_markdown, status, deleted_at, created_at, updated_at, password_hash, canonical_slug, ip_hash")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CommentRow[]).map((row) => ({
    id: row.id,
    slug: row.canonical_slug,
    authorName: row.author_name,
    content: normalizeCommentContent(row),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    parentId: row.parent_id,
    ipHashPreview: formatIpHashPreview(row.ip_hash),
  }));
}

export async function consumeCommentRateLimit(input: {
  action: string;
  subjectHash: string | null;
  limit: number;
  windowSeconds: number;
}): Promise<boolean> {
  if (!input.subjectHash) {
    return false;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("consume_comment_rate_limit", {
    input_action: input.action,
    input_subject_hash: input.subjectHash,
    input_limit: input.limit,
    input_window_seconds: input.windowSeconds,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data === true;
}

export async function createCommentAuthorization(input: {
  slug: string;
  source: "quiz" | "invite";
  ttlSeconds?: number;
}): Promise<CommentAuthorizationRow> {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + Math.min(900, Math.max(300, input.ttlSeconds ?? 300)) * 1000);
  const row = {
    id: randomUUID(),
    purpose: "COMMENT_WRITE",
    canonical_slug: input.slug,
    source: input.source,
    issued_at: issuedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  };
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("comment_authorizations")
    .insert(row)
    .select("id, expires_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create comment authorization.");
  }

  return data as CommentAuthorizationRow;
}

export async function verifyInviteToken(token: string): Promise<boolean> {
  if (token.length < 32 || token.length > 256) {
    return false;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("invite_tokens")
    .select("id")
    .eq("token_hash", hashInviteToken(token))
    .eq("is_active", true)
    .is("revoked_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

function mapInviteToken(row: InviteTokenRow): InviteTokenItem {
  return {
    id: row.id,
    label: row.label,
    isActive: row.is_active,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
  };
}

export async function listInviteTokens(): Promise<InviteTokenItem[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("invite_tokens")
    .select("id, label, is_active, created_at, revoked_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as InviteTokenRow[]).map(mapInviteToken);
}

export async function createInviteToken(label: string): Promise<{ item: InviteTokenItem; token: string }> {
  const normalizedLabel = label.trim();

  if (normalizedLabel.length < 1 || normalizedLabel.length > 80) {
    throw new Error("Invite token label must be between 1 and 80 characters.");
  }

  const token = randomBytes(32).toString("base64url");
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("invite_tokens")
    .insert({ label: normalizedLabel, token_hash: hashInviteToken(token) })
    .select("id, label, is_active, created_at, revoked_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create invite token.");
  }

  return { item: mapInviteToken(data as InviteTokenRow), token };
}

export async function revokeInviteToken(id: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("invite_tokens")
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

function mapCommentQuiz(row: CommentQuizRow): CommentQuizItem {
  return {
    canonicalSlug: row.canonical_slug,
    prompt: row.prompt,
    isActive: row.is_active,
    updatedAt: row.updated_at,
  };
}

export async function listCommentQuizzes(): Promise<CommentQuizItem[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("comment_quizzes")
    .select("canonical_slug, prompt, answer_hashes, is_active, updated_at")
    .order("canonical_slug", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CommentQuizRow[]).map(mapCommentQuiz);
}

export async function getActiveCommentQuiz(slug: string): Promise<CommentQuizItem | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("comment_quizzes")
    .select("canonical_slug, prompt, answer_hashes, is_active, updated_at")
    .eq("canonical_slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapCommentQuiz(data as CommentQuizRow) : null;
}

export async function verifyConfiguredQuizAnswer(slug: string, answer: string): Promise<boolean | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("comment_quizzes")
    .select("answer_hashes")
    .eq("canonical_slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const expectedHashes = Array.isArray(data.answer_hashes) ? data.answer_hashes : [];
  const candidate = hashQuizAnswer(answer);
  return expectedHashes.some((expected) => {
    const left = Buffer.from(candidate, "hex");
    const right = Buffer.from(String(expected), "hex");
    return left.length === right.length && timingSafeEqual(left, right);
  });
}

export async function upsertCommentQuiz(input: {
  slug: string;
  prompt: string;
  answers: string[];
}): Promise<CommentQuizItem> {
  const prompt = input.prompt.trim();
  const answers = [...new Set(input.answers.map(normalizeQuizAnswer).filter(Boolean))];

  if (prompt.length < 1 || prompt.length > 500 || answers.length < 1 || answers.length > 20) {
    throw new Error("Invalid quiz input.");
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("comment_quizzes")
    .upsert({
      canonical_slug: input.slug,
      prompt,
      answer_hashes: answers.map(hashQuizAnswer),
      normalization_version: 1,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "canonical_slug" })
    .select("canonical_slug, prompt, answer_hashes, is_active, updated_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save quiz.");
  }

  return mapCommentQuiz(data as CommentQuizRow);
}

export async function disableCommentQuiz(slug: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("comment_quizzes")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("canonical_slug", slug);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createComment(input: {
  authorizationId: string;
  idempotencyKey: string;
  requestHash: string;
  slug: string;
  parentId?: string | null;
  authorName: string;
  content: string;
  password: string;
  ipHash: string | null;
}): Promise<{ commentId: string; replayed: boolean }> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("create_authorized_comment", {
    input_authorization_id: input.authorizationId,
    input_canonical_slug: input.slug,
    input_idempotency_key: input.idempotencyKey,
    input_request_hash: input.requestHash,
    input_parent_id: input.parentId ?? null,
    input_author_name: input.authorName,
    input_body_markdown: input.content,
    input_password_hash: hashCommentPassword(input.password),
    input_ip_hash: input.ipHash,
  });

  if (error || !Array.isArray(data) || !data[0]) {
    throw new Error(error?.message ?? "Failed to create comment.");
  }

  return {
    commentId: String(data[0].comment_id),
    replayed: data[0].replayed === true,
  };
}

export async function blacklistCommentIp(commentId: string): Promise<void> {
  const row = await getCommentRow(commentId);

  if (!row.ip_hash) {
    throw new Error("Comment has no IP hash.");
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("comment_ip_blacklist").upsert({
    ip_hash: row.ip_hash,
    source_comment_id: commentId,
  });

  if (getSupabaseErrorCode(error) === "42P01") {
    throw new Error("comment_ip_blacklist table is missing. Run the latest migration.");
  }

  if (error) {
    throw new Error(error.message);
  }
}

async function getCommentRow(commentId: string): Promise<CommentRow> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("comments_admin_with_thread")
    .select("id, parent_id, author_name, body_markdown, status, deleted_at, created_at, updated_at, password_hash, canonical_slug, ip_hash")
    .eq("id", commentId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Comment not found.");
  }

  return data as CommentRow;
}

export async function updateComment(input: {
  commentId: string;
  password: string;
  content: string;
}): Promise<string> {
  if (input.password.length < 8 || input.password.length > 72 || input.content.trim().length < 1 || input.content.trim().length > 5000) {
    throw new Error("Invalid comment update input.");
  }

  const row = await getCommentRow(input.commentId);

  if (row.status !== "published") {
    throw new Error("Only published comments can be edited.");
  }

  if (!verifyCommentPassword(input.password, row.password_hash)) {
    throw new Error("Comment password mismatch.");
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("comments")
    .update({ body_markdown: input.content.trim(), body_html: input.content.trim(), updated_at: new Date().toISOString() })
    .eq("id", input.commentId);

  if (error) {
    throw new Error(error.message);
  }

  return row.canonical_slug;
}

export async function deleteComment(input: { commentId: string; password: string }): Promise<string> {
  if (input.password.length < 8 || input.password.length > 72) {
    throw new Error("Invalid comment password.");
  }

  const row = await getCommentRow(input.commentId);

  if (row.status !== "published") {
    throw new Error("Only published comments can be deleted.");
  }

  if (!verifyCommentPassword(input.password, row.password_hash)) {
    throw new Error("Comment password mismatch.");
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("comments")
    .update({ status: "deleted", deleted_at: new Date().toISOString(), body_markdown: "", body_html: "", updated_at: new Date().toISOString() })
    .eq("id", input.commentId);

  if (error) {
    throw new Error(error.message);
  }

  return row.canonical_slug;
}

export async function moderateComment(input: { commentId: string; status: CommentStatus }): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const update =
    input.status === "deleted"
      ? { status: "deleted", deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      : { status: input.status, deleted_at: null, updated_at: new Date().toISOString() };

  const { error } = await supabase.from("comments").update(update).eq("id", input.commentId);

  if (error) {
    throw new Error(error.message);
  }
}
