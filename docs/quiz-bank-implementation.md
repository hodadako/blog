# 문제은행형 댓글 퀴즈 구현 보고서

작성일: 2026-08-03
마지막 진행 기록: 2026-08-06

## 1. 기존 구조 분석

기존 운영 경로는 Next.js `/api/comment-authorizations`가 퀴즈·초대 토큰을 Supabase Service Role로 직접 확인하고, `/api/comments`가 서명 토큰을 확인한 뒤 Supabase RPC `create_authorized_comment`을 호출하는 방식이었다. Cloudflare Worker `/challenge`는 Worker 메모리에서 사칙연산을 만들고 서명 토큰에 문제 숫자를 넣었다. 이 방식은 문제은행, DB Challenge 상태, 동시성 제어가 없었다.

이번 변경에서 실제 공개 댓글 흐름은 `QuizGate → Worker → Supabase RPC`로 바뀌었다. Next.js API Route는 레거시 호환용 프록시만 수행하며 Supabase를 직접 호출하지 않는다. 기존 `/challenge`는 410을 반환한다.

## 2. 최종 아키텍처

```text
Next.js UI
  → Cloudflare Worker (quiz.hodako.dev)
    → Supabase REST/RPC/PostgreSQL

이미지 선택지: Browser → GitHub Raw 공개 URL
```

- Next.js: 게시물 Markdown, `canonicalSlug`, 문제·선택지 표시, 댓글 입력/UX, 관리자 세션
- Worker: 게시물·카테고리 검증, Challenge 발급/검증, 초대 토큰 교환, 권한 검증·소비, 댓글 CRUD, Rate Limit, IP HMAC
- Supabase: 모든 지속 상태와 원자적 RPC
- GitHub: 이미지 파일만 저장

## 3. Supabase 변경

### 테이블·제약

- `quiz_categories`: 코드 Unique, 표시 이름, 활성 상태
- `quiz_questions`: 카테고리, `TEXT_MULTIPLE_CHOICE`/`IMAGE_MULTIPLE_CHOICE`, 버전과 활성 상태
- `quiz_options`: 텍스트/상대 이미지 경로, alt text, 정답 여부, 표시 순서
- `post_threads.quiz_category_id`: 게시물과 댓글 퀴즈 카테고리 연결
- `quiz_challenges`: 문제 버전, 허용 Option ID 배열, 정답 ID, 상태, 만료·검증 시각, IP Hash
- `comment_idempotencies_v2`: 권한 ID·요청 Hash·댓글 결과·TTL

모든 새 테이블에 RLS를 활성화하고 `anon`/`authenticated`의 직접 Table 권한을 철회했다. 활성 문제에 대해 Deferred Constraint Trigger가 선택지 5개, 정답 1개, 문제 유형별 텍스트/이미지 필드를 검사한다.

### RPC

- `issue_quiz_challenge`: 게시물 카테고리와 활성 문제를 선택하고 선택지 순서를 섞어 Challenge와 공개 문제 JSON을 생성
- `verify_quiz_challenge_and_issue_authorization`: Challenge `FOR UPDATE`, 1회 제출·만료·정답 검사, 퀴즈 권한 발급
- `issue_invite_comment_authorization`: HMAC된 다회용 초대 토큰을 검증해 글 귀속 권한 발급
- `create_comment_with_authorization`: 권한 잠금, Idempotency, blacklist·Rate Limit, 같은 글의 depth-0 부모 검사, 댓글 Insert와 권한 소비를 한 트랜잭션에서 처리

### Seed

`0003_quiz_bank_and_worker_api.sql`, `0004_seed_general_quiz.sql`에 DEVOPS/BACKEND/DATABASE/GENERAL 텍스트 문제를 추가했다. `0005_quiz_admin_question_rpc.sql`은 선택지 5개·정답 1개를 트랜잭션으로 저장하는 관리자 RPC를 추가하고, `0006_persist_quiz_failures.sql`은 오답 Challenge의 `FAILED` 상태를 Rollback 없이 남긴다. MUSIC은 실제 저작권 이미지 없이 비활성 Placeholder 구조만 Seed했다.

## 4. Worker 변경

파일: `infra/cloudflare-worker/src/index.ts`

