import type { AppLocale } from "@/lib/site";

export type PostStatus = "draft" | "published";
export type CommentStatus = "published" | "hidden" | "deleted";

export interface PostFrontmatter {
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
  draft: boolean;
  locale: AppLocale;
  slug: string;
}

export interface PostSummary extends PostFrontmatter {
  readingTime: string;
  canonicalSlug: string;
  availableLocales: AppLocale[];
}

export interface PostDetail extends PostSummary {
  body: string;
}

export interface LocalizedPostInput extends PostFrontmatter {
  body: string;
}

export interface CommentItem {
  id: string;
  slug: string;
  parentId: string | null;
  authorName: string;
  content: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;
  replies: CommentItem[];
}

export interface CommentEditorState {
  id: string;
  mode: "edit" | "delete";
}

export interface CommentModerationItem {
  id: string;
  slug: string;
  authorName: string;
  content: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
}

export interface AdminPostListItem {
  slug: string;
  locale: AppLocale;
  title: string;
  status: PostStatus;
  updatedAt: string;
}

export interface PostEditorDraft {
  slug: string;
  locale: AppLocale;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  tags: string;
  draft: boolean;
  body: string;
}

export interface AdminDashboardData {
  posts: AdminPostListItem[];
  draft: PostEditorDraft;
  stats: Array<{ label: string; value: string }>;
}

export interface PaginationResult<T> {
  items: T[];
}

export interface GithubContentFile {
  sha: string;
  content: string;
}

export interface GithubWriteResult {
  fileSha: string;
  commitSha: string;
}

export interface QuizChallenge {
  prompt: string;
  challengeToken: string;
  expiresAt: string;
}

export interface QuizVerificationResult {
  verifiedToken: string;
  expiresAt: string;
}

export interface QuizTokenClaims {
  v: number;
  typ: "comment_quiz_pass";
  slug: string;
  anonId: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface SessionClaims {
  sub: "admin";
  iat: number;
  exp: number;
}
