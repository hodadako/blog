# 댓글 및 퀴즈 시스템 구현 현황 감사

> 상태 메모(2026-08-03): 이 문서는 개선 전 기준선 감사다. 이후 구현된 1회용 권한, Idempotency, RLS, 글별 퀴즈, 초대 토큰, Rate Limit 및 관리자 기능의 현재 설계는 `docs/architecture/target-architecture.md`를 기준으로 한다.

- 분석 기준일: 2026-08-03 (Asia/Seoul)
- 비교 기준: 퀴즈 또는 다회용 초대 토큰을 먼저 검증해 짧은 수명의 글별 댓글 작성 권한을 발급하고, 별도 댓글 요청에서 권한을 검증·소비하는 2단계 설계
- 분석 대상: 현재 `main` 작업 트리의 Next.js, Cloudflare Worker, Supabase migration, Pulumi, 문서, 테스트 및 확인 가능한 운영 설정
- 변경 범위: 애플리케이션 코드와 기존 설정은 변경하지 않았고 이 분석 문서만 갱신했다.

## 조사 범위와 방법

다음 파일을 이름만 검색하지 않고 실제 호출 방향으로 읽었다.

- 공개 페이지와 UI
  - `apps/web/src/app/[locale]/blog/[slug]/page.tsx`
  - `apps/web/src/components/post-comments-panel.tsx`
  - `apps/web/src/components/comment-form.tsx`
  - `apps/web/src/components/comment-list.tsx`
  - `apps/web/src/components/quiz-gate.tsx`
  - `apps/web/src/components/comment-availability-gate.tsx`
- Next.js API와 server code
  - `apps/web/src/app/api/comments/route.ts`
  - `apps/web/src/app/api/comments/[id]/route.ts`
  - `apps/web/src/app/api/admin/**`
  - `apps/web/src/lib/comments.ts`
  - `apps/web/src/lib/quiz-token.ts`
  - `apps/web/src/lib/supabase.ts`
  - `apps/web/src/lib/auth.ts`
  - `apps/web/src/lib/env.ts`
  - `apps/web/src/lib/content.ts`
  - `apps/web/src/middleware.ts`
- Worker와 인프라
  - `infra/cloudflare-worker/src/index.ts`
  - `infra/cloudflare-worker/wrangler.toml`
  - `infra/supabase/migrations/0001_baseline.sql`
  - `infra/supabase/config.toml`
  - `infra/pulumi/index.ts`
  - `.github/workflows/supabase-migrations.yml`
- 문서와 테스트
  - `README.md`
  - `docs/architecture/target-architecture.md`
  - 전체 test/spec/e2e 파일, package script 및 test framework 검색

Durable Object, KV, D1, Rate Limiting binding, invite token, comment authorization 저장소, Idempotency 관련 구현도 전체 저장소에서 검색했다. Supabase `config.toml`의 `[auth.rate_limit]`은 Supabase Auth 자체 설정이며 댓글 API Rate Limit으로 호출되지 않으므로 댓글 구현으로 세지 않았다.

정적 분석 외에 실제 데이터를 바꾸지 않는 운영 진단을 수행했다.

- `quiz.hodako.dev` challenge 응답과 signed payload를 확인했다.
- 브라우저와 같은 CORS preflight를 `/verify`에 보냈다.
- `api.hodako.dev`, `quiz.hodako.dev`, `www.hodako.dev`의 DNS 상태를 확인했다.
- Supabase anon key로 관련 table/view를 조회했다.
- 빈 객체 INSERT와 존재하지 않는 UUID 대상 UPDATE/DELETE로 권한 계층 통과 여부만 확인했다. 실제 행은 생성·수정·삭제되지 않았다.
- Vercel Production 환경 변수는 이름과 존재 여부만 확인했고 값은 읽거나 기록하지 않았다.
- Web과 Worker TypeScript 검사를 실행했다.

플랫폼 동작 판단에는 다음 공식 자료를 참고했다.

