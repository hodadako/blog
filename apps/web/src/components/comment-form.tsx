"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppLocale } from "@/lib/site";
import { WorkerApiError, workerRequest } from "@/lib/worker-client";
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
}: CommentFormProps) {
  const router = useRouter();
  const [quizStatus, setQuizStatus] = useState<"loading" | "ready" | "frontend-only">("loading");
  const [authorizationToken, setAuthorizationToken] = useState("");
  const [quizKey, setQuizKey] = useState(0);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [author, setAuthor] = useState("");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const shouldShowFields = quizStatus === "ready" && Boolean(authorizationToken);

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, []);

  function resetQuizAfterAuthorizationFailure(): void {
    setAuthorizationToken("");
    setQuizStatus("loading");
    setQuizKey((current) => current + 1);
  }

  async function submitComment(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!authorizationToken || submitting) return;
    setSubmitting(true);
    setSubmitMessage("");
    try {
      await workerRequest<{ commentId: string }>("/comments", {
        method: "POST",
        body: JSON.stringify({
          canonicalSlug,
          content,
          password,
          parentId: parentId ?? null,
          author,
          authorizationToken,
          idempotencyKey,
        }),
      });
      setContent("");
      setPassword("");
      setIdempotencyKey(crypto.randomUUID());
      setSubmitMessage(locale === "ko" ? "댓글을 등록했습니다." : "Comment posted.");
      router.refresh();
    } catch (error) {
      if (error instanceof WorkerApiError && (error.code === "invalid-authorization" || error.code === "authorization-invalid")) {
        setSubmitMessage(locale === "ko" ? "인증이 만료되었습니다. 입력한 내용은 유지한 채 다시 퀴즈를 풀어 주세요." : "Authorization expired. Your draft is preserved; solve the quiz again.");
        resetQuizAfterAuthorizationFailure();
      } else if (error instanceof WorkerApiError && error.code === "rate-limited") {
        setSubmitMessage(locale === "ko" ? "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." : "Too many requests. Please try again later.");
      } else {
        setSubmitMessage(locale === "ko" ? "댓글을 등록하지 못했습니다." : "The comment could not be posted.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="surface-card stack-md">
      <div className="stack-sm">
        <h2 className="card-title">{heading}</h2>
        <p className="card-copy">{helperText}</p>
      </div>

      <form className="form-grid" onSubmit={(event) => void submitComment(event)}>
        <QuizGate
          key={quizKey}
          labels={quizLabels}
          locale={locale}
          onAuthorizationExpired={resetQuizAfterAuthorizationFailure}
          onAuthorizationTokenChange={setAuthorizationToken}
          onStatusChange={setQuizStatus}
          slug={canonicalSlug}
        />

        {shouldShowFields ? (
          <>
            {parentId ? <p className="status-text">{parentLabel}</p> : null}

            <div className="comment-form__identity">
              <label className="field">
                <span className="field__label">{authorLabel}</span>
                <input className="field__input" maxLength={80} name="author" onChange={(event) => setAuthor(event.target.value)} required type="text" value={author} />
              </label>

              <label className="field">
                <span className="field__label">{passwordLabel}</span>
                <input className="field__input" maxLength={72} minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
              </label>
            </div>

            <label className="field">
              <span className="field__label">{contentLabel}</span>
              <textarea className="field__textarea comment-form__textarea" maxLength={5000} name="content" onChange={(event) => setContent(event.target.value)} required value={content} />
            </label>

            <div className="button-row">
              <button className="button" disabled={submitting || !author.trim() || password.length < 8 || !content.trim()} type="submit">
                {submitting ? "…" : submitLabel}
              </button>
            </div>
          </>
        ) : null}
        {submitMessage ? <p className="status-text">{submitMessage}</p> : null}
      </form>
      <input name="redirectTo" type="hidden" value={redirectTo} />
    </section>
  );
}
