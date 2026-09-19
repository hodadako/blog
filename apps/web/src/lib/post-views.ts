import { workerRequest } from "@/lib/worker-client";

export interface PostViewResponse {
  viewCount?: number;
}

export async function getPostViewCount(canonicalSlug: string): Promise<number> {
  const result = await workerRequest<PostViewResponse>(`/post-views/${encodeURIComponent(canonicalSlug)}`);
  return typeof result.viewCount === "number" && Number.isFinite(result.viewCount) ? result.viewCount : 0;
}

export async function recordPostView(canonicalSlug: string): Promise<number> {
  const result = await workerRequest<PostViewResponse>(`/post-views/${encodeURIComponent(canonicalSlug)}`, { method: "POST" });
  return typeof result.viewCount === "number" && Number.isFinite(result.viewCount) ? result.viewCount : 0;
}

export const incrementPostViewCount = recordPostView;
