---
title: "A low-cost multilingual blog architecture"
description: "How to combine Vercel, GitHub, Supabase, and Cloudflare for a practical low-ops publishing stack."
publishedAt: "2026-03-25"
updatedAt: "2026-03-25"
tags: ["nextjs", "supabase", "cloudflare"]
draft: false
locale: "en"
slug: "low-cost-stack"
---

# A low-cost multilingual blog architecture

This project uses **GitHub as the content source**, **Supabase for comments**, **Cloudflare Worker for quiz verification**, and **Vercel for SSR delivery**.

## Core principles

- Posts do not live in the database.
- Only comments are dynamic.
- Locale-aware routes are explicit.
- Admin access is a single password plus a signed cookie session.

## Operations

Posts are edited directly in `content/posts/{slug}/{locale}.md` and deployed through normal Git commits.

That keeps publishing simple and versioned without adding a separate CMS.
