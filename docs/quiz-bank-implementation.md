# 문제은행형 댓글 퀴즈 구현 보고서

작성일: 2026-08-03

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

기존 댓글의 `scrypt$...` 비밀번호 해시는 Worker Web Crypto에서 검증하지 않는다. 새 Worker 댓글은 `pbkdf2-sha256$120000$...` 형식으로 저장된다. 기존 댓글 수정·삭제를 계속 지원하려면 별도 Worker 호환 scrypt 마이그레이션 또는 읽기 시점 재해싱이 필요하다.

## 8. 테스트 현황

실행한 명령과 결과:

```text
pnpm --filter web test                         3 files / 9 tests PASS
pnpm --filter web typecheck                    PASS
pnpm --dir infra/cloudflare-worker typecheck   PASS
pnpm --dir infra/cloudflare-worker test        3 tests PASS
pnpm exec supabase test db --local --workdir infra  2 files / 30 tests PASS
pnpm --dir infra/cloudflare-worker exec wrangler deploy --dry-run PASS
```

검증 범위에는 RLS 직접 쓰기 차단, 문제당 5개·정답 1개, Challenge 응답 정답 비노출, 허용되지 않은 Option 거부, Challenge 재사용 거부, 기존 댓글 인증 회귀 테스트가 포함된다. Worker 실제 배포 환경의 Supabase Secret과 운영 RPC를 호출하는 E2E는 Secret 노출을 피하기 위해 별도 배포 검증으로 남아 있다.

## 9. 변경 파일

| 경로 | 핵심 변경 |
| --- | --- |
| `infra/supabase/migrations/0003_quiz_bank_and_worker_api.sql` | 문제은행·Challenge·권한·댓글 원자 RPC·Seed |
| `infra/supabase/migrations/0004_seed_general_quiz.sql` | GENERAL 문제 Seed |
| `infra/supabase/migrations/0005_quiz_admin_question_rpc.sql` | 문제 관리 원자 RPC |
| `infra/supabase/migrations/0006_persist_quiz_failures.sql` | 오답/만료 Challenge 상태 영속화 |
| `infra/supabase/tests/quiz_bank.sql` | 16개 문제은행/RLS/RPC 테스트 |
| `infra/cloudflare-worker/src/index.ts` | Worker API 전체 구현 |
| `infra/cloudflare-worker/wrangler.jsonc` | Supabase/GitHub 공개 변수와 Custom Domain |
| `apps/web/src/lib/worker-client.ts` | 공개 Worker API 클라이언트 |
| `apps/web/src/lib/worker-admin.ts` | 관리자 Worker 프록시 |
| `apps/web/src/components/quiz-gate.tsx` | 텍스트·이미지 오지선다 UI |
| `apps/web/src/components/comment-form.tsx` | Worker 댓글 작성과 초안 보존 |
| `apps/web/src/components/admin-quiz-bank.tsx` | 문제은행 관리자 조회 UI |
| `docs/architecture/target-architecture.md` | Worker 신뢰 경계 설계 문서 |

## 10. 남은 작업

- Cloudflare Worker에 `SUPABASE_SERVICE_ROLE_KEY`, `COMMENT_AUTHORIZATION_SECRET`, `IP_HASH_SECRET`, `INVITE_TOKEN_PEPPER`, `COMMENT_PASSWORD_PEPPER`, `ADMIN_API_SECRET` Secret 주입
- 운영 Supabase에 0003/0004 마이그레이션 적용 확인
- 기존 scrypt 댓글의 Worker 수정·삭제 호환 처리
- 실제 라이선스를 확인한 MUSIC 이미지 파일을 GitHub에 추가하고 비활성 문제를 활성화
- 관리자 문제 생성·수정 UI와 문제 통계/신고 관리
- 운영 도메인을 `api.hodako.dev`로 바꿀 경우 DNS Custom Domain과 `NEXT_PUBLIC_QUIZ_WORKER_URL` 동시 변경
