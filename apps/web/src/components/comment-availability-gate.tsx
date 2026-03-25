"use client";

import {useEffect, useState, type ReactNode} from "react";
import type {AppLocale} from "@/lib/site";

interface CommentAvailabilityGateProps {
  locale: AppLocale;
  slug: string;
  children: ReactNode;
}

const QUIZ_REQUEST_TIMEOUT_MS = 2500;

function createTimedSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

export function CommentAvailabilityGate({locale, slug, children}: CommentAvailabilityGateProps) {
  const workerUrl = process.env.NEXT_PUBLIC_QUIZ_WORKER_URL;
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    if (!workerUrl) {
      setIsAvailable(false);
      return;
    }

    void fetch(`${workerUrl}/challenge?slug=${encodeURIComponent(slug)}&locale=${encodeURIComponent(locale)}`, {
      signal: createTimedSignal(QUIZ_REQUEST_TIMEOUT_MS),
    })
      .then((response) => {
        setIsAvailable(response.ok);
      })
      .catch(() => {
        setIsAvailable(false);
      });
  }, [locale, slug, workerUrl]);

  if (!isAvailable) {
    return null;
  }

  return <>{children}</>;
}
