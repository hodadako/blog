import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type AppLocale, isSupportedLocale } from "@/lib/site";
import { env } from "@/lib/env";
import type { LocalizedPostInput, PostDetail, PostFrontmatter, PostSummary } from "@/lib/types";

export const POST_ICON_FILENAME = "icon.png";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readRequiredString(input: Record<string, unknown>, key: string): string {
  const value = input[key];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid frontmatter field: ${key}`);
  }

  return value;
}

function readOptionalString(input: Record<string, unknown>, key: string): string | undefined {
  const value = input[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new Error(`Invalid frontmatter field: ${key}`);
  }

  return value;
}

function readStringArray(input: Record<string, unknown>, key: string): string[] {
  const value = input[key];

  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error(`Invalid frontmatter field: ${key}`);
  }

  return value;
}

function readBoolean(input: Record<string, unknown>, key: string): boolean {
  const value = input[key];

  if (value === undefined) {
    return false;
  }

  if (typeof value !== "boolean") {
    throw new Error(`Invalid frontmatter field: ${key}`);
  }

  return value;
}

function readLocale(input: Record<string, unknown>): AppLocale {
  const locale = readRequiredString(input, "locale");

  if (!isSupportedLocale(locale)) {
    throw new Error(`Invalid frontmatter field: locale`);
  }

  return locale;
}

function parseFrontmatter(input: unknown): PostFrontmatter {
  if (!isRecord(input)) {
    throw new Error("Invalid frontmatter");
  }

  return {
    title: readRequiredString(input, "title"),
    description: readRequiredString(input, "description"),
    publishedAt: readRequiredString(input, "publishedAt"),
    updatedAt: readOptionalString(input, "updatedAt"),
    tags: readStringArray(input, "tags"),
    draft: readBoolean(input, "draft"),
    locale: readLocale(input),
    slug: readRequiredString(input, "slug"),
  };
}

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

interface IndexedPostRecord {
  availableLocales: AppLocale[];
  canonicalSlug: string;
  frontmatter: PostFrontmatter;
  iconUrl?: string;
  sourcePath: string;
}

interface ContentIndex {
  allPostParams: Array<{ locale: AppLocale; slug: string }>;
  canonicalByLocalizedSlug: Map<string, string>;
  indexedPostsByLocalizedSlug: Map<string, IndexedPostRecord>;
  localizedPosts: IndexedPostRecord[];
  postsByLocale: Map<AppLocale, IndexedPostRecord[]>;
  variantsByCanonicalSlug: Map<string, IndexedPostRecord[]>;
}

function formatReadingTime(locale: AppLocale, body: string): string {
  const minutes = Math.max(1, Math.ceil(body.trim().split(/\s+/).filter(Boolean).length / 220));
  return locale === "ko" ? `${minutes}분` : `${minutes} min`;
}

function toSummary(record: IndexedPostRecord, readingTime: string): PostSummary {
  return {
    ...record.frontmatter,
    canonicalSlug: record.canonicalSlug,
    availableLocales: record.availableLocales,
    readingTime,
    iconUrl: record.iconUrl,
  };
}

export function buildPostIconUrl(canonicalSlug: string): string {
  return `/posts/${encodeURIComponent(canonicalSlug)}/${POST_ICON_FILENAME}`;
}

export function resolvePostIconFilePath(canonicalSlug: string): string | null {
  if (path.basename(canonicalSlug) !== canonicalSlug) {
    return null;
  }

  const iconPath = path.join(contentDirectory, canonicalSlug, POST_ICON_FILENAME);
  return existsSync(iconPath) ? iconPath : null;
}

function parseMarkdownBody(source: string): string {
  return matter(source).content.trim();
}

async function readFrontmatterSource(sourcePath: string): Promise<string> {
  const file = await fs.open(sourcePath, "r");
  const chunks: Buffer[] = [];

  try {
    let offset = 0;

    while (offset < 16_384) {
      const chunk = Buffer.alloc(2048);
      const { bytesRead } = await file.read(chunk, 0, chunk.length, offset);

      if (bytesRead === 0) {
        break;
      }

      chunks.push(chunk.subarray(0, bytesRead));
      offset += bytesRead;

      const candidate = Buffer.concat(chunks).toString("utf8");

      if (/^---\s*$[\s\S]*?^---\s*$/m.test(candidate)) {
        return candidate;
      }
    }
  } finally {
    await file.close();
  }

  return fs.readFile(sourcePath, "utf8");
}

const readingTimePromiseByPath = new Map<string, Promise<string>>();

async function getReadingTime(record: IndexedPostRecord): Promise<string> {
  const existing = readingTimePromiseByPath.get(record.sourcePath);

  if (existing) {
    return existing;
  }

  const next = fs
    .readFile(record.sourcePath, "utf8")
    .then((source) => formatReadingTime(record.frontmatter.locale, parseMarkdownBody(source)))
    .catch((error) => {
      readingTimePromiseByPath.delete(record.sourcePath);
      throw error;
    });

  readingTimePromiseByPath.set(record.sourcePath, next);
  return next;
}

async function buildSummary(record: IndexedPostRecord): Promise<PostSummary> {
  return toSummary(record, await getReadingTime(record));
}

async function readPostDirectory(canonicalSlug: string): Promise<IndexedPostRecord[]> {
  const slugDirectory = path.join(contentDirectory, canonicalSlug);
  const entries = await fs.readdir(slugDirectory, { withFileTypes: true });
  const markdownFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md"));
  const iconUrl = resolvePostIconFilePath(canonicalSlug)
    ? buildPostIconUrl(canonicalSlug)
    : undefined;

  const records = await Promise.all(
    markdownFiles.map(async (file) => {
      const locale = file.name.replace(/\.md$/, "");

      if (!isSupportedLocale(locale)) {
        throw new Error(`Unsupported locale file: ${file.name}`);
      }

      const absolutePath = path.join(slugDirectory, file.name);
      const source = await readFrontmatterSource(absolutePath);
      const parsed = matter(source);
      const frontmatter = parseFrontmatter(parsed.data);

      return {
        availableLocales: [],
        canonicalSlug,
        frontmatter,
        iconUrl,
        sourcePath: absolutePath,
      } satisfies IndexedPostRecord;
    }),
  );

  const availableLocales = records.map((record) => record.frontmatter.locale);

  return records
    .map((record) => ({
      ...record,
      availableLocales,
    }))
    .sort((left, right) => left.frontmatter.locale.localeCompare(right.frontmatter.locale));
}

async function listCanonicalSlugs(): Promise<string[]> {
  try {
    const entries = await fs.readdir(contentDirectory, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  } catch {
    return [];
  }
}

function buildLocalizedPostKey(locale: AppLocale, slug: string): string {
  return `${locale}:${slug}`;
}

let contentIndexPromise: Promise<ContentIndex> | null = null;

async function buildContentIndex(): Promise<ContentIndex> {
  const slugs = await listCanonicalSlugs();
  const groups = await Promise.all(slugs.map((slug) => readPostDirectory(slug)));
  const allPostParams: Array<{ locale: AppLocale; slug: string }> = [];
  const canonicalByLocalizedSlug = new Map<string, string>();
  const indexedPostsByLocalizedSlug = new Map<string, IndexedPostRecord>();
  const localizedPosts: IndexedPostRecord[] = [];
  const postsByLocale = new Map<AppLocale, IndexedPostRecord[]>(SUPPORTED_LOCALES.map((locale) => [locale, []]));
  const variantsByCanonicalSlug = new Map<string, IndexedPostRecord[]>();

  groups.forEach((records) => {
    if (records.length === 0) {
      return;
    }

    const variants = records
      .map((record) => {
        const localizedPostKey = buildLocalizedPostKey(record.frontmatter.locale, record.frontmatter.slug);

        canonicalByLocalizedSlug.set(localizedPostKey, record.canonicalSlug);
        indexedPostsByLocalizedSlug.set(localizedPostKey, record);
        localizedPosts.push(record);

        if (!record.frontmatter.draft) {
          allPostParams.push({locale: record.frontmatter.locale, slug: record.frontmatter.slug});
          postsByLocale.get(record.frontmatter.locale)?.push(record);
        }

        return record;
      })
      .sort((left, right) => left.frontmatter.locale.localeCompare(right.frontmatter.locale));

    variantsByCanonicalSlug.set(records[0].canonicalSlug, variants);
  });

  localizedPosts.sort((left, right) => right.frontmatter.publishedAt.localeCompare(left.frontmatter.publishedAt));

  postsByLocale.forEach((posts, locale) => {
    postsByLocale.set(
      locale,
      posts.sort((left, right) => right.frontmatter.publishedAt.localeCompare(left.frontmatter.publishedAt)),
    );
  });

  return {
    allPostParams,
    canonicalByLocalizedSlug,
    indexedPostsByLocalizedSlug,
    localizedPosts,
    postsByLocale,
    variantsByCanonicalSlug,
  };
}

async function getContentIndex(): Promise<ContentIndex> {
  if (!contentIndexPromise) {
    contentIndexPromise = buildContentIndex().catch((error) => {
      contentIndexPromise = null;
      throw error;
    });
  }

  return contentIndexPromise;
}

export async function getAllLocalizedPosts(): Promise<PostSummary[]> {
  const contentIndex = await getContentIndex();
  return Promise.all(contentIndex.localizedPosts.map((record) => buildSummary(record)));
}

export async function getAllLocalizedPostMetadata(): Promise<
  Array<Pick<PostSummary, "availableLocales" | "canonicalSlug" | "draft" | "locale" | "publishedAt" | "slug" | "updatedAt">>
> {
  const contentIndex = await getContentIndex();

  return contentIndex.localizedPosts.map((record) => ({
    availableLocales: record.availableLocales,
    canonicalSlug: record.canonicalSlug,
    draft: record.frontmatter.draft,
    locale: record.frontmatter.locale,
    publishedAt: record.frontmatter.publishedAt,
    slug: record.frontmatter.slug,
    updatedAt: record.frontmatter.updatedAt,
  }));
}

export async function getAllLocalizedPostSitemapEntries(): Promise<
  Array<{
    alternates: Record<AppLocale, string>;
    draft: boolean;
    locale: AppLocale;
    publishedAt: string;
    slug: string;
    updatedAt?: string;
  }>
> {
  const contentIndex = await getContentIndex();

  return contentIndex.localizedPosts.map((record) => {
    const variants = contentIndex.variantsByCanonicalSlug.get(record.canonicalSlug) ?? [];

    return {
      alternates: Object.fromEntries(
        variants.map((variant) => [variant.frontmatter.locale, variant.frontmatter.slug]),
      ) as Record<AppLocale, string>,
      draft: record.frontmatter.draft,
      locale: record.frontmatter.locale,
      publishedAt: record.frontmatter.publishedAt,
      slug: record.frontmatter.slug,
      updatedAt: record.frontmatter.updatedAt,
    };
  });
}

export async function getPostsByLocale(locale: AppLocale, limit?: number): Promise<PostSummary[]> {
  const contentIndex = await getContentIndex();
  const posts = contentIndex.postsByLocale.get(locale) ?? [];
  const selected = typeof limit === "number" ? posts.slice(0, limit) : posts;

  return Promise.all(selected.map((record) => buildSummary(record)));
}

export async function getAllPostParams(): Promise<Array<{ locale: AppLocale; slug: string }>> {
  const contentIndex = await getContentIndex();
  return [...contentIndex.allPostParams];
}

export async function getPostBySlug(locale: AppLocale, slug: string): Promise<PostDetail | null> {
  const contentIndex = await getContentIndex();
  const record = contentIndex.indexedPostsByLocalizedSlug.get(buildLocalizedPostKey(locale, slug));

  if (!record) {
    return null;
  }

  const variants = contentIndex.variantsByCanonicalSlug.get(record.canonicalSlug) ?? [];
  const source = await fs.readFile(record.sourcePath, "utf8");

  return {
    ...toSummary(record, await getReadingTime(record)),
    body: parseMarkdownBody(source),
  };
}

export async function findCanonicalSlugByLocalizedSlug(
  locale: AppLocale,
  slug: string,
): Promise<string | null> {
  const contentIndex = await getContentIndex();
  return contentIndex.canonicalByLocalizedSlug.get(buildLocalizedPostKey(locale, slug)) ?? null;
}

export async function getLocalizedPostVariants(canonicalSlug: string): Promise<PostSummary[]> {
  const contentIndex = await getContentIndex();
  const variants = contentIndex.variantsByCanonicalSlug.get(canonicalSlug) ?? [];
  return Promise.all(variants.map((record) => buildSummary(record)));
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
