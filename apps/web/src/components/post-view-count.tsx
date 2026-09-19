"use client";

import { useEffect, useState } from "react";
import { getPostViewCount, recordPostView } from "@/lib/post-views";

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
        const nextCount = incrementOnMount
          ? await recordPostView(canonicalSlug)
          : await getPostViewCount(canonicalSlug);

        if (!cancelled) {
          setViewCount(nextCount);
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
