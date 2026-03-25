---
title: "Comment flow and quiz verification"
description: "Why the app verifies the Worker-issued token again before writing comments to Supabase."
publishedAt: "2026-03-24"
updatedAt: "2026-03-24"
tags: ["comments", "security"]
draft: false
locale: "en"
slug: "comment-flow"
---

# Comment flow and quiz verification

Comment creation follows a small two-step flow.

1. The client asks the Worker for a quiz challenge.
2. A correct answer returns a short-lived signed verification token.
3. The Next.js API verifies that token again before writing to Supabase.

That keeps the edge layer useful without making it the only line of defense.