- [Supabase: Securing your data](https://supabase.com/docs/guides/database/secure-data)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase: Securing your API](https://supabase.com/docs/guides/api/securing-your-api)
- [Vercel: Request headers](https://examples.vercel.com/docs/headers/request-headers)
- [Cloudflare Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)

## 1. 요약

**등급: 일부 핵심 구조가 다름**

1. 퀴즈 경로에는 목표한 2단계 골격이 있다. Worker가 정답 검증 후 5분짜리 signed pass token을 발급하고, Next.js 댓글 API가 그 token을 검증한 뒤 저장한다.
2. pass token은 댓글용 목적(`typ`), 특정 글(`slug`), UUID `jti`, 발급·만료 시각을 포함하며 원본 정답은 넣지 않는다. 다른 글, 만료 token, 다른 목적 token은 댓글 API에서 거부한다.
3. 그러나 초대 토큰 branch는 UI·Worker·Next.js·DB·관리자 어디에도 없다. 따라서 “퀴즈 또는 초대 토큰” 중 퀴즈만 부분 구현됐다.
4. 권한은 stateless HMAC token이고 `jti`를 저장하거나 소비하지 않는다. 같은 token을 만료 전 여러 번 또는 동시에 사용할 수 있으며 폐기 기능도 없다.
5. `idempotencyKey`와 요청 hash/result 저장소가 전혀 없어 network retry와 동시 요청이 중복 댓글을 만들 수 있다. 댓글 저장과 권한 소비를 묶는 transaction도 없다.
6. 퀴즈는 글별 관리형이 아니라 모든 slug에 즉석 덧셈을 발급하며, challenge token의 Base64 payload에 정답 원문이 포함되어 검증을 자동 우회할 수 있다.
7. canonical slug 기반 다국어 thread 공유, server-side service-role 접근, scrypt 댓글 비밀번호, 수정·soft delete는 정상 구현된 부분이다.
8. 반면 게시물 존재·부모 thread/depth·입력값 검증, Rate Limit, 정확한 proxy IP 처리가 없고 Supabase anon 직접 CRUD가 허용되는 심각한 방어 공백이 있다.
9. 운영 Worker의 `/verify` CORS preflight가 현재 500이라 일반 browser에서는 권한 발급 단계가 실패한다. 관리자 필수 env도 Production에 없다.
10. 댓글·퀴즈·권한·RLS를 검증하는 자동화 test는 없다.

## 2. 현재 구현 흐름

### 댓글 작성 권한 발급

목표의 단일 `POST /comment-authorizations` 대신 challenge와 verify 두 endpoint를 사용한다.

```text
CommentForm
→ QuizGate useEffect
→ GET https://quiz.hodako.dev/challenge?slug={canonicalSlug}&locale={locale}
→ Worker GET /challenge
   → 1~9 덧셈 생성
   → answer/slug/locale/iat/exp를 담은 signed challengeToken 생성
→ QuizGate.verify()
→ POST https://quiz.hodako.dev/verify
   body: { slug, locale, challengeToken, answer }
→ Worker verifyChallengeToken
   → challenge signature/type/expiry 검증
   → challenge slug와 요청 slug 비교
   → answer.trim() exact 비교
→ comment_quiz_pass token 생성
   { v, typ, slug, anonId, iat, exp, jti }
→ { verifiedToken, expiresAt } 응답
→ React state 및 hidden input quizToken에 저장
```

근거:

- UI 진입: `apps/web/src/components/comment-form.tsx:54-60` `CommentForm`
- challenge 호출: `apps/web/src/components/quiz-gate.tsx:45-71` `useEffect`
- verify 호출: `apps/web/src/components/quiz-gate.tsx:76-107` `verify`
- hidden token: `apps/web/src/components/quiz-gate.tsx:110-113`
- challenge 발급: `infra/cloudflare-worker/src/index.ts:91-110`
- 정답 검증과 pass 발급: Worker `index.ts:113-136`

실제 권한 token 특성:

| 속성 | 현재 구현 |
| --- | --- |
| 형태 | JWT가 아닌 custom 2-part token: `base64url(JSON payload).base64url(HMAC-SHA256)` |
| 목적 | `typ: "comment_quiz_pass"` |
| 글 귀속 | `slug` claim |
| 식별자 | cryptographic random UUID `jti`, 별도 random UUID `anonId` |
| 유효기간 | `QUIZ_TTL_SECONDS=300`, 즉 5분 |
| 서명 | Worker와 Next.js가 공유하는 `QUIZ_TOKEN_SECRET` |
| 서버 상태 | 없음; KV/DO/D1/Supabase에 저장하지 않음 |
| 1회용 | 아님; `jti`를 기록·소비하지 않음 |
| 폐기 | 없음 |
| 원본 quiz answer | pass token에는 없음. 단, 앞 단계 challenge token에는 평문으로 있음 |
| 원본 invite token | invite 기능 자체가 없음 |

`apps/web/src/lib/quiz-token.ts:17`의 `issueQuizPassToken`도 같은 claim을 만드는 함수지만 현재 호출처가 없는 dead code다. 실제 Production token 발급자는 Worker의 `issueToken`이다.

권한 발급 입력 조합:

| 입력 | 실제 결과 |
| --- | --- |
| 유효한 `challengeToken` + 정답 | pass token 발급 |
| 오답 | 400 `invalid-answer` |
| 답 없음 | schema validation이 없어 `.trim()`에서 500 가능 |
| invite token만 | Worker가 필드를 읽지 않으며 발급 불가 |
| quiz answer + invite token | invite 필드는 무시되고 quiz branch만 처리 |
| 둘 다 없음 | 정상 4xx 계약이 아니라 malformed body에 따라 500 가능 |
| 존재하지 않는 slug | challenge 및 pass token 발급 가능 |

권한 token을 애플리케이션이 명시적으로 log하는 코드는 없다. token은 `/verify` JSON 응답, browser memory/DOM hidden input, `/api/comments` form body에 존재한다. Cloudflare/Vercel platform이 body를 별도로 수집하는지는 repository와 확인한 설정만으로는 **확인 불가**다.

### 댓글 작성

```text
CommentForm HTML form
→ POST /api/comments
   form: canonicalSlug, parentId, author, password, content,
         quizToken, quizStatus, locale, redirectTo
→ Next.js Route Handler POST
→ verifyQuizPassToken(quizToken, canonicalSlug)
   → HMAC signature 확인
   → typ === comment_quiz_pass 확인
   → token slug === request canonicalSlug 확인
   → exp > now 확인
→ getClientIp → hashCommentIp
→ createComment
   → isBlockedIpHash
   → getOrCreatePostThread
   → hashCommentPassword
   → comments INSERT
→ 303 redirect
→ 1년 blog_anon_id HttpOnly cookie 발급
```

근거:

- form endpoint: `apps/web/src/components/comment-form.tsx:54`
- 댓글 API: `apps/web/src/app/api/comments/route.ts:30` `POST`
- 권한 검증: `apps/web/src/lib/quiz-token.ts:33-53` `verifyQuizPassToken`
- 저장: `apps/web/src/lib/comments.ts:201-231` `createComment`

목표와 관련된 세부 동작:

- 원본 quiz answer와 invite token은 댓글 API가 읽지 않는다. 이 점은 목표와 일치한다.
- 목적, 만료, 글 일치는 확인한다. `v`, `iat`, `jti`, `anonId`의 type/shape와 issued-at future skew는 확인하지 않는다.
- 권한 사용 여부는 확인하지 않는다.
- 저장 전·후 어느 시점에도 권한을 소비하지 않는다.
- 저장 실패 시에도 token은 원래 만료 시각까지 유효하다.
- 저장 성공 후에도 같은 token은 계속 유효하다.
- 동시에 같은 token을 보내면 모든 요청이 독립적으로 HMAC 검증을 통과할 수 있다.
- `idempotencyKey`를 받거나 생성·저장·비교하지 않는다.
- blacklist SELECT, thread UPSERT, comment INSERT는 별도 Supabase HTTP 요청이며 하나의 transaction이 아니다.
- 별도 Server Action은 없다. `/api/comments` Route Handler가 write boundary다.
- `apps/web/src/middleware.ts:31-37`은 `/api`를 제외하며 댓글 인증을 대신하지 않는다.

### 댓글 조회

```text
GET /{locale}/blog/{localizedSlug}
→ BlogPostPage
→ post.canonicalSlug 계산
→ BlogCommentsSection
→ listPublishedComments(canonicalSlug)
→ server-side Supabase service-role client
→ comments_with_thread view SELECT
→ buildCommentTree
→ PostCommentsPanel → CommentList
```

- 페이지: `apps/web/src/app/[locale]/blog/[slug]/page.tsx:95-188`
- 조회: `apps/web/src/lib/comments.ts:161-174` `listPublishedComments`
- 트리: `apps/web/src/lib/comments.ts:120-159` `buildCommentTree`
- UI: `apps/web/src/components/comment-list.tsx:124-170`
- 별도 공개 댓글 GET API는 없다. Server Component가 DB를 조회한다.
- 조회 오류는 page의 `.catch(() => [])`로 빈 목록이 되어 장애와 0건을 구분하지 못한다 (`page.tsx:52-54`).

### 댓글 수정 및 삭제

```text
CommentList의 edit/delete link
→ query string으로 inline form 활성화
→ POST /api/comments/{commentId}
→ intent 분기
→ getCommentRow(commentId)
→ verifyCommentPassword(password, password_hash)
→ edit: body_markdown/body_html/updated_at UPDATE
→ delete: status=deleted, deleted_at=now, body 비움
→ 303 redirect
```

- UI: `apps/web/src/components/comment-list.tsx:63-99`
- API: `apps/web/src/app/api/comments/[id]/route.ts:8-27`
- 수정: `apps/web/src/lib/comments.ts:270-292` `updateComment`
- 삭제: `apps/web/src/lib/comments.ts:294-312` `deleteComment`
- pass token은 수정·삭제 API에서 읽지 않으므로 수정·삭제 권한으로 사용할 수 없다. 이 점은 목표와 일치한다.
- 수정·삭제에는 비밀번호 검증 외 Rate Limit, IP blacklist, 입력 길이 검증이 없다.

### 실제 데이터베이스 스키마

`infra/supabase/migrations/0001_baseline.sql` 기준이며 모든 object는 schema를 명시하지 않아 `public`에 생성된다.

#### `post_threads`

| 컬럼 | 타입/제약 | 사용 |
| --- | --- | --- |
| `id` | UUID PK | comments FK |
| `canonical_slug` | text NOT NULL UNIQUE | thread key |
| `comments_open` | boolean default true | 코드에서 미사용 |
| `view_count` | integer default 0 | 조회수 |
| `created_at` | timestamptz | 생성 시각 |

#### `comments`

| 컬럼 | 타입/제약 | 사용 |
| --- | --- | --- |
| `id` | UUID PK | comment ID |
| `post_thread_id` | UUID FK, thread 삭제 시 cascade | canonical thread 연결 |
| `parent_id` | nullable self-FK | 답글 부모 |
| `depth` | smallint, 0~1 check | parent가 있으면 1로 기록 |
| `author_name` | text NOT NULL | 작성자 이름 |
| `body_markdown`, `body_html` | text NOT NULL | 현재 둘 다 raw content 저장 |
| `status` | published/hidden/deleted check | 공개/검수 상태 |
| `deleted_at` | nullable timestamptz | soft delete |
| `password_hash` | text NOT NULL | scrypt hash |
| `quiz_verified_at` | timestamptz NOT NULL | token 발급 시각이 아니라 INSERT 시각 |
| `anon_id` | nullable text | 미사용 |
| `fingerprint_hash` | nullable text | 미사용 |
| `ip_hash` | nullable text | blacklist 연결 |
| `created_at`, `updated_at` | timestamptz | updated_at trigger 없음 |

#### 나머지 object

- `comment_ip_blacklist`: `ip_hash` PK, `source_comment_id` FK, `created_at`
- `comments_with_thread` view: comment와 canonical slug를 join하며 `password_hash`, `ip_hash`도 포함
- comment용 index: top-level partial, parent partial, thread/status/time, non-null IP hash
- `increment_post_view_count` function: 댓글 권한과 무관

존재하지 않는 schema:

- comment authorization / consumed authorization table
- invite token table
- idempotency key / request hash / previous result table
- quiz table
- rate limit event/counter table

## 3. 기능 비교표

| 항목 | 목표 요구사항 | 현재 구현 | 상태 | 근거 |
| --- | --- | --- | --- | --- |
| 인증 구조 | 검증 후 단기 권한 발급 | challenge→verify→pass token→comment의 2단계 | 일치 | Worker `index.ts:91-136`, `quiz-gate.tsx` |
| 권한 발급 endpoint | `POST /comment-authorizations` 예시 | `GET /challenge` + `POST /verify` | 부분 | Worker route 분기 |
| 퀴즈/초대 OR | 둘 중 하나로 권한 발급 | quiz만 지원 | 부분 | Worker `/verify`, invite 코드 없음 |
| 권한의 글 귀속 | canonicalSlug 귀속 | `slug` claim과 request slug 일치 검증 | 일치 | Worker `:128`, `quiz-token.ts:49` |
| 권한 유효기간 | 5~15분 | 300초 | 일치 | `wrangler.toml:11`, Worker `:131` |
| 권한 임의 식별자 | 충분히 긴 random ID | UUID `jti`, UUID `anonId` | 일치 | Worker `:129, 132` |
| 권한 목적 제한 | COMMENT_WRITE 전용 | `typ=comment_quiz_pass`를 검증 | 일치 | Worker `:127`, Next `quiz-token.ts:49` |
| 권한 서명/검증 | server signature 또는 store | HMAC-SHA256 shared secret | 일치 | Worker `sign`, Next `sign` |
| 권한 사용 횟수 | 가능하면 1회용 | 만료 전 무제한 재사용 | 불일치 | 저장/소비 호출 없음 |
| 권한 폐기 | 사용/관리 폐기 가능 | 없음 | 미구현 | authorization store 없음 |
| 권한 동시 사용 방지 | atomic consume | 없음 | 미구현 | DB/DO/KV binding 없음 |
| 원본 인증값 미포함 | short token에 answer/invite 없음 | pass token에는 없음 | 일치 | `PassClaims` |
| challenge 정답 보호 | client 미노출 | challenge token payload에 평문 answer | 불일치 | Worker `:6-14, 98-110` |
| 댓글 API | 단기 권한 검증 | `quizToken` HMAC 검증 | 일치 | comments route `:38-50` |
| 원본 quiz 재전송 | 댓글 API에는 없음 | 받지 않음 | 일치 | comments route fields |
| 장기 invite 재전송 | 댓글 API에는 없음 | invite 자체 미구현 | 부분 | invite field 없음 |
| Idempotency | key + request hash + 기존 결과 | key 자체 없음 | 미구현 | 전체 검색/schema |
| 권한 소비+저장 transaction | 원자 처리 | 소비 없음; DB 작업도 다중 요청 | 미구현 | `createComment` |
| 글 존재 확인 | 발급/저장 전 확인 | 둘 다 없음 | 미구현 | Worker 및 comments route |
| 글 식별 | canonicalSlug | content directory canonical slug | 일치 | `content.ts:255-282` |
| 다국어 공유 | 번역본 동일 thread | canonical slug로 공유 | 일치 | page와 `listPublishedComments` |
| 댓글 비밀번호 | 안전한 hash | salt+pepper+scrypt, timing-safe compare | 일치 | `comments.ts:29-56` |
| 수정/삭제 | 비밀번호 검증 | server-side 검증 후 update/soft delete | 일치 | `comments.ts:270-312` |
| 대댓글 | server가 깊이 1 강제 | 컬럼 check만 있고 부모 관계 검증 없음 | 부분 | migration `:13-15`, `createComment` |
| Rate Limit | 발급/CRUD/실패에 적용 | 없음 | 미구현 | binding/store/호출 없음 |
| IP blacklist | 저장 전 검증 | 정상 Next 경로에서 확인 | 부분 | `comments.ts:74-95, 209` |
| Fingerprint | 선택적 악용 대응 | 컬럼만 있고 미사용 | 미구현 | migration `:24` |
| 중복/스팸 방지 | 반복·동일 내용 방지 | 없음 | 미구현 | 전체 호출/schema |
| DB 직접 접근 차단 | server API만 write | RLS/REVOKE 없음, 운영 anon CRUD 통과 | 불일치 | migration 및 운영 진단 |
| Service Role 보호 | client 미노출 | server env 전용, tracked secret 없음 | 일치 | `supabase.ts`, `env.ts` |
| 관리자 quiz/invite | 발급·폐기 관리 | 댓글 moderation만 있음 | 미구현 | admin page/API |
| Worker 역할 | authorization + comment API 등 | quiz/pass token만, 댓글 DB는 Next.js | 부분 | Worker 전체, Next route |
| API domain | `api.hodako.dev` 예정 | `quiz.hodako.dev`; api 미연결 | 불일치 | `wrangler.toml`, DNS |
| 테스트 | 정상·예외·동시성·RLS | 관련 test 없음 | 미구현 | test/package 검색 |

## 4. 구현된 기능

### 4.1 퀴즈 기반 2단계 권한 발급 구조

- 기능: quiz answer 검증 요청과 comment 작성 요청을 분리하고, 사이에 short-lived signed token을 사용한다.
- 파일/함수:
  - `QuizGate.verify`: `apps/web/src/components/quiz-gate.tsx:76-107`
  - Worker `/verify`: `infra/cloudflare-worker/src/index.ts:113-136`
  - `verifyQuizPassToken`: `apps/web/src/lib/quiz-token.ts:33-53`
- 목표와 일치하는 이유: 원본 정답은 댓글 API로 재전송되지 않고, pass token을 별도 댓글 요청에서 검증한다. quiz 성공만으로 댓글이 자동 저장되지 않는다.

### 4.2 짧은 수명, 목적 및 글 귀속

- 기능: token은 5분 TTL, `comment_quiz_pass` type, slug, `jti`, `iat`, `exp`를 갖는다.
- 파일: Worker `index.ts:16-24, 123-136`, `wrangler.toml:10-11`
- 목표와 일치하는 이유:
  - 5분은 목표 5~15분 범위다.
  - 댓글 verifier는 type, slug, expiry를 확인한다.
  - 다른 글에서 token을 사용하면 `claims.slug !== expectedSlug`로 거부한다.
  - 수정·삭제 route는 token을 받지 않는다.
- 한계: random ID는 있지만 1회용 상태에 연결되지 않는다.

### 4.3 원본 인증값과 댓글 body 분리

- 기능: pass token에는 quiz answer가 없고 댓글 API는 answer/invite field를 읽지 않는다.
- 파일: Worker `PassClaims`, comments route `:31-39`
- 목표와 일치하는 이유: 댓글 작성 때 장기/원본 인증값을 반복 노출하지 않는 2단계 설계의 장점을 갖는다.
- 예외: challenge token 자체에는 answer가 들어 있어 quiz 비밀성은 깨진다.

### 4.4 canonical slug와 다국어 thread 공유

- 기능: `content/posts/{canonicalSlug}/{locale}.md`의 directory가 canonical key다.
- 파일/함수:
  - `readPostDirectory`: `apps/web/src/lib/content.ts:255-293`
  - `buildContentIndex`: `content.ts:311-362`
  - `BlogPostPage`: `apps/web/src/app/[locale]/blog/[slug]/page.tsx:156-184`
  - `listPublishedComments`: `comments.ts:161-174`
- 목표와 일치하는 이유: locale과 localized URL slug가 DB thread key에 포함되지 않는다. 같은 directory의 ko/en page가 같은 댓글을 조회한다.

### 4.5 server-side Supabase service-role 경로

- 기능: 정상 UI는 browser Supabase client가 아니라 Next.js route/server component를 거친다.
- 파일: `comment-form.tsx:54`, `apps/web/src/lib/supabase.ts:6-19`
- 장점: Worker에 service-role key를 추가로 배포하지 않아 secret surface를 줄이고 DB write logic을 Next.js에 집중한다.
- 목표와 일치하는 이유: 기술 위치가 Worker가 아니어도 server boundary라는 기능 요구는 만족한다.
- 중요한 예외: DB RLS/권한이 정상 경로를 강제하지 않는다.

### 4.6 댓글 비밀번호와 수정·soft delete

- 기능: 16-byte salt, secret pepper, scrypt 64-byte hash를 저장하고 `timingSafeEqual`로 비교한다.
- 파일: `comments.ts:29-56, 270-312`
- 목표와 일치하는 이유: 평문 비밀번호를 DB에 저장하지 않고 edit/delete 모두 server-side password 검증을 한다. 삭제는 행을 남기고 body를 비우는 soft delete다.
- 부모 삭제 시: 공개 조회가 deleted 부모를 포함하고 `normalizeCommentContent`가 `[deleted]`로 표시하므로 답글을 유지할 수 있다.

### 4.7 IP 원문 비저장과 blacklist 기본 경로

- 기능: IP 원문 대신 secret pepper가 포함된 SHA-256 hash를 저장하고, admin이 hash를 blacklist에 추가하며 create 전에 조회한다.
- 파일: comments route `:17-27`, `comments.ts:62-95, 201-253`
- 목표와 일치하는 이유: 정상 Next.js 경로에서 원문 IP를 DB에 남기지 않고 blacklist를 저장 전에 확인한다.
- 한계: header source와 DB 우회 문제로 실효성이 낮다.

### 4.8 현재 구조가 목표보다 단순하거나 적절한 부분

- **Stateless 검증**: HMAC token은 authorization 조회 없이 모든 Next.js instance가 검증할 수 있어 latency와 운영 요소가 적다.
- **DB credential 집중**: Worker가 Supabase에 접근하지 않고 Vercel server만 service-role을 보유하는 것은 secret 배포 면에서 단순하다.
- **역할이 드러나는 domain**: Worker가 quiz 전용인 현재 역할에는 `quiz.hodako.dev`가 `api.hodako.dev`보다 의미가 명확하다.
- **기술 선택 유연성**: 목표 기능은 반드시 Worker에서 DB를 써야만 충족되는 것이 아니다. Next.js가 authorization consume과 comment insert를 원자적으로 수행하도록 개선해도 된다.

이 장점들은 1회용·Idempotency 목표와 양립할 수 있다. signed token을 유지하되 `jti`의 상태만 DB/DO에 저장하거나, opaque token hash 저장 방식으로 보강하면 된다.

## 5. 부분 구현된 기능

### 5.1 댓글 작성 권한

- 구현됨: purpose, slug, issue/expiry time, random IDs, HMAC signature, 5분 TTL, comment API 검증.
- 빠짐: consumed/revoked state, atomic consume, replay protection, concurrency control, claim schema validation.
- 실제 문제: token 하나로 여러 댓글을 순차·동시에 만들 수 있고, 성공/실패와 무관하게 만료까지 계속 유효하다.
- 파일: Worker `PassClaims`, Next `verifyQuizPassToken`, Supabase migration 전체.

### 5.2 퀴즈

- 구현됨: server-side signature 확인과 answer 비교, 성공 시 pass token 발급.
- 빠짐: 글별 quiz source, answer 보호, 복수 정답/대소문자/연속 공백/특수문자 policy, quiz 없는 글 policy, brute-force Rate Limit.
- 정규화: `body.answer.trim()` 후 exact string compare만 한다. 숫자 덧셈이라 대소문자/복수 답은 현재 의미가 없다.
- 실제 문제: challenge payload decode만으로 answer를 얻을 수 있고 모든 slug에 quiz가 발급된다.
- 파일: Worker `index.ts:91-136`; Markdown/frontmatter와 DB에는 quiz field/table 없음.

### 5.3 대댓글

- 구현됨: `parent_id` FK, `depth` 0~1 check, UI tree.
- 빠짐: 부모 depth=0, same thread, status, canonical slug 관계 검증.
- 실제 문제:
  - reply에 reply를 반복해도 새 row의 depth를 항상 1로 기록해 check를 우회한다.
  - 다른 글 comment ID를 parent로 사용할 수 있다.
  - 존재하지 않는 parent는 FK가 거부하지만 사용자용 4xx가 아니라 DB error/500이 된다.
  - deleted/hidden parent에도 API상 reply를 만들 수 있다.
- 파일: migration `:13-15`, `comments.ts:201-225`, `comment-list.tsx:59-68`.

### 5.4 입력 검증

- 구현됨: browser `required`, author max 80, password max 40.
- 빠짐: server trim/empty/min/max, content size, UUID, locale, redirect URL, content type validation.
- 실제 문제: valid token을 가진 직접 POST는 빈 name/password/content 또는 과대 body를 보낼 수 있다.
- 파일: `comment-form.tsx:66-79`, comments routes.

### 5.5 IP blacklist와 익명 식별

- 구현됨: IP hash와 blacklist table/admin action.
- 빠짐: trusted proxy boundary, unblacklist, expiry/reason/audit, fingerprint, token `anonId`와 cookie/DB 연결.
- 실제 문제:
  - 운영 `www.hodako.dev`는 Cloudflare proxy를 거치는데 code는 `x-forwarded-for`를 `cf-connecting-ip`보다 우선한다.
  - Vercel 공식 문서상 앞단 proxy가 있으면 XFF를 overwrite하므로 실제 사용자보다 Cloudflare egress가 hash될 가능성이 높다.
  - Worker의 `anonId`, 성공 후 `blog_anon_id` cookie, DB `anon_id`가 서로 연결되지 않는다.
- 파일: comments route `:4, 17-27, 61-67`, migration `:23-25`.

### 5.6 관리자 기능

- 구현됨: single-password signed cookie, comment list, publish/hide, IP blacklist 추가.
- 빠짐: quiz 관리, invite 발급/폐기, authorization 조회/폐기, blacklist 해제, pagination/audit log.
- 운영 문제: Vercel Production에 `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`이 없어 login POST가 필수 env 오류를 낸다.
- 파일: `apps/web/src/lib/auth.ts`, admin pages/routes, Vercel env 이름 확인.

### 5.7 인프라 자동화

- 구현됨: Wrangler Worker config, blog DNS와 GitHub quiz secret Pulumi resource, Supabase migration workflow.
- 빠짐: Pulumi의 Worker script/custom domain/runtime secret/Vercel env/Supabase ownership, Worker deploy workflow, staging env.
- 실제 문제: Worker와 Next.js shared secret rotation이 수동이며 한쪽만 바뀌면 모든 pass token이 거부된다.
- 파일: `infra/pulumi/index.ts`, `.github/workflows`, `wrangler.toml`.

## 6. 구현되지 않은 기능

### 6.1 장기 다회용 초대 토큰

UI, Worker, Next.js, DB schema, admin을 모두 확인했지만 구현이 없다.

- invite 입력 UI 없음
- invite verification endpoint 없음
- invite hash/active/revoked/created/expires 관련 table 없음
- 특정 글 short authorization으로 교환하는 logic 없음
- 관리자 발급·원문 1회 표시·폐기 기능 없음
- 사용 횟수 또는 비감소 정책을 표현하는 schema 없음

따라서 평문 저장/글 귀속/만료/활성 상태/다회용 여부도 구현 단계에서는 해당 사항이 없고, 목표 기준으로는 모두 미구현이다.

### 6.2 권한 소비 및 폐기

- `jti`를 DB/KV/DO에 저장하지 않는다.
- `consumed_at`, `revoked_at`이나 unique authorization ID가 없다.
- 댓글 성공 전/후 consume 함수가 없다.
- 동일 token 동시 사용을 막는 compare-and-set/transaction이 없다.

현재는 “소비 순서가 잘못됐다”가 아니라 **소비라는 동작 자체가 없다**.

### 6.3 Idempotency

- 댓글 request에 `idempotencyKey` field가 없다.
- client-generated UUID가 없다.
- key + request body hash + comment/result를 저장하는 table이 없다.
- 같은 key/same body 재시도 반환, same key/different body 거부 policy가 없다.
- expiry/cleanup policy가 없다.
- authorization consume, comment insert, idempotency result를 묶는 transaction이 없다.

따라서 browser/network retry 또는 사용자의 double submit이 여러 comment를 만들 수 있다.

### 6.4 Rate Limit과 스팸 방지

다음 모두 없다.

- challenge 발급 횟수 제한
- quiz 실패 횟수 제한
- invite 검증 제한
- authorization 발급 제한
- comment create/edit/delete 제한
- admin login 제한
- 반복 comment/동일 내용/금칙어/spam filter
- server restart/여러 instance에 공유되는 counter

Cloudflare KV, Durable Object, D1, Rate Limiting binding도 없다. 저장소 밖 WAF/Vercel Firewall 수동 rule은 **확인 불가**이며 코드/IaC로 재현되지 않는다.

### 6.5 게시물 및 댓글 허용 상태 검증

- Worker는 전달된 모든 slug에 challenge/pass token을 발급한다.
- comments route는 content index에서 published canonical slug를 찾지 않는다.
- `getOrCreatePostThread`가 사용자 slug를 그대로 upsert한다.
- `post_threads.comments_open`을 읽지 않는다.

존재하지 않거나 draft/삭제된 slug도 authorization 발급과 thread/comment 저장이 가능하다.

### 6.6 DB access control

baseline migration에는 다음이 없다.

- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- RLS policy
- anon/authenticated privilege REVOKE
- public view 제한
- `comments_with_thread`의 `security_invoker=true`

운영 anon 요청도 직접 SELECT와 write privilege layer 통과를 확인했으므로 단순 검색 누락이 아니다.

### 6.7 자동화 test

댓글, quiz, authorization, invite, Idempotency, RLS, Worker runtime을 검증하는 test file/script/config가 없다.

## 7. 목표 설계와 다르게 구현된 기능

### 7.1 authorization API가 challenge/verify로 분리됨

```text
목표 설계:
POST /comment-authorizations가 quizAnswer 또는 inviteToken을 받아 short authorization을 발급한다.

현재 구현:
GET /challenge로 문제와 challengeToken을 받고 POST /verify에 answer를 제출해 verifiedToken을 받는다. invite branch는 없다.

차이가 생긴 이유:
docs/architecture/target-architecture.md:41-43이 Worker challenge와 signed pass token 흐름을 명시하므로 quiz branch의 분리는 의도적이다. invite가 빠진 이유는 문서에 없어 확인 불가다.

실제 영향:
challenge replay와 CORS endpoint가 하나 더 생기지만, random 문제를 먼저 표시해야 하는 UI에는 자연스러운 분리다.

현재 구현의 장점:
challenge 발급과 answer 검증 역할이 명확하고 댓글 body가 quiz endpoint에 전달되지 않는다.

현재 구현의 단점:
단일 authorization API 계약이 없고 invite와 quiz를 같은 OR policy로 다루기 어렵다. challenge token answer 노출과 preflight 장애 지점도 생겼다.

목표 설계로 변경할 필요:
endpoint 이름을 반드시 하나로 합칠 필요는 없다. 다만 quiz와 invite가 최종적으로 동일한 authorization record/token을 발급하는 공통 service를 사용해야 한다.
```

### 7.2 stateless signed token

```text
목표 설계:
짧은 수명의 권한이며 가능하면 1회용, 폐기 가능, 동시 사용 방지. Idempotency와 comment 저장을 원자 처리한다.

현재 구현:
HMAC만 검증하는 stateless token이다. jti는 있지만 저장하지 않는다.

차이가 생긴 이유:
target-architecture.md:16은 “Worker-issued quiz pass token + server-side re-verification”을 명시하지만 1회용 store는 언급하지 않는다. 낮은 운영 복잡도를 택한 것으로 보인다는 부분은 추정이다.

실제 영향:
모든 instance가 DB lookup 없이 빠르게 검증하지만 replay, revocation, concurrency, Idempotency를 제공하지 못한다.

현재 구현의 장점:
저장소가 필요 없고 horizontally scalable하며 Worker/Next.js 간 계약이 작다.

현재 구현의 단점:
서명 검증은 token의 진위만 보장하며 사용 횟수는 보장하지 않는다. UUID jti만 존재해도 1회용이 아니다.

목표 설계로 변경할 필요:
필요하다. stateless token 자체는 유지할 수 있지만 jti 상태와 Idempotency result를 DB/DO에서 atomic하게 관리해야 한다.
```

### 7.3 Worker가 DB/comment API를 담당하지 않음

```text
목표 설계:
예상 역할은 Worker가 authorization, Rate Limit, blacklist, Supabase write를 담당한다.

현재 구현:
Worker는 challenge/pass token만 담당하고 Next.js가 service-role로 comment CRUD를 수행한다.

차이가 생긴 이유:
target-architecture.md:21-24가 Vercel route handler와 Worker token issuance 역할을 명시한다. 현재 repository의 의도적 구조다.

실제 영향:
enforcement가 두 runtime과 shared secret에 분산된다.

현재 구현의 장점:
Supabase service-role을 Worker에 복제하지 않고 기존 Next.js server/admin code와 DB access를 한곳에 둔다.

현재 구현의 단점:
Cloudflare edge Rate Limit/DO와 comment transaction을 바로 결합하지 못하고 CORS/shared-secret 운영이 필요하다.

목표 설계로 변경할 필요:
Worker로 옮기는 것은 필수 아니다. Next.js에서 authorization consume + Idempotency + comment insert를 transaction으로 구현하면 기능 목표를 충족할 수 있다.
```

### 7.4 글별 quiz 대신 stateless 덧셈

```text
목표 설계:
각 글에 관리 가능한 quiz가 존재할 수 있고 answer는 server에서 보호한다.

현재 구현:
모든 slug에 1~9 덧셈을 즉석 생성하고 answer를 signed challenge payload에 포함한다.

차이가 생긴 이유:
별도 quiz store를 생략한 단순화로 보이지만 코드/문서의 결정 근거가 없어 추정이다.

실제 영향:
운영은 단순하지만 글별 문제와 no-quiz policy가 없고 decode/자동화로 쉽게 우회된다.

현재 구현의 장점:
DB quiz migration과 관리자 UI가 필요 없고 challenge마다 문제가 바뀐다.

현재 구현의 단점:
정답 기밀성과 anti-bot 효과가 없다.

목표 설계로 변경할 필요:
글별 quiz가 제품 요구라면 필요하다. 최소한 answer를 client-readable payload에서 제거해야 한다.
```

### 7.5 `quiz.hodako.dev`와 Next.js comment API

```text
목표 설계:
api.hodako.dev의 Worker가 전체 API를 담당하는 구성을 예상한다.

현재 구현:
quiz.hodako.dev가 authorization 일부를 담당하고 /api/comments는 www.hodako.dev의 Vercel route다. api.hodako.dev는 운영 DNS에 연결되지 않았다.

차이가 생긴 이유:
Worker 역할을 quiz 전용으로 좁힌 현재 architecture와 일치한다.

실제 영향:
두 origin의 CORS와 shared secret을 운영해야 한다.

현재 구현의 장점:
domain 이름이 실제 quiz 역할을 정확히 나타낸다.

현재 구현의 단점:
단일 API origin이 아니며 현재 CORS preflight가 깨져 있다.

목표 설계로 변경할 필요:
domain 통합은 선택 사항이다. CORS를 없애려면 Next.js reverse proxy 또는 same-origin authorization route도 합리적이다.
```

## 8. 보안 및 운영 위험

### Critical — Supabase anon 직접 write로 모든 authorization 우회

- 문제 설명: public table에 RLS/REVOKE가 없고 운영 anon role이 Data API write privilege layer를 통과한다.
- 공격 시나리오:
  - anon/publishable key를 얻은 공격자가 quiz/pass token, 소비, Idempotency, Rate Limit, blacklist, password hash format을 우회해 직접 INSERT한다.
  - 기존 comment를 UPDATE하거나 hard DELETE한다.
  - 현재 tracked source/client bundle에서는 anon key가 발견되지 않았지만 Supabase 공식 모델에서 publishable/legacy anon key는 보안 경계가 아니며 RLS로 보호해야 한다.
- 파일: `infra/supabase/migrations/0001_baseline.sql` 전체.
- 운영 근거:
  - anon GET: 관련 table/view 모두 200.
  - invalid comments INSERT: 인증 거부가 아니라 SQL NOT NULL `23502`까지 도달.
  - 존재하지 않는 UUID UPDATE/DELETE: 각각 204; 대상이 없어 실제 변경은 없었음.
- 현재 방어: 정상 UI가 server API를 사용한다는 convention뿐이다.
- 권장 수정: 관련 table RLS enable, anon/authenticated write revoke, private schema 또는 최소 grant, 권한 회귀 test.

### Critical — public view가 password/IP hash를 노출할 수 있음

- 문제 설명: `comments_with_thread`가 `password_hash`, `ip_hash`를 포함하며 anon SELECT가 허용된다.
- 공격 시나리오: comment가 생기면 offline password guessing과 사용자 hash 상관 분석에 이용될 수 있다.
- 파일: migration `:68-82`, 특히 `:78-79`.
- 현재 방어: scrypt+salt+pepper가 password cracking 난도를 높이지만 노출을 막지 않는다.
- 권장 수정: public view에서 민감 column 제거, anon SELECT revoke, server-only/private query 사용.

### High — authorization 재사용·동시 사용·중복 comment

- 문제 설명: token `jti`의 발급/소비 record와 Idempotency가 없다.
- 공격/장애 시나리오:
  - 같은 token으로 5분 동안 여러 POST를 순차 실행한다.
  - 같은 token을 동시에 보내 모든 요청이 HMAC 검증 후 INSERT한다.
  - network timeout 후 client가 retry하면 원래 요청 성공 여부와 무관하게 중복 comment가 생긴다.
- 파일: Worker `PassClaims`, `quiz-token.ts:33-53`, comments route, migration 전체.
- 현재 방어: expiry와 slug/purpose 검증뿐이다.
- 권장 수정: authorization ID unique record, atomic unconsumed→consumed transition, Idempotency key/body hash/result를 comment INSERT와 한 transaction으로 처리.

### High — challenge token에 answer 원문 노출

- 문제 설명: challenge claim의 `answer`는 암호화되지 않은 Base64URL payload에 있다.
- 공격 시나리오: challenge token 첫 segment를 decode해 answer를 얻은 뒤 `/verify`에 제출한다.
- 파일: Worker `index.ts:6-14, 26-32, 98-110`.
- 운영 근거: 실제 challenge payload에서 answer field를 읽을 수 있음을 확인했다. 값은 기록하지 않았다.
- 현재 방어: HMAC은 변조만 막고 기밀성을 제공하지 않는다.
- 권장 수정: answer를 token에서 제거하고 short-lived server state, DO/KV, 또는 노출되지 않는 검증 설계를 사용.

### High — 운영 CORS preflight 500

- 문제 설명: Worker OPTIONS가 `json({}, 204)`로 body가 있는 204 Response를 만든다.
- 장애 시나리오: browser의 JSON `/verify` POST 전 preflight가 500이어서 권한 발급을 완료할 수 없다.
- 파일: Worker `index.ts:70-85`.
- 운영 근거: 2026-08-03 OPTIONS가 500, CORS header 없음.
- 현재 방어: Node/server-to-server direct POST만 동작하며 browser를 보장하지 않는다.
- 권장 수정: body 없는 204 Response와 Worker runtime/browser CORS test.

### High — 대댓글 관계 무결성 우회

- 문제 설명: DB check는 depth 숫자만 제한하며 부모의 depth/thread/status를 확인하지 않는다.
- 공격 시나리오: reply에 reply를 무한 chain으로 만들거나 다른 글의 parent ID를 연결한다.
- 파일: migration `:13-15`, `comments.ts:201-225`.
- 현재 방어: parent 존재 FK, depth 0~1 check.
- 권장 수정: transaction에서 same thread, parent depth=0, 허용 status를 확인하고 DB trigger/constraint로 보강.

### High — Rate Limit 전무

- 문제 설명: challenge/verify/authorization/comment CRUD/admin login에 persistent Rate Limit이 없다.
- 공격 시나리오: token 대량 발급, brute force, comment spam, password guessing, 비용 공격.
- 파일: Worker/Next routes/config 전체; KV/DO/D1/rate binding 없음.
- 현재 방어: 5분 token expiry와 수동 blacklist뿐.
- 권장 수정: trusted client identifier와 action별 shared persistent Rate Limit, 실패 요청 포함, platform WAF는 보조 계층으로 IaC화.

### High — 게시물 존재 및 comments_open 미검증

- 문제 설명: authorization과 comment 모두 canonical slug 존재/published/open 상태를 확인하지 않는다.
- 공격 시나리오: 임의 slug로 token을 받고 thread/comment를 생성한다.
- 파일: Worker `:91-136`, comments route, `comments.ts:97-103`.
- 현재 방어: token slug와 request slug의 동일성만 확인한다.
- 권장 수정: authorization 발급과 comment 저장 양쪽에서 published canonical slug를 resolve하고 `comments_open` 확인.

### High — client IP가 Cloudflare egress로 묶일 가능성

- 문제 설명: Cloudflare proxy→Vercel 구조에서 code가 XFF를 CF header보다 우선한다.
- 장애 시나리오: 한 Cloudflare egress hash 차단이 여러 사용자를 막거나 POP 변경으로 차단이 우회된다.
- 파일: comments route `:17-27`, Pulumi DNS `proxied: true`.
- 현재 방어: secret pepper hash.
- 권장 수정: 실제 proxy trust chain을 문서화하고 Vercel `ipAddress()` 또는 검증된 dedicated header를 사용해 test.

### High — Production 관리자 env 누락

- 문제 설명: `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`이 필수지만 Production env 목록에 없다.
- 장애 시나리오: admin login POST가 env 오류로 실패해 moderation/blacklist를 사용할 수 없다.
- 파일: `apps/web/src/lib/env.ts:24-29`, `auth.ts`.
- 현재 방어: login page GET만 env 없이 표시된다.
- 권장 수정: strong env 설정, login/moderation smoke test, rotation runbook.

### Medium — 입력 validation 및 request size 제한 없음

- 문제 설명: untrusted JSON/form data를 type assertion/readString으로 사용한다.
- 공격 시나리오: empty/oversized field, invalid UUID, malformed body로 DB 오류·500·비용 증가.
- 파일: Worker `:113-118`, comments routes.
- 현재 방어: browser required/maxLength와 일부 DB constraint.
- 권장 수정: schema validation, UUID/slug allowlist, trim/min/max, content-type/body-size, typed 4xx.

### Medium — comment 저장 자체도 transaction이 아님

- 문제 설명: blacklist SELECT, thread UPSERT, comment INSERT가 별도 요청이다.
- 장애 시나리오: 빈 thread 잔존, blacklist TOCTOU race. 향후 consume을 단순 추가하면 consume/insert 실패 순서 문제가 생긴다.
- 파일: `comments.ts:201-231`.
- 현재 방어: 각 호출 error throw와 DB constraints.
- 권장 수정: authorization consume + Idempotency + blacklist/parent 확인 + insert를 제한된 DB function/transaction 하나로 구현.

### Medium — open redirect

- 문제 설명: client `redirectTo`를 allowlist 없이 `new URL()`에 사용한다.
- 공격 시나리오: crafted form이 성공/실패 뒤 외부 phishing URL로 redirect한다.
- 파일: comments route `:11-14, 61-66`, comment `[id]` route `:27`.
- 현재 방어: 없음.
- 권장 수정: same-origin relative path만 허용하거나 server가 slug에서 redirect 생성.

### Medium — shared secret rotation drift

- 문제 설명: Worker와 Vercel의 `QUIZ_TOKEN_SECRET` 일치가 필요하지만 Pulumi는 GitHub secret만 선언한다.
- 장애 시나리오: 한쪽만 rotate하면 발급 token 전체가 Next.js에서 거부된다.
- 파일: Worker/Next sign 함수, `infra/pulumi/index.ts:19-23`.
- 현재 방어: 양쪽에 secret 이름이 존재하지만 자동 sync/rotation은 없음.
- 권장 수정: 단일 secret source, current/previous key migration, end-to-end deploy smoke test.

### Medium — malformed error와 관측성 부족

- 문제 설명: Worker parse/signature 오류와 comments DB/password 오류가 명시적 4xx mapping 없이 500이 될 수 있고 Worker observability가 없다.
- 파일: Worker `fetch`, comments routes, `wrangler.toml`.
- 현재 방어: invalid answer는 400, invalid pass token은 redirect.
- 권장 수정: structured try/catch/log, correlation ID, observability/staging 설정.

### Low — HMAC signature 직접 문자열 비교

- 문제 설명: Worker와 Next verifier가 `!==`로 signature를 비교한다.
- 공격 시나리오: 이론적 timing side channel. network 환경에서 실용성은 낮다.
- 파일: Worker `:58-60`, `quiz-token.ts:40-43`.
- 현재 방어: HMAC-SHA256과 짧은 TTL.
- 권장 수정: fixed-size digest constant-time comparison.

### Low — password hash parameter version 없음

- 문제 설명: hash format이 algorithm/salt/hash만 저장하고 scrypt N/r/p를 저장하지 않는다.
- 장애 시나리오: parameter upgrade나 runtime 변화 시 기존 hash migration이 어렵다.
- 파일: `comments.ts:29-55`.
- 현재 방어: 같은 Node runtime default로 생성·검증.
- 권장 수정: versioned parameter format과 rehash policy.

## 9. 테스트 현황

저장소에 관련 자동화 test가 없다. 아래 “없음”은 test/spec/e2e file, package script, test framework 설정과 호출 코드를 모두 확인한 결과다.

| 테스트 시나리오 | 존재 여부 | 테스트 파일 | 충분성 | 추가로 필요한 테스트 |
| --- | --- | --- | --- | --- |
| 올바른 quiz answer 권한 발급 | 없음 | 없음 | 불충분 | pass token purpose/slug/exp/jti 검증 |
| 잘못된 quiz answer 실패 | 없음 | 없음 | 불충분 | 400, retry, Rate Limit |
| 유효한 invite 권한 발급 | 없음 | 없음 | 불충분 | global reusable invite→글별 short auth |
| 잘못된 invite 실패 | 없음 | 없음 | 불충분 | hash comparison과 실패 limit |
| revoked invite 실패 | 없음 | 없음 | 불충분 | active/revoked 전환 |
| quiz/invite 모두 없음 | 없음 | 없음 | 불충분 | deterministic 4xx |
| quiz/invite 모두 있음 | 없음 | 없음 | 불충분 | 정책상 reject 또는 명시 우선순위 |
| 존재하지 않는 글 권한 발급 | 없음 | 없음 | 불충분 | 발급 거부 |
| 만료 authorization | 없음 | 없음 | 불충분 | boundary clock/skew 포함 |
| 다른 글 token 사용 | 없음 | 없음 | 불충분 | slug mismatch 거부 |
| 이미 사용한 token 재사용 | 없음 | 없음 | 불충분 | consumed 상태 거부 |
| 동일 token 동시 사용 | 없음 | 없음 | 불충분 | 한 요청만 commit |
| valid token comment 작성 | 없음 | 없음 | 불충분 | consume+insert+result transaction |
| token 없는 작성 | 없음 | 없음 | 불충분 | 4xx와 DB 무변경 |
| comment 실패 시 token 상태 | 없음 | 없음 | 불충분 | retry 가능한 atomic rollback |
| 동일 Idempotency key 재시도 | 없음 | 없음 | 불충분 | 기존 comment/result 반환 |
| 같은 key, 다른 body | 없음 | 없음 | 불충분 | body hash mismatch conflict |
| Idempotency expiry | 없음 | 없음 | 불충분 | cleanup/retention |
| 대댓글 depth 제한 | 없음 | 없음 | 불충분 | root→reply 성공, reply→reply 거부 |
| 다른 글 parent | 없음 | 없음 | 불충분 | cross-thread 거부 |
| comment password edit/delete | 없음 | 없음 | 불충분 | correct/wrong/empty password |
| soft delete parent/replies | 없음 | 없음 | 불충분 | `[deleted]`와 child 유지 |
| Rate Limit | 없음 | 없음 | 불충분 | 성공/실패, 여러 instance 공유 |
| IP blacklist | 없음 | 없음 | 불충분 | trusted IP, block/unblock |
| Worker CORS preflight | 없음 | 없음 | 불충분 | body 없는 204 + headers |
| challenge answer 비노출 | 없음 | 없음 | 불충분 | response/token payload 검사 |
| Supabase direct write 차단 | 없음 | 없음 | 불충분 | anon INSERT/UPDATE/DELETE 401/403 |
| RLS/view 민감 column | 없음 | 없음 | 불충분 | policy와 hash 비노출 |
| 관리자 인증/moderation | 없음 | 없음 | 불충분 | env, cookie, allowlist, Rate Limit |
| 다국어 thread 공유 | 없음 | 없음 | 불충분 | localized slug가 같은 thread 조회 |

현재 통과한 검사는 다음뿐이다.

- `pnpm --filter web typecheck`
- `pnpm --dir infra/cloudflare-worker exec tsc --noEmit`

이는 type check이며 인증, replay, transaction, CORS, RLS 동작을 보장하지 않는다. 이번 운영 진단도 repository test가 아닌 일회성 수동 확인이다.

## 10. 권장 수정 우선순위

### P0 — 즉시 수정

- `infra/supabase/migrations`에 새 migration을 추가해 `post_threads`, `comments`, `comment_ip_blacklist` RLS를 enable하고 anon/authenticated write privilege를 revoke한다.
- `comments_with_thread`에서 `password_hash`, `ip_hash`를 제거하고 public SELECT를 revoke한다. password 확인은 service-role/private schema로 분리한다.
- Supabase anon direct SELECT/INSERT/UPDATE/DELETE가 거부되는 integration test를 추가한다.
- `infra/cloudflare-worker/src/index.ts`의 challenge payload에서 `answer`를 제거하고 server-side short challenge state로 검증한다.
- Worker OPTIONS를 body 없는 204로 수정하고 실제 browser preflight test를 추가한다.
- 운영 관리자 기능을 유지한다면 Vercel Production에 강한 `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`을 설정하고 smoke test를 수행한다.

### P1 — 핵심 요구사항 복구

- quiz와 invite가 공통으로 호출하는 comment authorization service를 정의한다. endpoint를 합치든 유지하든 최종 결과는 같은 authorization model이어야 한다.
- Supabase 또는 Durable Object에 `comment_authorizations`를 추가한다: `authorization_id/jti` UNIQUE, `purpose`, `canonical_slug`, `issued_at`, `expires_at`, `consumed_at`, `revoked_at`, credential source.
- `apps/web/src/app/api/comments/route.ts`가 `authorizationToken`과 `idempotencyKey`를 명시적으로 받도록 request schema를 정의한다.
- comment write transaction에서 `purpose=COMMENT_WRITE`, slug, expiry, revoked, unconsumed 상태를 확인하고 authorization을 조건부 소비한다.
- 동일 authorization ID의 동시 요청은 DB conditional update 또는 DO serialization으로 하나만 성공하게 한다.
- `invite_tokens`를 원문이 아닌 hash로 저장한다: random token ID/hash, label, active/revoked state, created/revoked time. 특정 글/사용 횟수에는 연결하지 않는다.
- admin에 invite 원문 1회 발급·목록·폐기 기능을 추가하고 log에는 원문을 남기지 않는다.
- authorization 발급 전에 published canonical slug와 `comments_open`을 확인한다.
- 글별 quiz source를 Markdown frontmatter 또는 server-only DB로 정하고 answer hash/HMAC, normalization, multiple answer/no-quiz policy를 문서화한다.

### P2 — 안정성 개선

- `idempotency_records` 또는 동등 구조에 `idempotency_key` UNIQUE, request body hash, authorization ID, comment ID/result, expiry를 저장한다.
- 같은 key+같은 body는 기존 결과를 반환하고 같은 key+다른 body는 conflict로 거부한다.
- authorization consume, Idempotency claim, blacklist/parent 검증, thread resolve, comment INSERT를 하나의 transaction/RPC로 묶는다.
- 댓글 실패 시 전체 rollback되어 authorization과 Idempotency가 재시도 가능한 상태인지 test한다.
- challenge/verify/invite/authorization/comment CRUD/admin login에 persistent action별 Rate Limit을 적용한다. 실패 요청도 포함한다.
- trusted Cloudflare→Vercel IP 경계를 정하고 Vercel helper 또는 검증된 header로 교체한다.
- parent의 same thread, depth=0, 허용 status를 server와 DB 모두에서 강제한다.
- author/password/content/UUID/slug/content-type/body-size의 schema validation과 일관된 4xx error를 추가한다.
- `redirectTo`를 same-origin relative path로 제한한다.
- Worker structured error/log/observability/staging과 shared-secret rotation/current+previous key runbook을 추가한다.
- 이 문서의 test 표를 기준으로 Worker runtime, Next route, Supabase transaction/RLS integration test suite를 만든다.

### P3 — 선택적 개선

- HMAC signed token을 유지할지 opaque random token hash를 저장할지 결정한다. 전자는 stateless claim 검증, 후자는 폐기/기밀성이 단순하다.
- Worker가 Supabase를 직접 쓸지 Next.js를 enforcement point로 유지할지 정한다. 기능상 Next.js 유지도 타당하다.
- same-origin proxy를 두어 browser CORS와 public Worker URL 결합을 줄이는 방안을 검토한다.
- `body_html`을 쓰지 않으면 제거하고, 사용하면 server-side sanitizer를 거쳐 생성한다.
- IP hash를 password pepper와 분리된 purpose-specific HMAC key로 변경한다.
- scrypt hash format에 version/N/r/p를 포함하고 점진 rehash policy를 둔다.
- `CommentAvailabilityGate`, Next의 미사용 `issueQuizPassToken`, 연결되지 않은 `anonId`/cookie/fingerprint를 제거하거나 역할을 명확히 한다.
- comment admin pagination/search/unblacklist/audit log를 추가한다.
- canonical directory rename 시 기존 thread를 유지할 alias/migration runbook을 만든다.
- README, target architecture, UI의 token 안내 문구를 최종 authorization/invite 설계와 일치시킨다.

## 최종 답변 1 — 2단계 핵심 설계

부분적으로 만족. 현재 구현은 “퀴즈 또는 다회용 초대 토큰을 먼저 검증하고, 특정 글에만 사용할 수 있는 짧은 수명의 댓글 작성 권한을 발급한 뒤, 해당 권한으로 댓글을 저장한다”는 설계 중 quiz branch의 기본 2단계 흐름만 만족한다.

가장 중요한 근거 3가지:

1. Worker가 quiz answer를 검증한 뒤 5분짜리 `comment_quiz_pass` token을 발급하고 Next.js가 목적, slug, expiry, signature를 다시 검증한다.
2. 댓글 API는 원본 quiz answer를 다시 받지 않고 short token으로 저장하므로 2단계 분리는 구현되어 있다.
3. 다회용 invite token branch가 전혀 없고, authorization의 consumed/revoked state도 없어 목표의 전체 인증 수단과 1회 사용 policy를 충족하지 못한다.

## 최종 답변 2 — 재사용·동시 사용·중복 방지

아니요. 현재 구현에서 댓글 작성 권한의 재사용, 동시 사용 및 중복 댓글 생성은 안전하게 방지되지 않는다.

가장 중요한 근거 3가지:

1. token의 `jti`를 저장하거나 `consumed_at`으로 변경하는 server store가 없어 동일 token이 만료 전 반복 사용 가능하다.
2. authorization 소비와 comment INSERT를 묶는 transaction/conditional update가 없어 동시 요청을 한 건으로 직렬화하지 못한다.
3. `idempotencyKey`, request body hash, 기존 comment 결과 저장이 없으므로 network retry나 double submit이 새 comment를 추가할 수 있다.
