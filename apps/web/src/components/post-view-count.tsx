"use client";

import { useEffect, useState } from "react";

interface PostViewCountProps {
  canonicalSlug: string;
  label: string;
  incrementOnMount?: boolean;
}

export function PostViewCount({ canonicalSlug, label, incrementOnMount = false }: PostViewCountProps) {
  const [viewCount, setViewCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(): Promise<void> {
      try {
        const encodedSlug = encodeURIComponent(canonicalSlug);
        const response = await fetch(`/api/post-views/${encodedSlug}`, {
          method: incrementOnMount ? "POST" : "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { viewCount?: number };

        if (!cancelled && typeof payload.viewCount === "number") {
          setViewCount(payload.viewCount);
        }
      } catch {
        return;
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [canonicalSlug, incrementOnMount]);

  if (viewCount === null) {
    return null;
  }

  return (
    <>
      <span>·</span>
      <span>{`${viewCount.toLocaleString()} ${label}`}</span>
    </>
  );
}
