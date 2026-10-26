"use client";

import {QuizOptions} from "@/components/quiz-options";
import {Button, Input, Tag} from "@/components/ui";

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
    quizIncorrect: string;
    inviteFailed: string;
    unavailable: string;
    frontendOnly: string;
  };
}

const QUIZ_REQUEST_TIMEOUT_MS = 8000;

function statusMessage(error: unknown, labels: QuizGateProps["labels"], method: "quiz" | "invite"): string {
  if (error instanceof WorkerApiError && method === "quiz" && error.code === "quiz-answer-incorrect") {
    return labels.quizIncorrect;
  }
  if (error instanceof WorkerApiError && method === "invite" && error.code === "invalid-invite-token") {
    return labels.inviteFailed;
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
      setMessage(statusMessage(error, labels, "quiz"));
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
      setMessage(statusMessage(error, labels, "invite"));
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
            <Tag aria-label={challenge.category.name}>{challenge.category.name}</Tag>
            <p className="quiz-challenge__prompt">{challenge.question.prompt}</p>
          </div>
          <QuizOptions options={challenge.options} value={selectedOptionId} onValueChange={setSelectedOptionId} label={labels.answer} imageChoices={challenge.question.type === "IMAGE_MULTIPLE_CHOICE"} />
          <div className="button-row">
            <Button variant="secondary" disabled={!canVerify} onClick={() => void verifySelectedOption()} type="button">
              {isAuthorized ? labels.verified : labels.verify}
            </Button>
          </div>
        </fieldset>
      ) : null}
      {!isAuthorized ? (
        <div className="quiz-invite">
          <label className="field">
            <span className="field__label">{locale === "ko" ? "초대 토큰" : "Invite token"}</span>
            <Input
              autoComplete="off"

              disabled={submitting}
              onChange={(event) => setInviteToken(event.target.value)}
              type="password"
              value={inviteToken}
            />
          </label>
          <div className="button-row">
            <Button variant="secondary" disabled={!canUseInvite} onClick={() => void useInviteToken()} type="button">
              {locale === "ko" ? "초대 토큰 사용" : "Use invite token"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
