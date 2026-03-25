"use client";

import { useEffect, useMemo, useState } from "react";
import { type AppLocale } from "@/lib/site";
import type { QuizChallenge, QuizVerificationResult } from "@/lib/types";

interface QuizGateProps {
  locale: AppLocale;
  slug: string;
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

const QUIZ_REQUEST_TIMEOUT_MS = 2500;

function createTimedSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

export function QuizGate({ locale, slug, labels }: QuizGateProps) {
  const workerUrl = process.env.NEXT_PUBLIC_QUIZ_WORKER_URL;
  const [challenge, setChallenge] = useState<QuizChallenge | null>(null);
  const [answer, setAnswer] = useState("");
  const [verifiedToken, setVerifiedToken] = useState("");
  const [message, setMessage] = useState(labels.loading);
  const [workerAvailable, setWorkerAvailable] = useState(false);

  useEffect(() => {
    if (!workerUrl) {
      setWorkerAvailable(false);
      setMessage(labels.frontendOnly);
      return;
    }

    void fetch(`${workerUrl}/challenge?slug=${encodeURIComponent(slug)}&locale=${encodeURIComponent(locale)}`, {
      signal: createTimedSignal(QUIZ_REQUEST_TIMEOUT_MS),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load challenge.");
        }

        return (await response.json()) as QuizChallenge;
      })
      .then((payload) => {
        setWorkerAvailable(true);
        setChallenge(payload);
        setMessage("");
      })
      .catch(() => {
        setWorkerAvailable(false);
        setChallenge(null);
        setMessage(labels.frontendOnly);
      });
  }, [labels.frontendOnly, locale, slug, workerUrl]);

  const isDisabled = useMemo(() => !workerAvailable || !challenge || Boolean(verifiedToken), [challenge, verifiedToken, workerAvailable]);

  async function verify(): Promise<void> {
    if (!workerUrl || !challenge || !workerAvailable) {
      return;
    }

    const response = await fetch(`${workerUrl}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        slug,
        locale,
        challengeToken: challenge.challengeToken,
        answer,
      }),
      signal: createTimedSignal(QUIZ_REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      setWorkerAvailable(false);
      setChallenge(null);
      setMessage(labels.frontendOnly);
      return;
    }

    const payload = (await response.json()) as QuizVerificationResult;
    setVerifiedToken(payload.verifiedToken);
    setMessage(labels.verified);
  }

  return (
    <div className="stack-sm">
      <input name="quizToken" type="hidden" value={verifiedToken} />
      <input name="quizStatus" type="hidden" value={workerAvailable ? "ready" : "frontend-only"} />
      <p className="card-copy">{message}</p>
      {workerAvailable && challenge ? (
        <>
          <label className="field">
            <span className="field__label">{labels.question}</span>
            <input className="field__input" readOnly type="text" value={challenge.prompt} />
          </label>
          <label className="field">
            <span className="field__label">{labels.answer}</span>
            <input className="field__input" onChange={(event) => setAnswer(event.target.value)} type="text" value={answer} />
          </label>
          <div className="button-row">
            <button className="button button--secondary" disabled={isDisabled || answer.trim().length === 0} onClick={() => void verify()} type="button">
              {verifiedToken ? labels.verified : labels.verify}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