- Supabase REST/RPC 호출은 `SUPABASE_SERVICE_ROLE_KEY` Secret을 사용하는 `supabaseRequest`/`supabaseRpc`로만 수행
- `POST /quiz/challenges`: 5개 선택지와 카테고리·질문만 반환. 정답 필드와 관리자 해설은 반환하지 않음
- `POST /quiz/challenges/{id}/verify`: `selectedOptionId`만 받아 RPC에서 정답 검증 후 단기 HMAC 권한 발급
- `POST /comment-authorizations`: 초대 토큰을 HMAC 비교하고 글 귀속 권한 발급
- `POST /comments`: `COMMENT_WRITE`/`canonicalSlug`/만료를 HMAC 검증하고 PBKDF2 비밀번호를 만든 뒤 원자 RPC 호출
- `PATCH|DELETE /comments/{id}`: Worker에서 PBKDF2 비밀번호 검증 후 Soft Delete/수정
- `/admin/*`: `ADMIN_API_SECRET`로 보호된 댓글·초대 토큰·문제은행 조회/관리 경로
- `/post-views/*`: 조회수도 Worker → Supabase 경로로 전환
- `CF-Connecting-IP`만 신뢰하고 HMAC된 IP만 Supabase에 저장
- 기존 사칙연산 `/challenge`는 `legacy-challenge-disabled` 410

`wrangler.jsonc`에는 Worker URL, Supabase URL, GitHub 이미지 Base URL만 공개 변수로 두고 Secret은 `.dev.vars.example`에 이름만 선언했다. 실제 Secret 값은 저장소에 포함하지 않는다.

## 5. Next.js UI 변경

- `apps/web/src/components/quiz-gate.tsx`: 서버가 섞은 5개 선택지를 Radio 역할 버튼으로 표시하고 텍스트/이미지 문제를 모두 처리. 이미지에는 `alt`, lazy loading, 실패 Fallback, 선택 상태가 있다.
- `apps/web/src/components/comment-form.tsx`: Worker에 직접 댓글을 제출하고 `idempotencyKey`를 유지한다. 권한 만료 시 입력 중인 작성자·비밀번호·본문을 지운 뒤 다시 받지 않고 QuizGate만 재시작한다.
- `apps/web/src/lib/worker-client.ts`: 브라우저/서버의 Worker API 호출과 오류 코드를 표준화한다.
- 게시물 페이지와 조회수 컴포넌트는 Worker의 댓글 조회/조회수 API를 사용한다.
- `commentQuizCategory`를 Front Matter 타입과 파서에 추가했다. Worker는 Front Matter를 직접 신뢰하지 않고 Supabase `post_threads` 매핑을 최종 신뢰한다.

## 6. 원자성·동시성

- Challenge 검증은 DB 행 잠금 후 상태를 변경하므로 같은 Challenge의 동시 제출 중 하나만 성공한다.
- 권한 소비와 댓글 Insert는 같은 RPC 트랜잭션이다.
- 같은 Idempotency Key와 같은 Request Hash는 기존 댓글 ID를 재생하고, 다른 Hash는 Conflict다.
- 요청 Timeout이나 재시도도 DB에 기록된 Idempotency 결과를 사용한다.
- 실패한 트랜잭션에서는 댓글·권한 소비·Idempotency 기록이 함께 Rollback된다.

## 7. 보안 검토

### 해결된 항목

- 브라우저/Next.js 공개 경로에서 Supabase 직접 Insert·Update·Delete 차단
- 정답·`is_correct`·정답 ID를 Challenge 응답에 포함하지 않음
- Service Role Key를 Worker Secret으로 분리
- 초대 토큰 원문 대신 HMAC 저장, 다회용·글 비종속·폐기 가능
- Challenge와 댓글 권한을 Supabase 상태로 1회 소비
- 다른 글의 부모 댓글과 depth 1 초과를 RPC에서 거부
- IP 원문 대신 Cloudflare Client IP HMAC 저장
- Supabase 원자 Rate Limit과 동일 내용 60초 중복 방지

### 남은 호환 주의점

