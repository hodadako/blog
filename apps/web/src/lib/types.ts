import type { AppLocale } from "@/lib/site";

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
  iconUrl?: string;
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
  ipHashPreview: string | null;
}

export interface PaginationResult<T> {
  items: T[];
}

export interface QuizChallenge {
  prompt: string;
  challengeToken?: string;
  expiresAt: string;
}

export interface QuizVerificationResult {
  authorizationToken: string;
  expiresAt: string;
}

export interface QuizChallengeClaims {
  v: 1;
  typ: "comment_quiz_challenge";
  slug: string;
  locale: AppLocale;
  left: number;
  right: number;
  iat: number;
  exp: number;
}

export interface CommentAuthorizationClaims {
  v: 1;
  typ: "comment_write_authorization";
  purpose: "COMMENT_WRITE";
  canonicalSlug: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface InviteTokenItem {
  id: string;
  label: string;
  isActive: boolean;
  createdAt: string;
  revokedAt: string | null;
}

export interface CommentQuizItem {
  canonicalSlug: string;
  prompt: string;
  isActive: boolean;
  updatedAt: string;
}

export interface SessionClaims {
  sub: "admin";
  iat: number;
  exp: number;
}
