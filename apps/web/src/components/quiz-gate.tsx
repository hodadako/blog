"use client";

import { useEffect, useMemo, useState } from "react";
import { type AppLocale } from "@/lib/site";
import type { QuizChallenge, QuizVerificationResult } from "@/lib/types";

interface QuizGateProps {
  locale: AppLocale;
  slug: string;
  onStatusChange?: (status: "loading" | "ready" | "frontend-only") => void;
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

const QUIZ_REQUEST_TIMEOUT_MS = 5000;

function createTimedSignal(timeoutMs: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

export function QuizGate({ locale, slug, onStatusChange, labels }: QuizGateProps) {
  const workerUrl = process.env.NEXT_PUBLIC_QUIZ_WORKER_URL;
  const [challenge, setChallenge] = useState<QuizChallenge | null>(null);
  const [answer, setAnswer] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [authorizationToken, setAuthorizationToken] = useState("");
  const [message, setMessage] = useState(labels.loading);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    onStatusChange?.("loading");
    void fetch(`/api/comment-authorizations?canonicalSlug=${encodeURIComponent(slug)}`, {
      signal: createTimedSignal(QUIZ_REQUEST_TIMEOUT_MS),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load challenge configuration.");
        }
        return await response.json() as { type: "configured" | "generated"; prompt?: string };
      })
      .then(async (configuration) => {
        if (configuration.type === "configured" && configuration.prompt) {
          return { prompt: configuration.prompt, expiresAt: "" } satisfies QuizChallenge;
        }

        if (!workerUrl) {
          throw new Error("Quiz worker is unavailable.");
        }

        const response = await fetch(`${workerUrl}/challenge?slug=${encodeURIComponent(slug)}&locale=${encodeURIComponent(locale)}`, {
          signal: createTimedSignal(QUIZ_REQUEST_TIMEOUT_MS),
        });

        if (!response.ok) {
          throw new Error("Failed to load generated challenge.");
        }

        return await response.json() as QuizChallenge;
      })
      .then((nextChallenge) => {
        setChallenge(nextChallenge);
        setMessage("");
      })
      .catch(() => {
        setChallenge(null);
        setMessage(labels.unavailable);
      });
  }, [labels.loading, labels.unavailable, locale, onStatusChange, slug, workerUrl]);

  const isAuthorized = Boolean(authorizationToken);
  const isQuizDisabled = useMemo(
    () => submitting || isAuthorized || !challenge || answer.trim().length === 0,
    [answer, challenge, isAuthorized, submitting],
  );
  const isInviteDisabled = submitting || isAuthorized || inviteToken.trim().length === 0;

  async function requestAuthorization(body: Record<string, string>): Promise<void> {
    setSubmitting(true);

    try {
      const response = await fetch("/api/comment-authorizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canonicalSlug: slug, ...body }),
        signal: createTimedSignal(QUIZ_REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error("Authorization failed.");
      }

      const payload = await response.json() as QuizVerificationResult;
      setAuthorizationToken(payload.authorizationToken);
      setAnswer("");
      setInviteToken("");
      setMessage(labels.verified);
      onStatusChange?.("ready");
    } catch {
      setMessage(labels.unavailable);
      onStatusChange?.("frontend-only");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stack-sm">
      <input name="authorizationToken" type="hidden" value={authorizationToken} />
      <p className="card-copy">{message}</p>
      {challenge ? (
        <>
          <label className="field">
            <span className="field__label">{labels.question}</span>
            <input className="field__input" readOnly type="text" value={challenge.prompt} />
          </label>
          <label className="field">
            <span className="field__label">{labels.answer}</span>
            <input className="field__input" disabled={isAuthorized} onChange={(event) => setAnswer(event.target.value)} type="text" value={answer} />
          </label>
          <div className="button-row">
            <button
              className="button button--secondary"
              disabled={isQuizDisabled}
              onClick={() => void requestAuthorization({
                ...(challenge.challengeToken ? { challengeToken: challenge.challengeToken } : {}),
                quizAnswer: answer,
              })}
              type="button"
            >
              {isAuthorized ? labels.verified : labels.verify}
            </button>
          </div>
        </>
      ) : null}
      <label className="field">
        <span className="field__label">{locale === "ko" ? "초대 토큰" : "Invite token"}</span>
        <input
          autoComplete="off"
          className="field__input"
          disabled={isAuthorized}
          onChange={(event) => setInviteToken(event.target.value)}
          type="password"
          value={inviteToken}
        />
      </label>
      <div className="button-row">
        <button
          className="button button--secondary"
          disabled={isInviteDisabled}
          onClick={() => void requestAuthorization({ inviteToken })}
          type="button"
        >
          {locale === "ko" ? "초대 토큰 사용" : "Use invite token"}
        </button>
      </div>
    </div>
  );
}
