"use client";

import { useState } from "react";
import type { AppLocale } from "@/lib/site";
import type { AdminPostMetadata } from "@/lib/content";
import type { WorkerPostQuizMapping, WorkerQuizBank } from "@/lib/worker-admin";

interface AdminPostQuizMappingsProps {
  categories: WorkerQuizBank["categories"];
  initialMappings: WorkerPostQuizMapping[];
  initialPosts: AdminPostMetadata[];
  locale: AppLocale;
}

export function AdminPostQuizMappings({ categories, initialMappings, initialPosts, locale }: AdminPostQuizMappingsProps) {
  const ko = locale === "ko";
  const mappingBySlug = new Map(initialMappings.map((mapping) => [mapping.canonical_slug, mapping]));
  const [mappings, setMappings] = useState(initialMappings);
  const [selectedCategoryBySlug, setSelectedCategoryBySlug] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialPosts.map((post) => [post.canonicalSlug, mappingBySlug.get(post.canonicalSlug)?.quiz_category_id ?? ""])),
  );
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  async function saveMapping(post: AdminPostMetadata): Promise<void> {
    const categoryId = selectedCategoryBySlug[post.canonicalSlug] || null;
    setSavingSlug(post.canonicalSlug);
    setMessage("");

    try {
      const response = await fetch("/api/admin/quiz/post-mappings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ canonicalSlug: post.canonicalSlug, categoryId }),
      });
      if (!response.ok) throw new Error("mapping-save-failed");

      const result = await response.json() as { item?: WorkerPostQuizMapping };
      if (!result.item) throw new Error("mapping-save-failed");
      const item = result.item;
      setMappings((current) => [
        ...current.filter((mapping) => mapping.canonical_slug !== item.canonical_slug),
        item,
      ]);
      setMessage(ko ? `${post.canonicalSlug}의 퀴즈 카테고리를 저장했습니다.` : `Saved the quiz category for ${post.canonicalSlug}.`);
    } catch {
      setMessage(ko ? "게시물 퀴즈 카테고리를 저장하지 못했습니다." : "Failed to save the post quiz category.");
    } finally {
      setSavingSlug(null);
    }
  }

  return (
    <section className="surface-card stack-md">
      <div className="stack-sm">
        <h2 className="card-title">{ko ? "게시물별 댓글 퀴즈" : "Post comment quiz mapping"}</h2>
        <p className="card-copy">
          {ko
            ? "Front Matter의 commentQuizCategory는 참고값이고, 실제 댓글 퀴즈는 여기서 저장한 DB 매핑을 사용합니다. 기본값을 선택하면 GENERAL로 fallback합니다."
            : "Front Matter commentQuizCategory is a reference value; comment challenges use the database mapping saved here. The default option falls back to GENERAL."}
        </p>
      </div>
      <div className="stack-sm">
        {initialPosts.map((post) => {
          const displayLocale = post.locales.find((item) => item.locale === locale) ?? post.locales[0];
          const selectedCategoryId = selectedCategoryBySlug[post.canonicalSlug] ?? "";
          const savedCategoryId = mappings.find((mapping) => mapping.canonical_slug === post.canonicalSlug)?.quiz_category_id ?? "";
          const frontMatterCategories = [...new Set(post.locales.map((item) => item.commentQuizCategory).filter(Boolean))];
          const availableCategories = categories.filter((category) => category.active || category.id === selectedCategoryId);
          const dirty = selectedCategoryId !== savedCategoryId;

          return (
            <div className="table-row" key={post.canonicalSlug}>
              <div className="stack-xs">
                <strong>{displayLocale?.title ?? post.canonicalSlug}</strong>
                <span className="meta-row">
                  {post.canonicalSlug} · {post.draft ? (ko ? "초안" : "draft") : (ko ? "게시됨" : "published")}
                </span>
                <span className="meta-row">
                  Front Matter: {frontMatterCategories.length > 0 ? frontMatterCategories.join(", ") : (ko ? "없음" : "none")}
                </span>
                <span className="meta-row">
                  {ko ? "현재 DB 매핑" : "Current DB mapping"}: {categoryById.get(savedCategoryId)?.code ?? (ko ? "GENERAL fallback" : "GENERAL fallback")}
                </span>
              </div>
              <label className="field">
                <span className="field__label">{ko ? "저장할 카테고리" : "Category to save"}</span>
                <select
                  className="field__input"
                  onChange={(event) => setSelectedCategoryBySlug((current) => ({ ...current, [post.canonicalSlug]: event.target.value }))}
                  value={selectedCategoryId}
                >
                  <option value="">{ko ? "기본값 (GENERAL)" : "Default (GENERAL)"}</option>
                  {availableCategories.map((category) => (
                    <option disabled={!category.active} key={category.id} value={category.id}>
                      {category.code} · {category.name}{!category.active ? (ko ? " (비활성)" : " (disabled)") : ""}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="button button--secondary"
                disabled={!dirty || savingSlug === post.canonicalSlug}
                onClick={() => void saveMapping(post)}
                type="button"
              >
                {savingSlug === post.canonicalSlug ? (ko ? "저장 중..." : "Saving...") : (ko ? "매핑 저장" : "Save mapping")}
              </button>
            </div>
          );
        })}
      </div>
      {initialPosts.length === 0 ? <p className="empty-state">{ko ? "게시물이 없습니다." : "No posts found."}</p> : null}
      {message ? <p className="status-text">{message}</p> : null}
    </section>
  );
}