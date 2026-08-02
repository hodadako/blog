"use client";

import { useState } from "react";
import type { AppLocale } from "@/lib/site";
import type { CommentQuizItem } from "@/lib/types";

interface AdminCommentQuizzesProps {
  initialItems: CommentQuizItem[];
  locale: AppLocale;
}

export function AdminCommentQuizzes({ initialItems, locale }: AdminCommentQuizzesProps) {
  const [items, setItems] = useState(initialItems);
  const [canonicalSlug, setCanonicalSlug] = useState("");
  const [prompt, setPrompt] = useState("");
  const [answers, setAnswers] = useState("");
  const [message, setMessage] = useState("");
  const ko = locale === "ko";

  async function saveQuiz(): Promise<void> {
    setMessage("");
    const response = await fetch("/api/admin/comment-quizzes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        canonicalSlug,
        prompt,
        answers: answers.split("\n"),
      }),
    });

    if (!response.ok) {
      setMessage(ko ? "퀴즈 저장에 실패했습니다." : "Failed to save quiz.");
      return;
    }

    const result = await response.json() as { item: CommentQuizItem };
    setItems((current) => [result.item, ...current.filter((item) => item.canonicalSlug !== result.item.canonicalSlug)]);
    setCanonicalSlug("");
    setPrompt("");
    setAnswers("");
    setMessage(ko ? "퀴즈를 저장했습니다." : "Quiz saved.");
  }

  async function disableQuiz(slug: string): Promise<void> {
    const response = await fetch("/api/admin/comment-quizzes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canonicalSlug: slug }),
    });

    if (response.ok) {
      setItems((current) => current.map((item) => item.canonicalSlug === slug ? { ...item, isActive: false } : item));
    }
  }

  return (
    <section className="surface-card stack-md">
      <div className="stack-sm">
        <h2 className="card-title">{ko ? "글별 댓글 퀴즈" : "Post comment quizzes"}</h2>
        <p className="card-copy">
          {ko
            ? "정답은 NFKC·공백 축약·소문자 정규화 후 HMAC으로만 저장합니다. 복수 정답은 한 줄에 하나씩 입력하세요."
            : "Answers are normalized and stored only as HMACs. Enter one accepted answer per line."}
        </p>
      </div>
      <div className="form-grid">
        <label className="field">
          <span className="field__label">canonicalSlug</span>
          <input className="field__input" onChange={(event) => setCanonicalSlug(event.target.value)} value={canonicalSlug} />
        </label>
        <label className="field">
          <span className="field__label">{ko ? "문제" : "Prompt"}</span>
          <input className="field__input" maxLength={500} onChange={(event) => setPrompt(event.target.value)} value={prompt} />
        </label>
        <label className="field">
          <span className="field__label">{ko ? "허용 정답" : "Accepted answers"}</span>
          <textarea className="field__textarea" onChange={(event) => setAnswers(event.target.value)} value={answers} />
        </label>
        <button className="button button--secondary" disabled={!canonicalSlug.trim() || !prompt.trim() || !answers.trim()} onClick={() => void saveQuiz()} type="button">
          {ko ? "퀴즈 저장" : "Save quiz"}
        </button>
      </div>
      {message ? <p className="status-text">{message}</p> : null}
      <div className="stack-sm">
        {items.map((item) => (
          <div className="table-row" key={item.canonicalSlug}>
            <strong>{item.canonicalSlug}</strong>
            <span className="table-copy">{item.prompt}</span>
            <span className="meta-row">{item.updatedAt} · {item.isActive ? "active" : "disabled"}</span>
            {item.isActive ? (
              <button className="button button--secondary" onClick={() => void disableQuiz(item.canonicalSlug)} type="button">
                {ko ? "비활성화" : "Disable"}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
