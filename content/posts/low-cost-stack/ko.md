---
title: "저비용 다국어 블로그 아키텍처"
description: "Vercel, GitHub, Supabase, Cloudflare 조합으로 운영 비용을 낮추는 구조를 설명합니다."
publishedAt: "2026-03-25"
updatedAt: "2026-03-25"
tags: ["nextjs", "supabase", "cloudflare"]
draft: false
locale: "ko"
slug: "low-cost-stack"
---

# 저비용 다국어 블로그 아키텍처

이 프로젝트는 **GitHub를 콘텐츠 저장소**, **Supabase를 댓글 저장소**, **Cloudflare Worker를 퀴즈 검증 계층**, **Vercel을 SSR 런타임**으로 사용합니다.

## 핵심 원칙

- 포스트는 DB에 저장하지 않습니다.
- 댓글만 동적으로 저장합니다.
- locale 기반 URL을 사용합니다.
- 관리자는 단일 비밀번호와 서명 쿠키로 접근합니다.

## 운영 방식

포스트는 `content/posts/{slug}/{locale}.md` 파일을 로컬에서 직접 수정하고 Git으로 배포합니다.

즉, 별도 CMS 없이도 콘텐츠 이력이 남고 운영이 단순해집니다.
