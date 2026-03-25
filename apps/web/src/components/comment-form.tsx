"use client";

import {useMemo, useState} from "react";
import type {AppLocale} from "@/lib/site";
import { QuizGate } from "@/components/quiz-gate";

interface CommentFormProps {
  locale: AppLocale;
  canonicalSlug: string;
  parentId?: string | null;
  heading: string;
  helperText: string;
  redirectTo: string;
  submitLabel: string;
  authorLabel: string;
  passwordLabel: string;
  contentLabel: string;
  parentLabel: string;
  quizLabels: {
    loading: string;
    question: string;
    answer: string;
    verify: string;
    verified: string;
    unavailable: string;
    frontendOnly: string;
  };
  fallbackNotice?: string;
}

export function CommentForm({
  locale,
  canonicalSlug,
  parentId,
  heading,
  helperText,
  redirectTo,
  submitLabel,
  authorLabel,
  passwordLabel,
  contentLabel,
  parentLabel,
  quizLabels,
  fallbackNotice,
}: CommentFormProps) {
  const [quizStatus, setQuizStatus] = useState<"loading" | "ready" | "frontend-only">("loading");
  const shouldShowFields = quizStatus === "ready";
  const activeNotice = useMemo(() => {
    if (quizStatus !== "frontend-only") {
      return undefined;
    }

    return fallbackNotice;
  }, [fallbackNotice, quizStatus]);

  return (
    <section className="surface-card stack-md">
      <div className="stack-sm">
        <h2 className="card-title">{heading}</h2>
        <p className="card-copy">{helperText}</p>
      </div>

      <form action="/api/comments" className="form-grid" method="post">
        <input name="canonicalSlug" type="hidden" value={canonicalSlug} />
        <input name="locale" type="hidden" value={locale} />
        <input name="redirectTo" type="hidden" value={redirectTo} />
        <input name="parentId" type="hidden" value={parentId ?? ""} />

        <QuizGate labels={quizLabels} locale={locale} onStatusChange={setQuizStatus} slug={canonicalSlug} />

        {shouldShowFields ? (
          <>
            {parentId ? <p className="status-text">{parentLabel}</p> : null}

            <label className="field">
              <span className="field__label">{authorLabel}</span>
              <input className="field__input" maxLength={80} name="author" required type="text" />
            </label>

            <label className="field">
              <span className="field__label">{passwordLabel}</span>
              <input className="field__input" maxLength={40} name="password" required type="password" />
            </label>

            <label className="field">
              <span className="field__label">{contentLabel}</span>
              <textarea className="field__textarea" name="content" required />
            </label>

            <div className="button-row">
              <button className="button" type="submit">
                {submitLabel}
              </button>
            </div>
          </>
        ) : null}

        {activeNotice ? <p className="status-text">{activeNotice}</p> : null}
      </form>
    </section>
  );
}
