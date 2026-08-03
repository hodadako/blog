"use client";

import { useState } from "react";
import type { AppLocale } from "@/lib/site";
import type { WorkerQuizBank } from "@/lib/worker-admin";

interface AdminQuizBankProps {
  initialBank: WorkerQuizBank;
  locale: AppLocale;
}

export function AdminQuizBank({ initialBank, locale }: AdminQuizBankProps) {
  const ko = locale === "ko";
  const [categoryCode, setCategoryCode] = useState("GENERAL");
  const [prompt, setPrompt] = useState("");
  const [optionText, setOptionText] = useState("");
  const [correctIndex, setCorrectIndex] = useState("5");
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categories, setCategories] = useState(initialBank.categories);
  const [message, setMessage] = useState("");
  const categoryById = new Map(initialBank.categories.map((category) => [category.id, category]));
  const optionsByQuestion = new Map<string, WorkerQuizBank["options"]>();
  for (const option of initialBank.options) {
    const current = optionsByQuestion.get(option.question_id) ?? [];
    current.push(option);
    optionsByQuestion.set(option.question_id, current);
  }

  return (
    <section className="surface-card stack-md">
      <div className="stack-sm">
        <h2 className="card-title">{ko ? "문제은행" : "Quiz question bank"}</h2>
        <p className="card-copy">
          {ko
            ? "문제와 선택지는 Supabase에서 관리하며 Worker 관리자 API를 통해서만 조회합니다. 이미지 문제는 권리 확인 후 활성화하세요."
            : "Questions and options are stored in Supabase and exposed only through the Worker admin API. Activate image questions after rights review."}
        </p>
      </div>
      <div className="form-grid">
        <label className="field">
          <span className="field__label">{ko ? "새 카테고리 코드" : "New category code"}</span>
          <input className="field__input" maxLength={32} onChange={(event) => setCategoryCode(event.target.value.toUpperCase())} value={categoryCode} />
        </label>
        <label className="field">
          <span className="field__label">{ko ? "카테고리 이름" : "Category name"}</span>
          <input className="field__input" maxLength={80} onChange={(event) => setCategoryName(event.target.value)} value={categoryName} />
        </label>
        <label className="field">
          <span className="field__label">{ko ? "설명" : "Description"}</span>
          <input className="field__input" maxLength={500} onChange={(event) => setCategoryDescription(event.target.value)} value={categoryDescription} />
        </label>
        <button
          className="button button--secondary"
          disabled={!categoryCode.trim() || !categoryName.trim()}
          onClick={() => void (async () => {
            const response = await fetch("/api/admin/quiz/categories", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ code: categoryCode, name: categoryName, description: categoryDescription }),
            });
            if (response.ok) {
              const result = await response.json() as { item?: WorkerQuizBank["categories"][number] };
              if (result.item) setCategories((current) => [...current, result.item!]);
              setCategoryName("");
              setCategoryDescription("");
              setMessage(ko ? "카테고리를 저장했습니다. 새로고침하면 정확한 ID가 반영됩니다." : "Category saved. Refresh to load its canonical ID.");
            } else {
              setMessage(ko ? "카테고리를 저장하지 못했습니다." : "Failed to save the category.");
            }
          })()}
          type="button"
        >
          {ko ? "카테고리 저장" : "Save category"}
        </button>
      </div>
      <div className="stack-sm">
        {categories.map((category) => (
          <div className="table-row" key={category.id}>
            <strong>{category.code}</strong>
            <span className="table-copy">{category.name}</span>
            <span className="meta-row">{category.active ? "active" : "disabled"}</span>
            <button
              className="button button--secondary"
              onClick={() => void (async () => {
                const response = await fetch(`/api/admin/quiz/categories/${category.id}`, {
                  method: "PATCH",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ active: !category.active }),
                });
                if (response.ok) setCategories((current) => current.map((item) => item.id === category.id ? { ...item, active: !item.active } : item));
              })()}
              type="button"
            >
              {category.active ? (ko ? "비활성화" : "Disable") : (ko ? "활성화" : "Enable")}
            </button>
          </div>
        ))}
      </div>
      <div className="form-grid">
        <label className="field">
          <span className="field__label">{ko ? "카테고리 코드" : "Category code"}</span>
          <input className="field__input" onChange={(event) => setCategoryCode(event.target.value.toUpperCase())} value={categoryCode} />
        </label>
        <label className="field">
          <span className="field__label">{ko ? "새 텍스트 문제" : "New text question"}</span>
          <input className="field__input" maxLength={1000} onChange={(event) => setPrompt(event.target.value)} value={prompt} />
        </label>
        <label className="field">
          <span className="field__label">{ko ? "선택지 5개 (한 줄씩)" : "Five options (one per line)"}</span>
          <textarea className="field__textarea" maxLength={2500} onChange={(event) => setOptionText(event.target.value)} value={optionText} />
        </label>
        <label className="field">
          <span className="field__label">{ko ? "정답 번호 (1~5)" : "Correct option (1-5)"}</span>
          <input className="field__input" max={5} min={1} onChange={(event) => setCorrectIndex(event.target.value)} type="number" value={correctIndex} />
        </label>
        <button
          className="button button--secondary"
          disabled={!prompt.trim() || optionText.split("\n").filter((item) => item.trim()).length !== 5}
          onClick={() => void (async () => {
            setMessage("");
            try {
              const options = optionText.split("\n").map((text, index) => ({
                text: text.trim(),
                label: text.trim(),
                isCorrect: index + 1 === Number(correctIndex),
                displayOrder: index + 1,
              }));
              const response = await fetch("/api/admin/quiz/questions", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ categoryCode, type: "TEXT_MULTIPLE_CHOICE", prompt, options }),
              });
              if (!response.ok) throw new Error("question-save-failed");
              setPrompt("");
              setOptionText("");
              setMessage(ko ? "문제를 저장했습니다. 새로고침하면 목록에 표시됩니다." : "Question saved. Refresh to see it in the list.");
            } catch {
              setMessage(ko ? "문제를 저장하지 못했습니다." : "Failed to save the question.");
            }
          })()}
          type="button"
        >
          {ko ? "텍스트 문제 저장" : "Save text question"}
        </button>
      </div>
      {message ? <p className="status-text">{message}</p> : null}
      <div className="stack-sm">
        {initialBank.questions.map((question) => {
          const category = categoryById.get(question.category_id);
          const options = optionsByQuestion.get(question.id) ?? [];
          return (
            <article className="table-row" key={question.id}>
              <strong>{category?.code ?? "UNKNOWN"} · {question.type}</strong>
              <span className="table-copy">{question.prompt}</span>
              <span className="meta-row">{question.active ? "active" : "disabled"} · {options.length} options</span>
              <ul className="stack-xs">
                {options.sort((left, right) => left.display_order - right.display_order).map((option) => (
                  <li key={option.id}>
                    {option.label ?? option.text ?? option.image_path ?? "(empty)"}{option.is_correct ? " ✓" : ""}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
