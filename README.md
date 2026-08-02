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

## 댓글 개발 흐름

```bash
pnpm install
pnpm --dir infra/cloudflare-worker dev
pnpm --filter web dev
```

`apps/web/.env.example`과 `infra/cloudflare-worker/.dev.vars.example`을 기준으로 로컬 환경 변수를 설정한다. `QUIZ_TOKEN_SECRET`은 Web과 Worker에서 같은 값을 사용하며 실제 값은 저장소에 커밋하지 않는다.

Supabase migration과 DB 테스트는 다음 위치에 있다.

```txt
infra/supabase/migrations/
infra/supabase/tests/
```

로컬 Supabase와 Docker가 실행 중일 때 다음 명령으로 DB 회귀 테스트를 실행한다.

```bash
pnpm exec supabase test db --workdir infra
```

전체 TypeScript 및 단위 테스트:

```bash
pnpm typecheck
pnpm test
pnpm --dir infra/cloudflare-worker typecheck
```
