import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type AppLocale, isSupportedLocale } from "@/lib/site";
import { env } from "@/lib/env";
import type { LocalizedPostInput, PostDetail, PostFrontmatter, PostSummary } from "@/lib/types";

const frontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  publishedAt: z.string().min(1),
  updatedAt: z.string().optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  locale: z.enum(SUPPORTED_LOCALES),
  slug: z.string().min(1),
});

function resolveContentDirectory(): string {
  if (env.contentRoot) {
    return path.resolve(process.cwd(), env.contentRoot);
  }

  const candidates = [
    path.resolve(process.cwd(), "content/posts"),
    path.resolve(process.cwd(), "../../content/posts"),
  ];

  const existing = candidates.find((candidate) => existsSync(candidate));
  return existing ?? candidates[0];
}

const contentDirectory = resolveContentDirectory();

interface ContentRecord {
  canonicalSlug: string;
  frontmatter: PostFrontmatter;
  body: string;
}

function formatReadingTime(locale: AppLocale, body: string): string {
  const minutes = Math.max(1, Math.ceil(body.trim().split(/\s+/).filter(Boolean).length / 220));
  return locale === "ko" ? `${minutes}분` : `${minutes} min`;
}

function toSummary(record: ContentRecord, availableLocales: AppLocale[]): PostSummary {
  return {
    ...record.frontmatter,
    canonicalSlug: record.canonicalSlug,
    availableLocales,
    readingTime: formatReadingTime(record.frontmatter.locale, record.body),
  };
}

async function readPostDirectory(canonicalSlug: string): Promise<ContentRecord[]> {
  const slugDirectory = path.join(contentDirectory, canonicalSlug);
  const entries = await fs.readdir(slugDirectory, { withFileTypes: true });
  const markdownFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md"));

  const records = await Promise.all(
    markdownFiles.map(async (file) => {
      const locale = file.name.replace(/\.md$/, "");

      if (!isSupportedLocale(locale)) {
        throw new Error(`Unsupported locale file: ${file.name}`);
      }

      const absolutePath = path.join(slugDirectory, file.name);
      const source = await fs.readFile(absolutePath, "utf8");
      const parsed = matter(source);
      const frontmatter = frontmatterSchema.parse(parsed.data);

      return {
        canonicalSlug,
        frontmatter,
        body: parsed.content.trim(),
      } satisfies ContentRecord;
    }),
  );

  return records.sort((left, right) => left.frontmatter.locale.localeCompare(right.frontmatter.locale));
}

async function listCanonicalSlugs(): Promise<string[]> {
  try {
    const entries = await fs.readdir(contentDirectory, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  } catch {
    return [];
  }
}

export async function getAllLocalizedPosts(): Promise<PostSummary[]> {
  const slugs = await listCanonicalSlugs();
  const groups = await Promise.all(slugs.map((slug) => readPostDirectory(slug)));

  return groups
    .flatMap((records) => {
      const locales = records.map((record) => record.frontmatter.locale);
      return records.map((record) => toSummary(record, locales));
    })
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

export async function getPostsByLocale(locale: AppLocale): Promise<PostSummary[]> {
  const allPosts = await getAllLocalizedPosts();

  return allPosts.filter((post) => post.locale === locale && !post.draft);
}

export async function getAllPostParams(): Promise<Array<{ locale: AppLocale; slug: string }>> {
  const posts = await getAllLocalizedPosts();

  return posts.filter((post) => !post.draft).map((post) => ({ locale: post.locale, slug: post.slug }));
}

export async function getPostBySlug(locale: AppLocale, slug: string): Promise<PostDetail | null> {
  const slugs = await listCanonicalSlugs();

  for (const canonicalSlug of slugs) {
    const records = await readPostDirectory(canonicalSlug);
    const match = records.find(
      (record) => record.frontmatter.locale === locale && record.frontmatter.slug === slug,
    );

    if (!match) {
      continue;
    }

    const locales = records.map((record) => record.frontmatter.locale);

    return {
      ...toSummary(match, locales),
      body: match.body,
    };
  }

  return null;
}

export async function findCanonicalSlugByLocalizedSlug(
  locale: AppLocale,
  slug: string,
): Promise<string | null> {
  const slugs = await listCanonicalSlugs();

  for (const canonicalSlug of slugs) {
    const records = await readPostDirectory(canonicalSlug);
    const found = records.some(
      (record) => record.frontmatter.locale === locale && record.frontmatter.slug === slug,
    );

    if (found) {
      return canonicalSlug;
    }
  }

  return null;
}

export async function getLocalizedPostVariants(canonicalSlug: string): Promise<PostSummary[]> {
  const records = await readPostDirectory(canonicalSlug);
  const locales = records.map((record) => record.frontmatter.locale);

  return records.map((record) => toSummary(record, locales)).sort((left, right) => left.locale.localeCompare(right.locale));
}

export async function findLocalizedSlug(canonicalSlug: string, locale: AppLocale): Promise<string | null> {
  const variants = await getLocalizedPostVariants(canonicalSlug);
  const exact = variants.find((variant) => variant.locale === locale);
  const fallback = variants.find((variant) => variant.locale === DEFAULT_LOCALE);

  return exact?.slug ?? fallback?.slug ?? null;
}

function formatArray(values: string[]): string {
  if (values.length === 0) {
    return "[]";
  }

  return `[${values.map((value) => `\"${value.replace(/\"/g, '\\\"')}\"`).join(", ")}]`;
}

export function serializeMarkdownDocument(input: LocalizedPostInput): string {
  const lines = [
    "---",
    `title: \"${input.title.replace(/\"/g, '\\\"')}\"`,
    `description: \"${input.description.replace(/\"/g, '\\\"')}\"`,
    `publishedAt: \"${input.publishedAt}\"`,
    `updatedAt: \"${input.updatedAt}\"`,
    `tags: ${formatArray(input.tags)}`,
    `draft: ${input.draft ? "true" : "false"}`,
    `locale: \"${input.locale}\"`,
    `slug: \"${input.slug.replace(/\"/g, '\\\"')}\"`,
    "---",
    "",
    input.body.trim(),
    "",
  ];

  return lines.join("\n");
}

export function buildContentPath(canonicalSlug: string, locale: AppLocale): string {
  return `content/posts/${canonicalSlug}/${locale}.md`;
}

export function normalizeTags(tagsInput: string): string[] {
  return tagsInput
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function toLocalizedPostInput(input: {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  tags: string;
  draft: boolean;
  locale: AppLocale;
  body: string;
}): LocalizedPostInput {
  return {
    slug: input.slug,
    title: input.title,
    description: input.description,
    publishedAt: input.publishedAt,
    updatedAt: input.updatedAt,
    tags: normalizeTags(input.tags),
    draft: input.draft,
    locale: input.locale,
    body: input.body,
  };
}
