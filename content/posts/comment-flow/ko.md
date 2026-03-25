---
title: "댓글 흐름과 퀴즈 검증"
description: "Cloudflare Worker 1차 검증과 Next.js 최종 검증을 함께 사용하는 이유를 정리합니다."
publishedAt: "2026-03-24"
updatedAt: "2026-03-24"
tags: ["comments", "security"]
draft: false
locale: "ko"
slug: "comment-flow"
---

# 댓글 흐름과 퀴즈 검증

댓글 작성은 다음 순서로 진행됩니다.

1. 클라이언트가 Worker에서 퀴즈 문제를 받습니다.
2. 정답을 맞히면 짧은 수명의 서명 토큰을 발급합니다.
3. Next.js API는 토큰을 다시 검증한 뒤 Supabase에 댓글을 저장합니다.

이 흐름은 Worker만 신뢰하는 구조보다 안전하고, 운영 비용도 낮게 유지할 수 있습니다.
