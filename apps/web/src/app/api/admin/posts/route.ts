import { readAdminSessionFromCookieHeader } from "@/lib/auth";
import { buildContentPath, serializeMarkdownDocument, toLocalizedPostInput } from "@/lib/content";
import { getGithubFile, writeGithubFile } from "@/lib/github";
import { resolveLocale } from "@/lib/site";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request): Promise<Response> {
  const formData = await request.formData();
  const locale = resolveLocale(readString(formData, "locale") || "ko");

  if (!readAdminSessionFromCookieHeader(request.headers.get("cookie"))) {
    return Response.redirect(new URL(`/${locale}/admin/login?error=unauthorized`, request.url), 303);
  }

  const slug = readString(formData, "slug");
  const title = readString(formData, "title");
  const description = readString(formData, "description");
  const publishedAt = readString(formData, "publishedAt");
  const updatedAt = readString(formData, "updatedAt");
  const tags = readString(formData, "tags");
  const content = readString(formData, "content");
  const status = readString(formData, "status");
  const pathname = buildContentPath(slug, locale);
  const current = await getGithubFile(pathname);
  const document = serializeMarkdownDocument(
    toLocalizedPostInput({
      slug,
      title,
      description,
      publishedAt,
      updatedAt,
      tags,
      draft: status !== "published",
      locale,
      body: content,
    }),
  );

  await writeGithubFile({
    pathname,
    content: document,
    message: `${current ? "update" : "create"} post ${slug} (${locale})`,
    sha: current?.sha,
  });

  return Response.redirect(new URL(`/${locale}/admin`, request.url), 303);
}
