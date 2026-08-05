# 댓글 문제은행 아키텍처

## 핵심 구조

```text
Browser / Next.js UI
        ↓ HTTPS
Cloudflare Workers API (quiz.hodako.dev)
        ↓ Supabase REST/RPC + PostgreSQL transaction
Supabase

이미지 선택지: Browser → GitHub 공개 이미지 URL
```

- `apps/web`: Markdown 게시물 렌더링, 문제·선택지 UI, 댓글 UI, 관리자 세션과 Worker 관리자 API 프록시
- `content/posts/{slug}/{locale}.md`: 게시물과 `commentQuizCategory` 메타데이터의 원본
- `infra/cloudflare-worker`: 댓글/퀴즈의 신뢰 경계. Service Role Secret은 이 Worker에서만 사용
- `infra/supabase`: 문제은행, 게시물-카테고리 매핑, Challenge, 권한, 댓글, Idempotency, Rate Limit과 Blacklist
- `infra/pulumi`: 기존 DNS·배포 인프라 코드. 별도 D1/KV/DO/R2는 사용하지 않음

## 2단계 인증 흐름

1. Next.js `QuizGate`가 `POST /quiz/challenges`를 호출한다.
2. Worker가 `canonicalSlug`로 `post_threads.quiz_category_id`를 확인하고, 활성 카테고리·문제 하나와 다섯 선택지를 Supabase RPC에서 받는다.
3. RPC는 선택지 순서를 섞고 정답과 허용 Option ID를 `quiz_challenges`에 저장한다. 응답에는 정답·해설·`is_correct`가 없다.
4. 브라우저가 `POST /quiz/challenges/{challengeId}/verify`로 `selectedOptionId`만 제출한다.
5. Worker는 Supabase `verify_quiz_challenge_and_issue_authorization` RPC를 호출한다. RPC가 행 잠금, 만료·1회 제출·정답 확인과 `comment_authorizations` 발급을 하나의 트랜잭션에서 처리한다.
6. Worker는 DB 권한 ID를 포함한 짧은 HMAC 토큰을 반환한다. DB 행이 권한의 최종 상태이며 JWT/HMAC만으로 1회성을 주장하지 않는다.
7. 댓글 Form은 `POST /comments`에 단기 권한, 글, 내용, 비밀번호, `idempotencyKey`를 전달한다.
8. Worker는 토큰 목적·서명·만료·글을 확인하고 PBKDF2 비밀번호 해시를 만든 뒤 `create_comment_with_authorization` RPC를 호출한다. RPC가 권한 잠금, 부모 댓글 검사, Rate Limit, 댓글 Insert, 권한 소비, Idempotency 기록을 하나의 트랜잭션에서 처리한다.

초대 토큰은 `POST /comment-authorizations`에서만 검증하고 같은 형식의 글 귀속 단기 권한으로 교환한다. 댓글 API에는 원본 초대 토큰이나 퀴즈 정답을 보내지 않는다.

## API

### 공개

- `POST /quiz/challenges`
- `POST /quiz/challenges/{id}/verify`
- `POST /comment-authorizations`
- `GET /comments?canonicalSlug=...`
- `POST /comments`
- `PATCH|DELETE /comments/{id}`
- `GET|POST /post-views/{canonicalSlug}`

### 관리자

`x-admin-api-key` Worker Secret으로 보호한다. Next.js 관리자 페이지는 HttpOnly 관리자 세션을 먼저 확인한 뒤 이 API를 서버에서 호출한다.

- `GET|PATCH /admin/comments[/{id}]`
- `GET|POST|DELETE /admin/invite-tokens`
- `GET /admin/quiz/questions`

## 데이터 보호

- Supabase Service Role Key는 `SUPABASE_SERVICE_ROLE_KEY` Worker Secret으로만 관리한다.
- `quiz_options.is_correct`, Challenge의 `correct_option_id`, `allowed_option_ids`, 비밀번호 해시는 공개 View/API 응답에서 제외한다.
- 익명 역할은 문제은행·Challenge·권한·댓글 쓰기 테이블에 직접 권한이 없다. 공개 댓글 조회도 Worker View를 통해서만 수행한다.
- Client IP는 Cloudflare가 설정한 `CF-Connecting-IP`만 사용하고 `X-Forwarded-For`는 신뢰하지 않는다. `IP_HASH_SECRET` HMAC 결과만 저장한다.
- 초대 토큰은 `INVITE_TOKEN_PEPPER` HMAC 결과만 저장하고 원문은 발급 응답에서 한 번만 보여준다.
- 댓글 비밀번호는 Worker Web Crypto PBKDF2(`pbkdf2-sha256`, 100,000회) 형식으로 저장한다. Cloudflare Workers Web Crypto가 100,000회를 초과하는 반복 횟수를 거부하므로 이 값을 고정한다. 기존 `scrypt$` 행은 Worker 수정/삭제 경로에서 호환되지 않으므로 별도 마이그레이션 대상이다.

## 게시물 연결 정책

게시물 Front Matter는 `commentQuizCategory: "DEVOPS"`처럼 명시할 수 있다. Worker는 브라우저가 보낸 카테고리를 신뢰하지 않고 `post_threads.quiz_category_id`를 사용한다. 0003/0004 마이그레이션은 현재 게시물과 GENERAL·BACKEND·DEVOPS·DATABASE 문제를 동기화한다. 카테고리가 없으면 GENERAL을 사용하며 GENERAL 문제도 없으면 Challenge 발급을 거부한다. 기존 사칙연산 `/challenge`는 410으로 비활성화했다.

## 이미지 문제 정책

`quiz_options.image_path`에 `quiz/.../opaque-id.webp` 상대 경로만 저장하고 Worker가 `QUIZ_IMAGE_BASE_URL`과 결합해 URL을 반환한다. Worker는 이미지를 다운로드하거나 프록시하지 않는다. 현재 MUSIC Seed는 저작권 없는 Placeholder 경로와 비활성 문제로만 존재한다. 실제 앨범 이미지 등록은 권리 확인 후 별도 데이터 작업으로 진행한다.

## 운영 제한

- Worker 전역 변수·인메모리 Map·로컬 파일·D1/KV/DO/R2를 상태 저장에 사용하지 않는다.
- Rate Limit은 Supabase의 원자적 `consume_comment_rate_limit` RPC를 사용한다.
- `wrangler.jsonc`는 `nodejs_compat`, Observability와 `quiz.hodako.dev` Custom Domain을 선언한다. Secret 값은 `wrangler secret put`으로 주입한다.
- `apps/web/.env.example`에는 Service Role Key를 두지 않는다. Next.js의 기존 `lib/comments.ts`/`lib/supabase.ts`는 레거시 호환 코드이며 공개 댓글·조회·관리 운영 경로에서는 사용하지 않는다.