기존 댓글의 `scrypt$...` 비밀번호 해시는 Worker Web Crypto에서 검증하지 않는다. 새 Worker 댓글은 `pbkdf2-sha256$100000$...` 형식으로 저장된다. Cloudflare Workers Web Crypto가 100,000회를 초과하는 PBKDF2 반복 횟수를 거부하므로 이 값으로 고정했다. 기존 댓글 수정·삭제를 계속 지원하려면 별도 Worker 호환 scrypt 마이그레이션 또는 읽기 시점 재해싱이 필요하다.

## 8. 테스트 현황

실행한 명령과 결과:

```text
pnpm --filter web test                         3 files / 9 tests PASS
pnpm --filter web typecheck                    PASS
volta run --node 24.18.0 pnpm --dir infra/cloudflare-worker typecheck   PASS
volta run --node 24.18.0 pnpm --dir infra/cloudflare-worker test        4 tests PASS
pnpm exec supabase test db --local --workdir infra  2 files / 30 tests PASS
pnpm --dir infra/cloudflare-worker exec wrangler deploy --dry-run PASS
운영 E2E (quiz.hodako.dev)                     발급·검증·댓글·삭제 PASS
```

검증 범위에는 RLS 직접 쓰기 차단, 문제당 5개·정답 1개, Challenge 응답 정답 비노출, 허용되지 않은 Option 거부, Challenge 재사용 거부, 기존 댓글 인증 회귀 테스트, Workers 호환 PBKDF2 댓글 저장 테스트가 포함된다. 운영 E2E는 임시 댓글을 생성한 뒤 비밀번호 Soft Delete하고 최종 `deleted` 상태를 확인했다.

## 9. 변경 파일

| 경로 | 핵심 변경 |
| --- | --- |
| `infra/supabase/migrations/0003_quiz_bank_and_worker_api.sql` | 문제은행·Challenge·권한·댓글 원자 RPC·Seed |
| `infra/supabase/migrations/0004_seed_general_quiz.sql` | GENERAL 문제 Seed |
| `infra/supabase/migrations/0005_quiz_admin_question_rpc.sql` | 문제 관리 원자 RPC |
| `infra/supabase/migrations/0006_persist_quiz_failures.sql` | 오답/만료 Challenge 상태 영속화 |
| `infra/supabase/tests/quiz_bank.sql` | 16개 문제은행/RLS/RPC 테스트 |
| `infra/cloudflare-worker/src/index.ts` | Worker API 전체 구현, Workers 호환 PBKDF2 비밀번호 해싱 |
| `infra/cloudflare-worker/src/index.spec.ts` | 댓글 저장·PBKDF2 회귀 테스트 |
| `infra/cloudflare-worker/wrangler.jsonc` | Supabase/GitHub 공개 변수와 Custom Domain |
| `apps/web/src/lib/worker-client.ts` | 공개 Worker API 클라이언트 |
| `apps/web/src/lib/worker-admin.ts` | 관리자 Worker 프록시 |
| `apps/web/src/components/quiz-gate.tsx` | 텍스트·이미지 오지선다 UI |
| `apps/web/src/components/comment-form.tsx` | Worker 댓글 작성과 초안 보존 |
| `apps/web/src/components/admin-quiz-bank.tsx` | 문제은행 관리자 조회 UI |
| `docs/architecture/target-architecture.md` | Worker 신뢰 경계 설계 문서 |

## 10. 2026-08-06 진행 기록

지난 중단 지점 이후 운영 오류를 확인하고 Worker Secret과 댓글 비밀번호 해시 구현을 보완했다. Secret 값 자체는 문서와 로그에 기록하지 않는다.

### 완료·확인된 상태

