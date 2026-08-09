"use client";

import { useEffect, useMemo, useState } from "react";
import { type AppLocale } from "@/lib/site";
import type { QuizChallenge, QuizVerificationResult } from "@/lib/types";
import { WorkerApiError, requestInviteAuthorization, requestQuizChallenge, verifyQuizChallenge } from "@/lib/worker-client";

interface QuizGateProps {
  locale: AppLocale;
  slug: string;
  onStatusChange?: (status: "loading" | "ready" | "frontend-only") => void;
  onAuthorizationTokenChange?: (token: string) => void;
  onAuthorizationExpired?: () => void;
  labels: {
    loading: string;
    question: string;
    answer: string;
    verify: string;
    verified: string;
    unavailable: string;
    frontendOnly: string;
  };
}

const QUIZ_REQUEST_TIMEOUT_MS = 8000;

function createTimedSignal(timeoutMs: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

function statusMessage(error: unknown, labels: QuizGateProps["labels"]): string {
  if (error instanceof WorkerApiError && error.code === "quiz-answer-incorrect") {
    return labels.unavailable;
  }
  if (error instanceof WorkerApiError && error.code === "rate-limited") {
    return labels.unavailable;
  }
  return labels.frontendOnly;
}

export function QuizGate({ locale, slug, onStatusChange, onAuthorizationTokenChange, onAuthorizationExpired, labels }: QuizGateProps) {
  const [challenge, setChallenge] = useState<QuizChallenge | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [authorizationToken, setAuthorizationToken] = useState("");
  const [message, setMessage] = useState(labels.loading);
  const [submitting, setSubmitting] = useState(false);
  const [imageFailures, setImageFailures] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    onStatusChange?.("loading");
    setMessage(labels.loading);
    void (async () => {
      try {
        const nextChallenge = await Promise.race([
          requestQuizChallenge(slug),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), QUIZ_REQUEST_TIMEOUT_MS)),
        ]);
        if (cancelled) return;
        setChallenge(nextChallenge);
        setMessage("");
      } catch {
        if (cancelled) return;
        setChallenge(null);
        setMessage(labels.unavailable);
        onStatusChange?.("frontend-only");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [labels.loading, labels.unavailable, onStatusChange, slug]);

  const isAuthorized = Boolean(authorizationToken);
  const canVerify = useMemo(
    () => Boolean(challenge && selectedOptionId && !submitting && !isAuthorized),
    [challenge, isAuthorized, selectedOptionId, submitting],
  );
  const canUseInvite = !submitting && !isAuthorized && inviteToken.trim().length >= 32;

  async function completeAuthorization(result: QuizVerificationResult): Promise<void> {
    setAuthorizationToken(result.authorizationToken);
    onAuthorizationTokenChange?.(result.authorizationToken);
    setSelectedOptionId("");
    setInviteToken("");
    setMessage(labels.verified);
    onStatusChange?.("ready");
  }

  async function verifySelectedOption(): Promise<void> {
    if (!challenge || !selectedOptionId || submitting) return;
    setSubmitting(true);
    try {
      const result = await verifyQuizChallenge(challenge.challengeId, selectedOptionId);
      await completeAuthorization(result);
    } catch (error) {
      setMessage(statusMessage(error, labels));
      onStatusChange?.("frontend-only");
      if (error instanceof WorkerApiError && (error.code === "invalid-authorization" || error.code === "challenge-expired-or-used")) {
        setChallenge(null);
        onAuthorizationExpired?.();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function useInviteToken(): Promise<void> {
    if (!inviteToken.trim() || submitting) return;
    setSubmitting(true);
    try {
      const result = await requestInviteAuthorization(slug, inviteToken.trim());
      await completeAuthorization(result);
    } catch (error) {
      setMessage(statusMessage(error, labels));
      onStatusChange?.("frontend-only");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="quiz-gate stack-sm" aria-live="polite">
      <input name="authorizationToken" type="hidden" value={authorizationToken} />
      {message ? <p className={isAuthorized ? "quiz-gate__status quiz-gate__status--verified" : "quiz-gate__status"}>{message}</p> : null}
      {challenge && !isAuthorized ? (
        <fieldset className="quiz-challenge stack-sm" disabled={submitting}>
          <legend className="field__label">{labels.question}</legend>
          <div className="quiz-challenge__header">
            <span className="pill" aria-label={challenge.category.name}>{challenge.category.name}</span>
            <p className="quiz-challenge__prompt">{challenge.question.prompt}</p>
          </div>
          <div className={challenge.question.type === "IMAGE_MULTIPLE_CHOICE" ? "quiz-options quiz-options--image" : "quiz-options"} role="radiogroup" aria-label={labels.answer}>
            {challenge.options.map((option, index) => {
              const failed = imageFailures.has(option.id);
              const optionText = option.label ?? option.text;
              return (
                <button
                  aria-checked={selectedOptionId === option.id}
                  aria-label={optionText ?? option.altText ?? `${labels.answer} ${index + 1}`}
                  className={selectedOptionId === option.id ? "quiz-option quiz-option--selected" : "quiz-option"}
                  key={option.id}
                  onClick={() => setSelectedOptionId(option.id)}
                  role="radio"
                  type="button"
                >
                  {option.imageUrl && !failed ? (
                    <img
                      alt={option.altText ?? option.label ?? `${labels.answer} ${index + 1}`}
                      className="quiz-option__image"
                      loading="lazy"
                      onError={() => setImageFailures((current) => new Set(current).add(option.id))}
                      src={option.imageUrl}
                    />
                  ) : null}
                  <span className="quiz-option__caption">
                    <span aria-hidden="true" className="quiz-option__number">{index + 1}</span>
                    {optionText ? <span className="quiz-option__label">{optionText}</span> : null}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="button-row">
            <button className="button button--secondary" disabled={!canVerify} onClick={() => void verifySelectedOption()} type="button">
              {isAuthorized ? labels.verified : labels.verify}
            </button>
          </div>
        </fieldset>
      ) : null}
      {!isAuthorized ? (
        <div className="quiz-invite">
          <label className="field">
            <span className="field__label">{locale === "ko" ? "초대 토큰" : "Invite token"}</span>
            <input
              autoComplete="off"
              className="field__input"
              disabled={submitting}
              onChange={(event) => setInviteToken(event.target.value)}
              type="password"
              value={inviteToken}
            />
          </label>
          <div className="button-row">
            <button className="button button--secondary" disabled={!canUseInvite} onClick={() => void useInviteToken()} type="button">
              {locale === "ko" ? "초대 토큰 사용" : "Use invite token"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
