# 블로그 모노레포

## Repository layout

```txt
apps/
  web/                        # Next.js App Router 웹 애플리케이션
content/
  posts/
    <slug>/
      ko.md
      en.md
infra/
  cloudflare-worker/          # 댓글 퀴즈 검증 Worker
  pulumi/                     # 인프라 관리
  supabase/                   # 댓글 관련 스키마/마이그레이션
packages/                     # 공용 패키지 영역 (현재 비어 있음)
```

## 사용한 스택

- pnpm workspace
- Next.js App Router
- Supabase
- Cloudflare Worker
- Pulumi
- Vercel