- 커밋 `b380946` (`feat(quiz): 문제은행형 댓글 인증 흐름 구현`)을 `origin/main`에 Push했다.
- GitHub Quality 실행 `30828594629`가 성공했다. 웹 테스트 9개, Worker 테스트 3개, 타입 검사, 웹 빌드, Worker 타입 검사와 배포 dry-run을 포함한다.
- GitHub Supabase Migrations 실행 `30828594365`가 성공했고, 원격 Supabase에 `0001`부터 `0007`까지 적용됐다.
- 로컬 Supabase pgTAP은 2개 파일, 30개 테스트가 통과했다.
- Worker를 `quiz.hodako.dev`에 배포했다. 현재 배포 버전은 `a59f3f3a-e7b6-458a-a983-8f30b442855a`다.
- Worker Secret은 값 자체를 기록하지 않고 다음 이름으로 등록했다: `SUPABASE_SERVICE_ROLE_KEY`, `COMMENT_PASSWORD_PEPPER`, `COMMENT_AUTHORIZATION_SECRET`, `IP_HASH_SECRET`, `INVITE_TOKEN_PEPPER`, `ADMIN_API_SECRET`, 기존 `QUIZ_TOKEN_SECRET`.
- Vercel Production/Preview에 `WORKER_ADMIN_SECRET`을 등록했다. Development 환경은 Vercel CLI의 sensitive 환경 변수 제약으로 등록하지 않았다.
- 위 배포의 Challenge Smoke Test가 `Invalid API key`로 500을 반환하는 것을 Worker 로그에서 확인했다. Supabase 프로젝트 API에서 유효한 `service_role` 키를 확인해 Worker의 `SUPABASE_SERVICE_ROLE_KEY` Secret을 교체했다.
- Secret 교체 후 Challenge 발급은 HTTP 200으로 복구됐다. 운영 응답에는 `GENERAL` 카테고리와 5개 선택지만 포함되고 정답 필드는 포함되지 않았다.
- 운영 E2E 중 댓글 저장이 PBKDF2 반복 횟수 `120000` 때문에 Cloudflare Workers Web Crypto에서 실패하는 것을 확인했다. `infra/cloudflare-worker/src/index.ts`의 새 댓글 해시 반복 횟수를 `100000`으로 고정하고, 검증도 같은 형식만 허용하도록 수정했다.
- 수정 Worker를 `quiz.hodako.dev`에 다시 배포했다. 현재 코드 수정 배포 버전은 `ac09da68-4cfc-42bf-896f-5fcc6a13c3ea`다.
- 운영 E2E가 성공했다: Challenge 발급 `200` → 정답 검증·권한 발급 `201` → 댓글 저장 `201` → 비밀번호 삭제 `200`. 테스트 댓글은 최종 조회에서 `deleted` 상태임을 확인했다.

### 현재 상태와 남은 확인 사항

- 문제은행 Challenge와 2단계 댓글 인증의 운영 경로는 현재 E2E 기준으로 동작한다.
- 이번 작업에서 Worker 코드·회귀 테스트·진행 문서 변경을 커밋·Push했다. 커밋은 `a74dd91` (`fix(worker): Workers 댓글 비밀번호 해싱 호환성 수정`)이다.
- 기존 댓글의 `scrypt$...` 비밀번호 해시를 Worker 수정·삭제 API에서 검증하지 못하는 호환성 문제는 남아 있다.
- Vercel에 남아 있는 `SUPABASE_SERVICE_ROLE_KEY`는 Next.js 런타임에서 더 이상 사용하지 않는지 확인한 뒤 제거 여부를 결정해야 한다.

## 11. 내일 재개할 작업

우선순위 순서로 정리한다.

### P0 — 커밋·배포 이력 정리

- PBKDF2 `100000` 반복 횟수 수정과 문서 변경을 커밋·Push한다.
- CI에서 Worker 테스트와 배포 dry-run이 Node 24로 실행되는지 확인한다.

### P1 — 운영 보안 정리

- 실제 런타임에서 더 이상 사용하지 않는 것이 확인되면 Vercel에 남아 있는 `SUPABASE_SERVICE_ROLE_KEY`를 제거한다.
- 기존 `scrypt$...` 댓글의 Worker 수정·삭제 호환 처리(마이그레이션 또는 읽기 시점 재해싱)를 결정한다.

### P2/P3 — 데이터·운영 개선

- 라이선스를 확인한 MUSIC 이미지와 실제 문제를 GitHub에 추가하고, 파일명으로 정답을 추측할 수 없는지 검토한다.
- 관리자 문제 생성·수정 UI를 운영 환경에서 검증하고, 문제 통계·신고 관리 기능을 추가한다.
- 운영 API 도메인을 `api.hodako.dev`로 사용할지 현재의 `quiz.hodako.dev`를 유지할지 결정한다. 변경 시 DNS Custom Domain과 `NEXT_PUBLIC_QUIZ_WORKER_URL`을 함께 갱신한다.
