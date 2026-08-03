import type { CommentItem, QuizChallenge, QuizVerificationResult } from "@/lib/types";

export function getQuizWorkerUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_QUIZ_WORKER_URL?.trim();
  return value ? value.replace(/\/$/, "") : null;
}

export class WorkerApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(code);
    this.name = "WorkerApiError";
    this.status = status;
    this.code = code;
  }
}

async function readWorkerError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { error?: unknown };
    return typeof body.error === "string" ? body.error : "worker-request-failed";
  } catch {
    return "worker-request-failed";
  }
}

export async function workerRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getQuizWorkerUrl();
  if (!baseUrl) {
    throw new WorkerApiError(503, "worker-unavailable");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new WorkerApiError(response.status, await readWorkerError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return await response.json() as T;
}

export async function requestQuizChallenge(canonicalSlug: string): Promise<QuizChallenge> {
  return workerRequest<QuizChallenge>("/quiz/challenges", {
    method: "POST",
    body: JSON.stringify({ canonicalSlug }),
  });
}

export async function verifyQuizChallenge(challengeId: string, selectedOptionId: string): Promise<QuizVerificationResult> {
  return workerRequest<QuizVerificationResult>(`/quiz/challenges/${encodeURIComponent(challengeId)}/verify`, {
    method: "POST",
    body: JSON.stringify({ selectedOptionId }),
  });
}

export async function requestInviteAuthorization(canonicalSlug: string, inviteToken: string): Promise<QuizVerificationResult> {
  return workerRequest<QuizVerificationResult>("/comment-authorizations", {
    method: "POST",
    body: JSON.stringify({ canonicalSlug, inviteToken }),
  });
}

export async function listWorkerComments(canonicalSlug: string): Promise<CommentItem[]> {
  const rows = await workerRequest<Array<{
    id: string;
    parent_id: string | null;
    author_name: string;
    body_markdown: string;
    status: CommentItem["status"];
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
  }>>(`/comments?canonicalSlug=${encodeURIComponent(canonicalSlug)}`);

  const items = rows.map((row) => ({
    id: row.id,
    slug: canonicalSlug,
    parentId: row.parent_id,
    authorName: row.author_name,
    content: row.status === "deleted" || row.deleted_at ? "[deleted]" : row.body_markdown,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    replies: [] as CommentItem[],
  }));
  const byId = new Map(items.map((item) => [item.id, item]));
  const roots: CommentItem[] = [];
  for (const item of items) {
    if (item.parentId && byId.has(item.parentId)) {
      byId.get(item.parentId)?.replies.push(item);
    } else {
      roots.push(item);
    }
  }
  return roots;
}
