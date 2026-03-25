import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { requireCommentPepper } from "@/lib/env";
import type { CommentItem, CommentModerationItem, CommentStatus } from "@/lib/types";

interface ThreadRecord {
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

export function hashCommentIp(ipAddress: string): string {
  return createHash("sha256").update(`${requireCommentPepper()}:${ipAddress.trim()}`).digest("hex");
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

async function getThreadBySlug(slug: string): Promise<ThreadRecord | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("comment_threads")
    .select("id, canonical_slug")
    .eq("canonical_slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function ensureCommentThread(slug: string): Promise<ThreadRecord> {
  const existing = await getThreadBySlug(slug);

  if (existing) {
    return existing;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("comment_threads")
    .insert({ canonical_slug: slug })
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
  const thread = await getThreadBySlug(slug);

  if (!thread) {
    return [];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("comments_with_thread")
    .select("id, parent_id, author_name, body_markdown, status, deleted_at, created_at, updated_at, password_hash, canonical_slug")
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
    .from("comments_with_thread")
    .select("id, parent_id, author_name, body_markdown, status, deleted_at, created_at, updated_at, password_hash, canonical_slug")
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

export async function createComment(input: {
  slug: string;
  parentId?: string | null;
  authorName: string;
  content: string;
  password: string;
  ipHash: string | null;
}): Promise<void> {
  if (await isBlockedIpHash(input.ipHash)) {
    throw new Error("Comment blocked by IP blacklist.");
  }

  const thread = await ensureCommentThread(input.slug);
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("comments").insert({
    thread_id: thread.id,
    parent_id: input.parentId ?? null,
    depth: input.parentId ? 1 : 0,
    author_name: input.authorName,
    body_markdown: input.content,
    body_html: input.content,
    status: "published",
    password_hash: hashCommentPassword(input.password),
    quiz_verified_at: new Date().toISOString(),
    ip_hash: input.ipHash,
  });

  if (error) {
    throw new Error(error.message);
  }
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
    .from("comments_with_thread")
    .select("id, parent_id, author_name, body_markdown, status, deleted_at, created_at, updated_at, password_hash, canonical_slug")
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
  const row = await getCommentRow(input.commentId);

  if (!verifyCommentPassword(input.password, row.password_hash)) {
    throw new Error("Comment password mismatch.");
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("comments")
    .update({ body_markdown: input.content, body_html: input.content, updated_at: new Date().toISOString() })
    .eq("id", input.commentId);

  if (error) {
    throw new Error(error.message);
  }

  return row.canonical_slug;
}

export async function deleteComment(input: { commentId: string; password: string }): Promise<string> {
  const row = await getCommentRow(input.commentId);

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
