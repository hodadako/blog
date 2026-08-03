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

`apps/web/.env.example`과 `infra/cloudflare-worker/.dev.vars.example`을 기준으로 로컬 환경 변수를 설정한다. 댓글·퀴즈의 Supabase Service Role Key와 권한 서명/토큰 Pepper는 Worker Secret으로만 주입하며 실제 값은 저장소에 커밋하지 않는다. 브라우저가 사용하는 값은 `NEXT_PUBLIC_QUIZ_WORKER_URL`뿐이다.

문제은행과 댓글 흐름은 [문제은행 구현 보고서](docs/quiz-bank-implementation.md)와 [아키텍처 문서](docs/architecture/target-architecture.md)에 정리되어 있다. 이미지 문제는 `quiz_options.image_path`에 GitHub 상대 경로를 저장하고, 실제 저작권 확인 전에는 비활성 상태로 유지한다.

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

# Worker 배포 전 검증
pnpm --dir infra/cloudflare-worker exec wrangler deploy --dry-run
```
