import { env } from "@/lib/env";
import type { CommentModerationItem, InviteTokenItem } from "@/lib/types";
import { workerRequest } from "@/lib/worker-client";

function requireWorkerAdminSecret(): string {
  if (!env.workerAdminSecret) {
    throw new Error("WORKER_ADMIN_SECRET is required.");
  }
  return env.workerAdminSecret;
}

async function workerAdminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return workerRequest<T>(path, {
    ...init,
    headers: {
      ...init?.headers,
      "x-admin-api-key": requireWorkerAdminSecret(),
    },
  });
}

interface WorkerCommentRow {
  id: string;
  parent_id: string | null;
  author_name: string;
  body_markdown: string;
  status: CommentModerationItem["status"];
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  canonical_slug: string;
  ip_hash: string | null;
}

export async function listWorkerAdminComments(): Promise<CommentModerationItem[]> {
  const rows = await workerAdminRequest<WorkerCommentRow[]>("/admin/comments");
  return rows.map((row) => ({
    id: row.id,
    slug: row.canonical_slug,
    authorName: row.author_name,
    content: row.status === "deleted" || row.deleted_at ? "[deleted]" : row.body_markdown,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    parentId: row.parent_id,
    ipHashPreview: row.ip_hash ? `${row.ip_hash.slice(0, 10)}…` : null,
  }));
}

interface WorkerInviteTokenRow {
  id: string;
  label: string;
  is_active: boolean;
  created_at: string;
  revoked_at: string | null;
}

export async function listWorkerInviteTokens(): Promise<InviteTokenItem[]> {
  const rows = await workerAdminRequest<WorkerInviteTokenRow[]>("/admin/invite-tokens");
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    isActive: row.is_active,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
  }));
}

export async function createWorkerInviteToken(label: string): Promise<{ item: InviteTokenItem; token: string }> {
  const result = await workerAdminRequest<{ item: WorkerInviteTokenRow; token: string }>("/admin/invite-tokens", {
    method: "POST",
    body: JSON.stringify({ label }),
  });
  return {
    token: result.token,
    item: {
      id: result.item.id,
      label: result.item.label,
      isActive: result.item.is_active,
      createdAt: result.item.created_at,
      revokedAt: result.item.revoked_at,
    },
  };
}

export async function revokeWorkerInviteToken(id: string): Promise<void> {
  await workerAdminRequest<void>("/admin/invite-tokens", { method: "DELETE", body: JSON.stringify({ id }) });
}

export async function moderateWorkerComment(id: string, status: CommentModerationItem["status"]): Promise<void> {
  await workerAdminRequest<void>(`/admin/comments/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export async function blacklistWorkerCommentIp(id: string): Promise<void> {
  await workerAdminRequest<void>(`/admin/comments/${id}`, { method: "PATCH", body: JSON.stringify({ blacklist: true }) });
}

export interface WorkerQuizBank {
  categories: Array<{ id: string; code: string; name: string; description: string; active: boolean }>;
  questions: Array<{ id: string; category_id: string; type: string; prompt: string; explanation: string; difficulty: number; active: boolean; version: number }>;
  options: Array<{ id: string; question_id: string; text: string | null; image_path: string | null; alt_text: string | null; label: string | null; is_correct: boolean; display_order: number }>;
}

export interface WorkerPostQuizMapping {
  canonical_slug: string;
  quiz_category_id: string | null;
}

export async function getWorkerQuizBank(): Promise<WorkerQuizBank> {
  return workerAdminRequest<WorkerQuizBank>("/admin/quiz/questions");
}

export async function getWorkerPostQuizMappings(): Promise<WorkerPostQuizMapping[]> {
  return workerAdminRequest<WorkerPostQuizMapping[]>("/admin/quiz/post-mappings");
}

export async function updateWorkerPostQuizMapping(canonicalSlug: string, categoryId: string | null): Promise<WorkerPostQuizMapping> {
  const result = await workerAdminRequest<{ item: WorkerPostQuizMapping }>("/admin/quiz/post-mappings", {
    method: "PATCH",
    body: JSON.stringify({ canonicalSlug, categoryId }),
  });
  return result.item;
}

export interface WorkerQuizQuestionInput {
  questionId?: string | null;
  categoryCode: string;
  type: "TEXT_MULTIPLE_CHOICE" | "IMAGE_MULTIPLE_CHOICE";
  prompt: string;
  explanation?: string;
  difficulty?: number;
  active?: boolean;
  options: Array<{
    text?: string | null;
    imagePath?: string | null;
    altText?: string | null;
    label?: string | null;
    isCorrect: boolean;
    displayOrder: number;
  }>;
}

export async function upsertWorkerQuizQuestion(input: WorkerQuizQuestionInput): Promise<void> {
  await workerAdminRequest<void>("/admin/quiz/questions", { method: "POST", body: JSON.stringify(input) });
}

export async function createWorkerQuizCategory(input: { code: string; name: string; description?: string }): Promise<WorkerQuizBank["categories"][number]> {
  return workerAdminRequest<WorkerQuizBank["categories"][number]>("/admin/quiz/categories", { method: "POST", body: JSON.stringify(input) });
}

export async function updateWorkerQuizCategory(id: string, input: { name?: string; description?: string; active?: boolean }): Promise<void> {
  await workerAdminRequest<void>(`/admin/quiz/categories/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}
