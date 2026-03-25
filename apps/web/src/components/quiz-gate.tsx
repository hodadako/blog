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
  };
}

export function QuizGate({ locale, slug, labels }: QuizGateProps) {
  const workerUrl = process.env.NEXT_PUBLIC_QUIZ_WORKER_URL;
  const [challenge, setChallenge] = useState<QuizChallenge | null>(null);
  const [answer, setAnswer] = useState("");
  const [verifiedToken, setVerifiedToken] = useState("");
  const [message, setMessage] = useState(labels.loading);

  useEffect(() => {
    if (!workerUrl) {
      setMessage(labels.unavailable);
      return;
    }

    void fetch(`${workerUrl}/challenge?slug=${encodeURIComponent(slug)}&locale=${encodeURIComponent(locale)}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load challenge.");
        }

        return (await response.json()) as QuizChallenge;
      })
      .then((payload) => {
        setChallenge(payload);
        setMessage("");
      })
      .catch(() => {
        setMessage(labels.unavailable);
      });
  }, [labels.loading, labels.unavailable, locale, slug, workerUrl]);

  const isDisabled = useMemo(() => !workerUrl || !challenge || Boolean(verifiedToken), [challenge, verifiedToken, workerUrl]);

  async function verify(): Promise<void> {
    if (!workerUrl || !challenge) {
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
    });

    if (!response.ok) {
      setMessage(labels.unavailable);
      return;
    }

    const payload = (await response.json()) as QuizVerificationResult;
    setVerifiedToken(payload.verifiedToken);
    setMessage(labels.verified);
  }

  return (
    <div className="stack-sm">
      <input name="quizToken" type="hidden" value={verifiedToken} />
      <p className="card-copy">{message}</p>
      {challenge ? (
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
