# Hodako Guitar MVP 구현 계획

- 작성일: 2026-10-09
- 상태: 1~6단계 구현 및 자동 검증 완료 / 7단계 운영 연결 검증 대기
- 최초 조사 기준 커밋: `b3b9dcf`; 최종 원격 변경 대조 기준: `4e94fd0`
- 입력 문서: 로컬의 `hodako-guitar-codex-plan.md`, `hodako-guitar-prd.md` v1.0
- 이 문서는 계획만 기록한다. 애플리케이션 구현, 의존성 설치, 배포 설정 변경은 별도 작업이다.

## 1. 결론과 확정한 방향

기존 `apps/web`를 확장하고 **하나의 Vercel 배포에서 Host 기반 Rewrite**로 블로그와 Guitar를 구분한다. 저장소는 이미 pnpm 모노레포이므로 새로운 저장소나 모노레포 전환이 필요하지 않다. Guitar의 공개 콘텐츠는 `.chopro` 파일에서 정적으로 생성하며 기존 댓글 Worker, Supabase, 관리자 인증을 연결하지 않는다.

사용자가 선택한 사항:

- Guitar MVP는 **한국어 UI와 locale 접두사 없는 URL**을 사용한다. 한글·영문·혼합 가사는 모두 지원한다.
- 운영자 에디터는 **전용 로컬 명령으로 실행하고 저장소 파일을 직접 열고 저장**한다. 공개 앱의 빌드와 분리한다.
- 이번 변경은 개발 계획 문서만 커밋·푸시한다.

계획에서 선택한 기본값:

- 공개 URL: `https://guitar.hodako.dev/`, `/songs`, `/songs/[slug]`.
- 신규 공개 런타임 라이브러리는 추가하지 않는다. React, Next.js, CSS, SVG, 브라우저 API를 사용한다.
- ChordPro 전체 표준이 아닌 명시적인 MVP 부분집합을 직접 파싱한다.
- 기존 디자인 토큰과 테마 구현을 재사용하되 Guitar 전용 내비게이션과 레이아웃을 둔다.
- P0는 FR-01~FR-10 전체다. FR-11~FR-14는 모델의 확장 가능성만 보존하고 구현을 미룬다.

## 2. 현재 저장소 조사

아래 E 번호는 요구사항 비교표에서 사용하는 근거 식별자다. 경로는 이 문서가 있는 `docs/` 기준 상대 링크다.

| 근거 | 확인한 사실 | 실제 파일 |
| --- | --- | --- |
| E1 | pnpm workspace에 `apps/*`, `packages/*`, `infra/*`가 있다. Node 24.x, pnpm 10.17.1을 지정한다. 웹은 Next.js App Router와 React이며 lockfile 기준 Next 15.5.14, React 19.2.4다. | [package.json](../package.json), [pnpm-workspace.yaml](../pnpm-workspace.yaml), [웹 package.json](../apps/web/package.json), [pnpm-lock.yaml](../pnpm-lock.yaml) |
| E2 | 콘텐츠는 `content/posts/{canonicalSlug}/{locale}.md`다. `gray-matter`로 frontmatter를 검증하고 파일 인덱스를 메모리에 캐시한다. 날짜 정렬과 locale별 조회가 있다. Markdown은 `react-markdown`, GFM, Shiki로 렌더링하며 MDX를 사용하지 않는다. Guitar 파일 로더와 검색은 없다. | [content.ts](../apps/web/src/lib/content.ts), [markdown.tsx](../apps/web/src/lib/markdown.tsx), [블로그 목록](../apps/web/src/app/[locale]/blog/page.tsx) |
| E3 | `/[locale]` 라우트와 ko/en 사전이 있다. 미들웨어는 locale 없는 요청을 쿠키·Accept-Language에 따라 리다이렉트한다. Host 분기는 없고 점이 들어간 경로는 matcher에서 제외된다. | [middleware.ts](../apps/web/src/middleware.ts), [site.ts](../apps/web/src/lib/site.ts), [locale layout](../apps/web/src/app/[locale]/layout.tsx) |
| E4 | 전역 CSS에 색상·간격·반경·폰트 토큰과 모바일 규칙이 있다. 한글 폰트를 로컬에서 제공한다. SiteShell은 블로그 헤더와 눈·별 배경까지 결합한다. 독립 UI 컴포넌트 라이브러리는 없다. | [globals.css](../apps/web/src/app/globals.css), [site-shell.tsx](../apps/web/src/components/site-shell.tsx), [mobile-header-shell.tsx](../apps/web/src/components/mobile-header-shell.tsx) |
| E5 | ThemeProvider는 light/dark만 지원한다. `site-theme` localStorage와 루트 초기화 스크립트가 있다. System 선택은 없으며 Provider의 저장소 접근에는 실패 처리가 없다. FontToggle은 글꼴 선택이며 악보 글자 크기 조절 기능은 아니다. | [theme-context.tsx](../apps/web/src/components/theme-context.tsx), [theme-toggle.tsx](../apps/web/src/components/theme-toggle.tsx), [font-toggle.tsx](../apps/web/src/components/font-toggle.tsx), [루트 layout](../apps/web/src/app/layout.tsx) |
| E6 | 블로그 상세에 `generateStaticParams`, canonical, 언어별 alternate가 있다. 루트 metadataBase와 sitemap/robots는 하나의 `siteUrl`을 사용한다. Guitar용 SEO·OG 구현은 없다. | [블로그 상세](../apps/web/src/app/[locale]/blog/[slug]/page.tsx), [sitemap.ts](../apps/web/src/app/sitemap.ts), [robots.ts](../apps/web/src/app/robots.ts), [env.ts](../apps/web/src/lib/env.ts) |
| E7 | `typedRoutes`가 활성화되어 있고 파일 추적 루트가 저장소까지 확장되어 있다. 정적 export 전용 앱은 아니다. README는 Vercel을 명시하며 Pulumi에는 블로그 CNAME → Vercel, Cloudflare proxy 설정이 있다. Guitar DNS와 Vercel 프로젝트 도메인 연결은 코드에 없다. | [next.config.mjs](../apps/web/next.config.mjs), [README](../README.md), [Pulumi](../infra/pulumi/index.ts) |
| E8 | Quality CI는 웹·Worker 테스트, 웹 타입 검사·빌드, Worker 타입 생성·검사·배포 dry-run을 수행한다. 별도 Supabase migration workflow가 있다. Vercel Git 연동의 실제 프로젝트 설정은 이 파일들만으로 확인할 수 없다. | [quality.yml](../.github/workflows/quality.yml), [supabase-migrations.yml](../.github/workflows/supabase-migrations.yml) |
| E9 | Vitest Node 환경과 `*.spec.ts` 패턴을 사용한다. 기존 테스트는 보안 helper·Worker 중심이다. 브라우저/E2E 테스트 기반은 없고 ESLint/Prettier 전용 명령도 없다. lint-staged는 웹 TS/JS 변경 시 타입 검사를 수행한다. | [vitest.config.mts](../apps/web/vitest.config.mts), [테스트 예시](../apps/web/src/lib/request-security.spec.ts), [.lintstagedrc.cjs](../.lintstagedrc.cjs), [pre-commit](../.husky/pre-commit) |
| E10 | 댓글·퀴즈는 Worker → Supabase 경로다. Guitar에서 재사용할 동적 서비스가 아니다. | [아키텍처](architecture/target-architecture.md), [worker-client.ts](../apps/web/src/lib/worker-client.ts) |
| E11 | 최신 원격에는 Records 목록·분류·상세·프로필 화면과 native dialog 이미지 확대/포커스 복귀 패턴이 있다. locale 홈은 블로그 목록으로 redirect하며, next.config에 Inspirations → Records 영구 redirect가 있다. Guitar의 일반 UI 패턴 참고 대상이며 음악 기능은 아니다. | [Records 상세 UI](../apps/web/src/app/[locale]/records/record-view.tsx), [Records 필터](../apps/web/src/app/[locale]/records/records-filter.tsx), [records.ts](../apps/web/src/lib/records.ts), [locale 홈](../apps/web/src/app/[locale]/page.tsx), [next.config.mjs](../apps/web/next.config.mjs) |

### 조사 시 검증 결과

2026-10-08 최초 조사 기준인 `b3b9dcf`의 로컬 작업 트리에서 다음 검증이 통과했다.

- `pnpm test`: 웹 3개 파일/9개 테스트, Worker 1개 파일/7개 테스트 통과.
- `pnpm --filter web typecheck`: 통과.
- `pnpm --filter web build`: 통과. Next 빌드가 45개 정적 페이지 생성을 완료했다.
- 실행 환경은 Node 24.16.0, pnpm 10.17.1이었다. 저장소의 Volta 고정값은 Node 24.18.0이다.

이는 당시 로컬 `.env.local` 및 미추적 콘텐츠가 포함된 작업 트리의 기준선이며, 운영 환경 또는 깨끗한 checkout의 검증 결과를 의미하지 않는다. 실제 DNS, TLS, Vercel Git 연동, Cloudflare 캐시 규칙, 운영 CWV는 미확인이다.

문서 커밋 준비 중 원격 `main`이 14개 커밋 앞선 것을 확인했다. `4e94fd0`까지의 변경과 최신 아키텍처 문서를 대조하고 로컬 main을 fast-forward했다. Records·랜딩·redirect 변경을 이 계획에 반영했다. 위 테스트 개수와 빌드 결과를 최신 커밋에 대한 재검증 결과로 해석하지 않는다.

## 3. PRD Coverage Matrix

변경 영역의 `[공유]`는 기존 블로그에도 영향을 줄 수 있는 변경, `[Guitar]`는 신규 기능 내부 변경을 의미한다. 재사용 가능성은 완성된 기능의 존재 여부와 구분한다.

| Requirement | Current Implementation | Reusability | Needed Change | Evidence | Risk |
| --- | --- | --- | --- | --- | --- |
| FR-01 목록/검색 | 게시물 목록·날짜 정렬만 있으며 곡·검색 기능 없음 | 부분 재사용 | [Guitar] 정적 곡 목록, 제목/아티스트 부분 검색, 최근 추가, 빈 결과 | E2 | 불안정한 날짜 기준, 과도한 인덱스 크기 |
| FR-02 악보 뷰어 | Markdown 렌더러만 존재 | 신규 구현 | [Guitar] ChordPro AST와 코드/가사 세그먼트 렌더러 | E2, E4 | 한글·영문 혼합 정렬과 모바일 줄바꿈 |
| FR-03 운지법 | 코드 사전·SVG 악보 없음; Records dialog 패턴 존재 | 부분 재사용 | [Guitar] 검증된 대표 폼 사전·SVG 추가, dialog/포커스 패턴 활용 | E4, E11 | 틀린 폼·슬래시 베이스 표시 |
| FR-04 Transpose | 없음 | 신규 구현 | [Guitar] root/bass pitch class 변환과 표기 정책 | E1, E2 | suffix 손상, 이명동음 역변환 |
| FR-05 Capo | 없음 | 신규 구현 | [Guitar] 원본 capo를 포함한 순수 계산 | E1, E2 | 실음과 운지 혼동, 조작 순서 의존 |
| FR-06 자동 스크롤 | 없음 | 신규 구현 | [Guitar] 시간 기반 스크롤, 수동 개입·종료 처리 | E4 | smooth scroll 충돌, 백그라운드 이동 |
| FR-07 읽기 설정 | light/dark, 글꼴 설정만 있음 | 부분 재사용 | [공유] System·저장 실패 처리; [Guitar] 크기·속도·곡별 설정 | E5 | 테마 초기화 회귀, hydration 이후 위치 변경 |
| FR-08 콘텐츠 | 파일 로더·메타데이터·정적 params 생성 패턴 있음 | 부분 재사용 | [Guitar] 별도 ChordPro 로더, 검증, slug 검사, 검색 데이터·sitemap | E2, E6, E7 | 기존 Markdown 모델에 강제 결합, 중복 slug |
| FR-09 로컬 에디터 | 해당 도구 없음 | 신규 구현 | [Guitar] 분리된 로컬 도구, 공유 파서/뷰어, 안전한 파일 저장 | E1, E7 | 쓰기 코드 배포 포함, 파일 경로 이탈 |
| FR-10 모바일 | 공통 반응형 CSS·헤더·Records dialog 패턴 있음 | 부분 재사용 | [Guitar] 악보 줄바꿈, 고정 조작부, 접근 가능한 운지법 UI | E4, E11 | 가사 가림, 터치 영역 겹침 |
| FR-11 아티스트 페이지 | 곡/아티스트 모델 없음 | 신규 구현 | P1: 아티스트 ID 기반 모음 | E2 | UI 문자열을 영구 식별자로 사용 |
| FR-12 복수 운지법 | 없음 | 신규 구현 | P1: 선택 UI; P0부터 사전 값은 배열 | E4 | 원본 코드와 표시 코드 불일치 |
| FR-13 버전/즐겨찾기 | 없음 | 신규 구현 | P1: 편곡 관계와 로컬 즐겨찾기 | E2, E5 | 초기 slug 변경으로 링크·설정 손실 |
| FR-14 스트로크 | 없음 | 신규 구현 | P1: 명시적 수동 패턴 모델·시각화 | E2 | 임의 패턴 추론 |
| 접근성 | 일부 aria 속성·포커스·감소 모션 규칙 있음 | 부분 재사용 | [Guitar] 코드 버튼·dialog·포커스 복귀·터치·명암비 검증 | E4, E5 | 연주 중 접근 불가 |
| 성능 | SSG와 React 기반; Guitar 실측 없음 | 부분 재사용 | [Guitar] 정적 HTML, 작은 검색 데이터, 최소 client 경계 | E6, E7 | 전체 곡 AST 번들링, 폰트·설정 CLS |
| 도메인/i18n | ko/en prefix 리다이렉트만 존재 | 부분 재사용 | [공유] Host 분기; Guitar는 한국어·무접두사 | E3 | locale redirect가 Guitar 요청을 선점 |
| SEO | 블로그 canonical·sitemap·robots 있음 | 부분 재사용 | [Guitar] 별도 origin·메타데이터·sitemap·robots | E6 | 블로그 host에 중복 노출, 내부 경로 유출 |
| 안전성/품질 | strict TS, Vitest, CI 있음 | 부분 재사용 | [Guitar] parser/music/route 검증 및 브라우저 회귀 | E8, E9 | Node 테스트만으로 레이아웃을 판단 |
| 저작권/공개 콘텐츠 | Guitar 공개 곡·허락 자료 없음 | 미확인 | 자작 테스트 콘텐츠 사용, 공개 곡별 이용 근거 확인 | 제공 PRD §5.4 | 가사·편곡의 권리 미확인 |

기존 폰트·색상·간격 토큰과 Vitest 실행 기반 자체는 그대로 사용한다. 기능 수준에서는 이를 조합할 Guitar 코드가 필요하므로 해당 행을 부분 재사용으로 분류했다.

## 4. 아키텍처 결정

### 4.1 배포 대안

| 대안 | 장점 | 비용/제약 | 결정 |
| --- | --- | --- | --- |
| 기존 앱, 단일 배포, Host Rewrite | 기존 빌드·공유 코드·배포 연결 유지, 앱 복제 불필요 | 미들웨어·SEO·캐시 경계의 회귀 검증 필요 | 채택 |
| 동일 저장소·동일 `apps/web`를 별도 Vercel 프로젝트로 배포 | 릴리스·도메인 운영 분리 | 중복 빌드·환경 설정·운영 관리 증가 | 실제 호스팅 제약으로 단일 배포가 불가능할 때 재검토 |

Next.js 15는 미들웨어 및 Host 조건 Rewrite를 지원하므로 코드 구조상 단일 배포가 가능하다. 다만 실제 Vercel 프로젝트의 추가 도메인 연결 가능 여부와 Cloudflare 설정은 운영 확인 사항이다. 현재 계획은 단일 배포로 고정하며, 문제가 발견되면 공개 배포를 보류하고 그 근거로 배포 계획을 수정한다.

참고: [Next.js 15 rewrites](https://nextjs.org/docs/15/app/api-reference/config/next-config-js/rewrites), [middleware](https://nextjs.org/docs/15/app/api-reference/file-conventions/middleware).

### 4.2 기능 경계와 예상 위치

| 신규 영역 | 위치 | 책임 |
| --- | --- | --- |
| 공개 페이지의 내부 라우트 | `apps/web/src/app/guitar/` | 레이아웃, 홈, 목록, 상세, 정적 SEO 응답 |
| 순수 도메인·화면 모듈 | `apps/web/src/features/guitar/` | `chordpro/`, `chords/`, `components/`, `hooks/`, `server/` |
| 악보 원본 | `content/guitar/songs/<artist-id>/<song-id>.chopro` | Git으로 관리하는 유일한 콘텐츠 원본 |
| 로컬 에디터 | `apps/web/tools/guitar-editor/` | 로컬 전용 UI·파일 읽기/쓰기·Vite 설정·별도 타입 검사 |
| 운영 문서 | `docs/guitar.md` | 지원 문법, 등록·검증·배포·복구 절차 |

파서·음악 계산·악보 렌더러는 Next.js 라우터나 Node 파일시스템에 의존하지 않게 한다. 파일 탐색은 `server/`, 파일 쓰기는 로컬 에디터에만 둔다. 공개 앱에서 에디터 모듈을 import하지 않는다. 아직 사용처가 없는 `packages/`로 공통 코드를 이동하는 리팩터링은 하지 않는다.

### 4.3 Host 라우팅 계약

- 기존 `middleware.ts`에서 **Host 판별을 locale 처리보다 먼저** 수행한다.
- `next.config.mjs`의 기존 Inspirations → Records redirects는 미들웨어보다 먼저 실행된다. 이 redirects에는 Guitar 운영·로컬·preview allowlist를 제외하는 Host 조건을 적용하여 Guitar 요청을 선점하지 않게 하고 블로그의 기존 영구 redirect는 보존한다.
- Guitar host는 설정된 정확한 hostname으로 비교한다. 포트를 분리하고 소문자로 정규화하며, 임의의 `X-Forwarded-Host`를 라우팅 근거로 사용하지 않는다.
- 운영은 `guitar.hodako.dev`, 로컬은 `guitar.localhost`를 사용한다. preview/E2E host는 환경 설정의 명시적 allowlist로 추가하고 wildcard로 Guitar를 열지 않는다.
- Guitar의 `/`, `/songs`, `/songs/[slug]`를 각각 `/guitar`, `/guitar/songs`, `/guitar/songs/[slug]`로 내부 Rewrite한다. query string은 보존한다.
- 외부에서 직접 요청한 `/guitar` 및 하위 경로는 양쪽 host에서 404 처리한다. 이 검사는 Rewrite 이전 원래 요청 경로에 적용한다.
- Guitar host의 블로그 locale·관리자·API·게시물 자산 경로는 404다. 필요한 공용 정적 자산과 `/_next` 리소스만 통과시킨다. 나머지 host에는 기존 블로그 동작을 유지한다.
- matcher가 점이 있는 요청을 일괄 제외하지 않게 수정하여 `/sitemap.xml`, `/robots.txt`, 내부 경로의 확장자 포함 요청도 검사한다. 정적 자산 예외가 내부 경로 차단보다 앞서지 않게 한다.
- 루트 레이아웃에서 Host를 읽지 않는다. 요청별 Host는 미들웨어에서만 분기하고 각 라우트의 정적 생성 가능성을 보존한다.
- 공개 링크는 내부 prefix 없이 생성한다. `typedRoutes`를 끄지 않고, Guitar 전용 경로 helper와 `Link`의 URL object를 사용해 Rewrite된 공개 URL을 전달한다. 직접 접근·client navigation·prefetch 모두 검증한다.

### 4.4 레이아웃·테마·SEO

- GuitarShell은 기존 CSS 변수·폰트를 사용하지만 블로그 SiteShell의 눈·별 효과와 블로그 내비게이션을 포함하지 않는다. Guitar 스타일은 CSS Modules로 제한한다.
- Guitar layout에서 metadataBase, title template, description을 명시하여 블로그 기본 메타데이터를 상속하지 않게 한다.
- canonical과 OG URL은 요청 Host로 조립하지 않고 `https://guitar.hodako.dev`를 기준으로 만든다. 상세 제목은 `곡명 — 아티스트`, 설명은 코드 악보 소개로 생성한다.
- Guitar sitemap은 홈·목록·검증된 모든 곡 상세를 포함하고 블로그 sitemap에는 Guitar URL을 넣지 않는다.
- Guitar 전용 `sitemap.ts`와 정적 `robots.txt/route.ts`를 내부 라우트 아래에 둔다. 외부 `/sitemap.xml`, `/robots.txt`에서 해당 응답으로 Rewrite한다. 기존 루트 robots/sitemap은 블로그용으로 유지한다.
- Next의 `robots.ts` 메타데이터 규약은 app 루트용이므로 Guitar 내부 경로에는 일반 Route Handler를 사용하고 `force-static`으로 선언한다. [Next.js robots 문서](https://nextjs.org/docs/15/app/api-reference/file-conventions/metadata/robots).
- 미등록 곡은 실제 404와 noindex로 처리한다. preview는 응답 헤더로 noindex를 적용한다. 곡별 OG 이미지와 구조화 데이터는 P1로 미루되 OG 제목·설명·URL은 P0에 제공한다.
- 두 host를 번갈아 요청하면서 HTML·canonical·robots·sitemap이 섞이지 않는지 CDN cache hit 상황까지 확인한다. `Vary: Host`만 추가하고 격리를 검증한 것으로 간주하지 않는다.

## 5. 콘텐츠·음악·UI 구현 계약

### 5.1 ChordPro 지원 범위와 오류 처리

직접 구현하는 UTF-8 줄 단위 파서는 다음을 지원한다.

- 메타데이터: `title`/`t`, `artist`, `key`, `capo`, `album`, `tempo`, `time`, `year`, `copyright`와 해당 `{meta: name value}` 형식.
- 태그는 반복 가능한 `{meta: tag 값}`으로 기록한다. `added`, `updated`는 `YYYY-MM-DD` 형식의 프로젝트 확장 metadata다.
- 인라인 코드 `[C]`, 코드만 있는 줄, 코드 없는 가사, 연속 코드, 빈 줄, 원본 공백을 보존한다.
- `start_of_verse`/`end_of_verse`, chorus, bridge와 `sov/eov`, `soc/eoc`, `sob/eob` 축약형을 지원한다. 섹션 label은 `: Verse 1`과 `: label="Verse 1"`을 지원한다. 섹션 밖 가사는 일반 verse로 렌더링한다.
- `#`로 시작하는 소스 주석은 표시하지 않는다. `{comment: ...}`/`{c: ...}`는 연주 안내로 표시한다. `[*...]`는 조옮김하지 않는 인라인 주석으로 처리한다.
- directive는 독립된 한 줄로 받는다. 일반 문자열은 React text로 출력하며 HTML·스크립트를 실행하지 않는다.

표준 근거: [ChordPro meta](https://www.chordpro.org/chordpro/directives-meta/), [섹션](https://www.chordpro.org/chordpro/directives-env/), [comment](https://chordpro.org/chordpro/directives-comment/), [공식 Cheat Sheet](https://www.chordpro.org/beta/chordpro-cheat_sheet/).

필수 metadata는 PRD대로 title, artist, key다. key는 A~G, 단일 accidental, 장조 또는 `m` 단조를 지원한다. capo 기본값은 0이고 정수 0~12만 허용한다. 단일 곡의 key/capo는 본문 이전에 한 번만 선언한다.

- 필수 필드 누락, 잘못된 수치·날짜, 닫히지 않은 bracket/directive, 섹션 종료 불일치·중첩, 중복 slug는 파일·행·열을 포함한 오류로 보고하고 빌드를 실패시킨다.
- 미지원 directive·알 수 없는 코드 표기는 원문과 위치를 AST에 남기고 경고한다. 공개 뷰어에서는 해석하지 못한 부분이 있음을 알린다.
- 본문 중 key/capo 변경, `{transpose}`, 비표준 tuning, TAB/grid처럼 음악 해석을 바꾸거나 범위 밖 악보를 요구하는 구문은 경고와 함께 게시 불가 오류로 취급한다. 잘못된 악보를 정상 출력한 것처럼 제공하지 않는다.
- 임의 환경, 반복 chorus 치환, 사용자 `{define}`, markup/metadata 치환, 줄 연속·이스케이프 확장, 여러 곡 파일은 MVP에서 지원하지 않는다. 감지한 미지원 구문을 조용히 적용하거나 삭제하지 않는다.

이 제한은 ChordPro 전체 구현을 약속하지 않는 PRD의 부분집합 방침을 구체화한다. 다만 미지원 구문을 경고만 하라는 요구보다 음악 의미 변경 구문에는 엄격하다. 이유는 실음의 정확성 보장이며, 대안은 해당 콘텐츠를 지원 문법으로 고치거나 후속 단계에서 문법 지원을 추가하는 것이다.

### 5.2 원본·AST·렌더링 분리

- 원본 파일이 최종 원본이다. 렌더링을 위해 원본을 다시 직렬화하거나 덮어쓰지 않는다.
- `parseChordPro(source)`는 metadata, 블록/줄/세그먼트 AST, 진단 목록을 반환한다. 노드는 source range와 필요한 raw token을 보존한다.
- `ChordToken`은 해석된 코드·미지원 코드·인라인 주석을 구분한다. 해석된 코드는 원문, root pitch class, suffix, 선택적 bass pitch class를 가진다.
- 줄 모델은 가사 줄·빈 줄·주석·미지원 directive를 구분한다. 가사 세그먼트는 텍스트와 그 시작 위치의 코드를 연결한다.
- `deriveSongView(ast, {transpose, capo})`는 원본 AST를 변경하지 않고 표시 이름과 조성을 계산한다. 운지법 조회도 이 표시 코드로 수행한다.
- 공개 페이지에는 해당 곡의 렌더링에 필요한 AST만 전달한다. 전체 라이브러리 원문·AST를 client bundle에 넣지 않는다.

### 5.3 slug·검색·정적 빌드

- 파일 경로는 `<artist-id>/<song-id>.chopro`, 공개 slug는 `<artist-id>--<song-id>`로 고정한다.
- 두 ID는 소문자 영숫자와 단일 하이픈 조합으로 제한하고 `--`는 금지하여 경로→slug 변환이 충돌하지 않게 한다. 디렉터리 깊이도 두 단계로 제한한다.
- 제목·아티스트 표시명을 수정해도 ID/URL은 바꾸지 않는다. 파일 이동·이름 변경은 URL 변경으로 취급한다. P0에서 자동 rename 기능은 제공하지 않는다.
- 모든 파일을 검증한 하나의 catalog에서 `generateStaticParams`, 홈/목록 검색 데이터, sitemap을 만든다. 검증 오류가 하나라도 있으면 부분 게시하지 않고 빌드를 실패시킨다.
- 상세는 정적 생성하고 `dynamicParams = false`로 미등록 slug를 거부한다. 공개 콘텐츠를 위한 서버 검색 API나 DB는 없다.
- 검색 인덱스에는 slug, title, artist, added 날짜와 정규화된 검색 문자열만 넣는다. 정규화는 Unicode NFC, trim, 연속 공백 축약, 소문자화이며 제목 또는 아티스트의 부분 일치를 사용한다. 초성 검색·fuzzy 검색은 제외한다.
- 기본 목록은 added 내림차순, 동률은 slug 순이다. 홈에는 최신 8곡을 표시한다. 에디터가 신규 파일에 `{meta: added YYYY-MM-DD}`를 자동 삽입한다.
- 수동 파일에 added가 없더라도 PRD의 필수 metadata 계약대로 빌드는 허용한다. 날짜 미지정 경고를 내고 날짜가 있는 곡 뒤에 slug 순으로 배치한다. filesystem mtime이나 빌드 실행 시간을 등록일로 사용하지 않는다.
- sitemap lastModified는 updated, 없으면 added를 사용하고 둘 다 없으면 생략한다. 원본 외 JSON manifest를 운영자가 수동 관리하지 않는다.

### 5.4 Transpose·Capo 계산

ChordPro의 key는 **원본 운지 기준 조성**이다. 예를 들어 key C, capo 2의 원본 실음은 D다. [공식 key](https://www.chordpro.org/chordpro/directives-key/), [capo](https://www.chordpro.org/chordpro/directives-capo/) 문서를 기준으로 다음 규칙을 사용한다.

```text
P  = 원본 코드 root 또는 bass의 pitch class
K  = 원본 key의 pitch class
C0 = 원본 capo (없으면 0)
T  = 사용자 Transpose (-12~+12, 정수)
C  = 사용자 capo (0~12, 정수; 최초 값 C0)

표시 운지 이동량 Δ = C0 + T - C
표시 코드         = mod12(P + Δ)
실음 코드         = mod12(P + C0 + T)
표시 운지 조성    = mod12(K + Δ)
실음 조성         = mod12(K + C0 + T)
mod12(n)          = ((n % 12) + 12) % 12
```

UI에는 Transpose, 선택 capo, 운지 조성, 실음 조성을 구분해 표시한다. Transpose 원복은 T만 0으로, 곡 설정 초기화는 T=0/C=C0로 되돌린다. 현재 표시 결과를 다시 변환하지 않고 매번 원본에서 계산한다.

| 원본 | T | 선택 capo | 표시 코드 | 실음 |
| --- | --- | --- | --- | --- |
| C, capo 0 | 0 | 2 | Bb | C |
| C, capo 2 | 0 | 2 | C | D |
| C, capo 2 | 0 | 0 | D | D |
| C, capo 2 | +2 | 4 | C | E |
| D/F#, capo 0, key D | +2 | 0 | E/G# | E/G# |

코드 해석은 root + 검증된 suffix + 선택적 `/bass`로 제한한다. root와 bass만 이동하고 suffix는 유지한다. 이 구조는 [ChordPro 코드 모델](https://www.chordpro.org/chordpro/chordpro-chords/)을 참고한다.

- P0 suffix: 빈 값, `m`, `5`, `6`, `m6`, `6/9`, `7`, `maj7`, `m7`, `mMaj7`, `9`, `maj9`, `m9`, `11`, `m11`, `13`, `m13`, `sus`, `sus2`, `sus4`, `7sus2`, `7sus4`, `add2`, `add4`, `add9`, `madd9`, `dim`, `dim7`, `aug`, `+`, `m7b5`, `7b5`, `7#5`, `7b9`, `7#9`, `7(b9)`, `7(#9)`.
- accidental은 `#`/`b`와 `♯`/`♭`를 입력으로 허용한다. 더블 accidental·독일식·Nashville 표기는 미지원 경고를 낸다.
- 미지원 표기는 원문을 유지하고 변환되지 않았음을 표시한다. 지원되는 코드의 변환까지 임의로 막거나, 모르는 suffix를 추측해서 바꾸지 않는다.
- 이명동음은 목표 운지 key의 조표 수가 적은 장/단조 이름을 선택하고 그 key의 sharp/flat 계열을 일관되게 사용한다. 동률은 원본 key의 계열을 유지하고 중립이면 sharp를 선택한다. 중립 key의 비다이아토닉 음은 flat 표기를 기본값으로 한다.
- `Δ mod 12 = 0`이면 원본 코드 표기를 그대로 사용한다. 따라서 +n 후 -n 원복 시 원문의 이명동음·suffix가 복원된다. 임의 조성의 이론적인 재철자·더블 accidental 생성은 하지 않는다.

### 5.5 운지법 모델과 사전

- `ChordVoicing`은 `id`, 정규화된 코드 식별자, 정확히 6개 원소의 frets, 선택적 fingers, baseFret, 선택적 barre 목록을 가진다. 사전 값은 처음부터 배열이고 MVP UI는 대표 폼 하나만 표시한다.
- 현 순서는 6번→1번, 튜닝은 E2 A2 D3 G3 B3 E4다. frets의 null은 mute, 0은 open이며 양수는 capo를 새로운 너트로 본 프렛 번호다. baseFret은 그림의 시작 프렛이며 frets를 다시 오프셋하는 값이 아니다.
- 초기 사전은 12 pitch class × major/minor/7/maj7/m7 대표 폼 60개와 D/F#, E/G# 대표 폼을 수동 작성한다. 외부 악보 서비스 데이터나 이미지 사전을 복사하지 않는다.
- 각 폼의 실제 음을 튜닝+프렛으로 계산해 코드 구성음·필수 음·슬래시 코드의 최저음을 검증한다. 개방현·뮤트·고위 프렛·barre의 SVG 배치도 검증한다.
- 이명동음은 같은 pitch class 사전 항목으로 조회한다. 확장/슬래시 코드의 정확한 항목이 없으면 “등록된 운지법이 없습니다”로 표시한다. 기본 3화음으로 대체하거나 임의 운지를 생성하지 않는다.

### 5.6 혼합 가사·모바일 렌더링

- 원본 줄을 코드/가사 세그먼트로 나누고 `flex-wrap` 컨테이너 안의 2행 `inline-grid`로 렌더링한다. 윗행은 코드, 아랫행은 대응 가사이며 공백 패딩·고정폭 글자 수 계산에 의존하지 않는다.
- 세그먼트 최소 폭은 코드가 겹치지 않을 만큼 확보하고 최대 폭은 가용 너비로 제한한다. 긴 가사는 세그먼트 내부에서 자연스럽게 줄바꿈하고 공백 없는 긴 문자열에는 `overflow-wrap`을 적용한다.
- 원본 공백과 빈 줄을 보존한다. 화면 너비에 따른 줄바꿈은 허용하되 가사 문자를 추가·삭제하거나 연속 줄에 코드를 중복 삽입하지 않는다. 코드만 있는 줄과 연속 코드는 빈 가사 셀로 유지한다.
- 긴 미지원 코드도 가로 잘림 없이 표시하고 경고한다. 글꼴 로드·크기 변경·가로 회전 후에도 동일 규칙으로 재배치한다.
- 코드 버튼과 조작부는 44px 이상의 터치 높이를 확보하고 인접 버튼의 hit area가 겹치지 않게 한다. 운지법은 native dialog 기반으로 클릭·터치·키보드를 지원하고 Escape/닫기 후 원래 버튼으로 포커스를 돌린다.
- 최신 Records의 native dialog와 포커스 복귀 패턴을 참고·재사용한다. Records 전용 화면 전체를 Guitar에 결합하거나 이를 위해 기존 화면을 대규모 리팩터링하지 않는다.
- 모바일 하단 조작부는 safe-area와 대응하는 본문 여백을 두어 마지막 가사를 가리지 않는다. 320/375/768px 및 데스크톱 폭, 200% 확대를 확인한다.

### 5.7 스크롤·설정·테마

- 자동 스크롤은 requestAnimationFrame의 시간 차이로 이동량을 계산한다. 속도는 1~10이며 `5 × 단계` px/s, 기본 단계는 3이다. 최초에는 정지 상태다.
- 시작/일시정지/재개는 현재 위치 기준이다. 문서 끝, 페이지 이동, 탭 비활성화, 운지법 dialog 열기 시 정지한다. wheel/touchmove/스크롤 키 입력 시 자동 일시정지하고 프로그램의 scroll 이벤트 자체에는 반응하지 않는다.
- Guitar의 문서 스크롤에는 기존 전역 `scroll-behavior: smooth`를 해제한다. 감소 모션 설정에서는 자동 재개하지 않고 명시적 재생 입력만 허용한다. 모든 RAF·이벤트 listener를 정리한다.
- 글로벌 설정은 `guitar:preferences:v1`의 fontSize/scrollSpeed, 곡별 설정은 `guitar:song:v1:<slug>`의 transpose/capo로 나눈다. 글자 크기는 기본 18px, 14~28px, 2px 단계다.
- 읽기·JSON 파싱·쓰기 실패와 손상된 값은 기본값으로 복구한다. 저장된 값 적용 전에 재생을 시작하지 않고 자동 재생 여부는 저장하지 않는다.
- ThemeProvider에 `ThemePreference = light | dark | system`을 추가하되 기존 소비자가 받는 effective theme은 light/dark로 유지한다. 기존 블로그의 light 기본값과 토글 UI는 유지한다.
- 루트 초기화 스크립트와 Provider 모두 System 해석·OS 변경 구독·저장소 예외 처리를 맞춘다. Guitar에서 3개 선택지를 제공한다.
- 테마 “공유”는 코드·디자인 재사용이다. 서로 다른 origin의 localStorage 설정까지 동기화하는 쿠키나 서버는 추가하지 않는다.

## 6. 로컬 에디터와 최소 의존성

### 6.1 대안과 선택

| 대안 | 장점 | 제약 | 결정 |
| --- | --- | --- | --- |
| 분리된 로컬 개발 도구 + 파일 API | 저장소 탐색, 중복 slug 검사, 실제 파일 저장 가능 | loopback API의 경로·요청 검증 필요 | 사용자 선택에 따라 채택 |
| 브라우저 파일 선택/File System Access + 다운로드 | 파일 쓰기 서버 불필요 | 브라우저 호환성, 디렉터리 전체 검증·덮어쓰기 UX 제약 | 채택하지 않음 |

`pnpm guitar:editor`가 웹 workspace의 로컬 Vite 도구를 `127.0.0.1:4174`에서 실행한다. 공개 앱과 다른 실행 경로이며 별도 운영 서버가 아니다. `apps/web/tools/guitar-editor/`는 Next 라우트 트리 밖에 두고 웹 production import graph에 포함하지 않는다.

- Source textarea + Live Preview를 데스크톱 2단으로 제공한다. 파싱은 입력 후 짧게 debounce하며 preview에는 공개 뷰어와 같은 파서·렌더러를 사용한다.
- metadata 폼 수정은 원문 source range만 패치한다. 파일 전체를 AST로 재직렬화하지 않아 주석·미지원 구문·공백을 보존한다.
- 신규 파일 생성, 목록, 열기, 저장을 제공한다. 오류는 행/열과 함께 표시하고 오류가 남은 파일의 콘텐츠 디렉터리 저장은 막는다. 경고는 표시 후 저장을 허용한다.
- 로컬 인터페이스는 `GET /__editor/songs`, `GET /__editor/song?path=...`, `PUT /__editor/song`으로 한정한다. 저장 요청은 상대 경로, source, 열 때 받은 revision을 보내고 성공 시 새 revision과 diagnostics를 반환한다.
- 기존 파일은 revision 불일치 시 409로 충돌을 알리고 덮어쓰지 않는다. 신규 파일은 존재하지 않는 경로만 허용하며 저장은 임시 파일→rename으로 수행한다. 저장 동작은 경로별로 직렬화한다.
- 쓰기는 지정된 `content/guitar/songs` 아래의 유효한 `.chopro` 경로만 허용한다. 절대 경로·`..`·symlink 이탈을 거부하고 신규 부모 경로까지 검사한다.
- loopback bind, 정확한 Host/Origin 검증, JSON Content-Type과 요청 크기 제한을 적용한다. 외부 origin의 읽기/쓰기를 허용하지 않는다. Vite 파일 제공 허용 범위도 필요한 소스·폰트로 한정한다.
- 공개 `/editor`나 dev 조건부 Next 쓰기 Route Handler를 만들지 않는다. production manifest·추적 파일에서 에디터 모듈 및 쓰기 endpoint 부재를 확인한다.

### 6.2 의존성 결정

| 대상 | 결정 | 이유와 대안 |
| --- | --- | --- |
| ChordPro/음악/운지법/검색 | 신규 런타임 패키지 없음 | 지원 부분집합·pitch class 계산·작은 배열 검색을 직접 구현. 전체 ChordPro 엔진·검색 엔진은 과도함 |
| 에디터 실행 | 웹 devDependency에 `vite` 직접 선언, 기존 lockfile의 8.2.0 계열 재사용 | TSX·CSS·공유 React 모듈 실행과 개발 서버 middleware 제공. 전이 의존성에 암묵적으로 의존하지 않음 |
| 에디터 UI | textarea, React, 기본 TSX 변환 | Monaco/CodeMirror와 React Fast Refresh 플러그인은 MVP에 불필요 |
| 브라우저 검증 | 웹 devDependency에 `@playwright/test` 추가 | 실제 줄바꿈·터치·스크롤·Host routing은 Node Vitest만으로 검증 불가. 대안인 수동 확인만으로 회귀를 맡기지 않음 |
| 단위 테스트 | 기존 Vitest 재사용 | 새 단위 테스트 runner·DOM 모의 환경은 추가하지 않음 |

Vite는 TSX를 기본 지원하며 개발 서버 `configureServer`에서 로컬 middleware를 등록할 수 있다. editor config에서 공유 TSX의 JSX 변환과 `@/` alias를 명시하고 별도 `tsconfig`로 도구 코드도 검사한다. [Vite JSX](https://vite.dev/guide/features.html#jsx), [개발 서버 hook](https://vite.dev/guide/api-plugin.html#configureserver).

## 7. 단계별 구현과 독립 커밋

각 단계의 테스트는 해당 기능 커밋에 포함한다. 범위 변경 전 `docs/`를 다시 확인하며, 커밋 메시지는 [git-rules.md](git-rules.md)의 한국어 시맨틱 형식을 따른다.

### 1단계 — 도메인 경계와 전용 화면 뼈대

- 목표: FR-10 및 도메인 경계. `middleware.ts`, `next.config.mjs`의 redirect Host 조건, `app/guitar/`, Guitar 경로 helper를 추가·수정한다.
- 재사용/의존성: 기존 Next 라우터·CSS 토큰·ThemeProvider, 신규 의존성 없음.
- 검증/회귀: Vitest로 Host·locale·내부 경로·확장자·query 분기를 검사한다. 블로그의 홈→목록 및 Inspirations→Records redirect와 기존 API 예외를 보존한다.
- 커밋: `feat(guitar): 서브도메인 라우팅과 전용 레이아웃 추가`.

### 2단계 — 원본·파서·catalog·음악 계산

- 목표: FR-08, FR-04, FR-05. `features/guitar/chordpro/`, `chords/`, `server/`, `content/guitar/songs/`와 `docs/guitar.md`를 추가한다.
- 재사용/의존성: 기존 파일 로더·정적 params의 패턴을 참고하되 Markdown 로더는 변경하지 않는다. 신규 의존성 없음.
- 검증/회귀: parser fixtures, metadata/slug 실패, 전체 음정의 역변환, 원본 capo·조작 순서 불변성 테스트. 자작 샘플과 원본 capo가 있는 샘플을 사용한다.
- 커밋: `feat(guitar): ChordPro 콘텐츠와 조옮김 계산 기반 추가`.

### 3단계 — 정적 뷰어와 운지법

- 목표: FR-02, FR-03, FR-10. 상세 페이지, `features/guitar/components/`, 운지법 데이터와 CSS Modules를 구현한다.
- 재사용/의존성: React·SVG·공통 폰트·색상. Playwright와 최소 browser test 설정을 이 단계에서 추가한다.
- 검증/회귀: 자바스크립트 없이 초기 가사/코드가 HTML에 존재하는지 확인한다. 혼합 가사·긴 코드·빈 줄·모바일 폭·확대·dialog 포커스 및 운지법 검증을 수행한다. 전역 CSS selector 추가를 최소화한다.
- 커밋: `feat(guitar): 반응형 코드 악보와 운지법 뷰어 구현`.
- 이 단계까지 완료하면 한 곡의 정적 열람·Transpose·Capo·운지법이 동작하는 첫 수직 기능 묶음이 된다. 전체 P0 완료로 간주하지 않는다.

### 4단계 — 연주 조작과 설정

- 목표: FR-06, FR-07, FR-10. Guitar hooks/toolbar, 공유 ThemeProvider와 루트 theme bootstrap을 보완한다.
- 재사용/의존성: 기존 테마 저장키와 효과적인 light/dark 값 유지, 신규 패키지 없음.
- 검증/회귀: RAF 시간 차이·수동 스크롤·끝 정지·탭 전환·listener 정리, storage 차단·손상, OS theme 변경을 검증한다. 블로그 기존 light/dark UI와 초기 표시를 별도 확인한다.
- 독립 커밋: `feat(theme): 시스템 테마와 저장소 실패 처리 지원`, `feat(guitar): 자동 스크롤과 연주 설정 추가`.

### 5단계 — 로컬 등록 도구

- 목표: FR-09. `apps/web/tools/guitar-editor/`, root/web scripts, 도구 tsconfig, 문서와 Quality 검사 항목을 추가한다.
- 재사용/의존성: 공개 파서·뷰어·CSS, 기존 React. devDependency Vite를 직접 추가한다.
- 검증/회귀: 신규/기존 파일 열기·미리보기·metadata 수정·저장·재열기, 원문 보존, 중복 slug, revision 충돌, 경로 이탈·외부 Origin 거부를 임시 디렉터리에서 테스트한다. production 빌드가 도구를 import하지 않는지 확인한다.
- 커밋: `feat(guitar-editor): 로컬 악보 작성과 파일 저장 도구 추가`.

### 6단계 — 검색·SEO·배포 준비

- 목표: FR-01 및 FR-08 완료. 홈/목록·검색, Guitar metadata/sitemap/robots, Quality E2E, 문서의 배포 절차를 완성한다.
- 재사용/의존성: 단일 catalog·기존 Next metadata 및 CI, 추가 런타임 의존성 없음.
- 검증/회귀: 한 파일 추가가 상세·목록·검색·sitemap에 함께 반영되는지 확인한다. 양쪽 Host의 직접 요청·prefetch·404·canonical·robots를 production 모드에서 검사한다.
- 커밋: `feat(guitar): 곡 검색과 전용 검색엔진 메타데이터 추가`, `test(guitar): 도메인 격리와 블로그 회귀 검증 추가`.

### 7단계 — 운영 연결과 출시

- 목표: 기존 배포 기반으로 `guitar.hodako.dev`를 연결하고 MVP Done Definition을 확인한다.
- 예상 변경: 실제 운영 상태를 먼저 확인한 뒤 `infra/pulumi/index.ts`에 Guitar CNAME을 추가한다. 기존 DNS가 있으면 중복 생성하지 않고 관리 상태를 맞춘다. Vercel 도메인 연결과 Git 배포 설정도 확인한다.
- 검증/회귀: Pulumi 타입 검사와 preview, 실제 TLS/Host 보존/캐시 교차 노출 점검, 블로그 홈·글·테마·관리자·댓글 경로 smoke test. 공개 곡은 사용 근거가 확인된 것만 포함한다.
- 커밋: `feat(infra): Guitar 서브도메인 DNS 설정 추가`, `docs(guitar): 악보 등록과 배포 운영 절차 정리`.
- 블로그와 같은 릴리스이므로 문제 시 이전 Vercel 배포로 되돌리는 절차를 기록한다. DB migration은 없다. 운영 연결은 구현 및 검증이 완료된 후 수행한다.

## 8. 검증·출시 기준

### 자동 검증

| 영역 | 필수 시나리오 |
| --- | --- |
| 파서 | metadata/축약형/섹션/주석/빈 줄/연속 코드/한글·영문·공백 보존, malformed 입력과 미지원 구문 진단 |
| 콘텐츠 | 필수 metadata 누락, 잘못된 capo·날짜, 경로/slug 충돌, 파일 순서와 무관한 catalog·정렬 |
| 음악 | 12개 root, 모든 지원 suffix, bass 동시 이동, 음수 modulo, +n/-n 원문 복귀, 미지원 코드 원문 유지 |
| Capo | C0=0/2/12, C=0/12, T=-12/+12, 서로 다른 조작 순서의 동일 결과 |
| 운지법 | 6현 길이·정수·open/mute·baseFret·barre, 구성음·필수음·실제 최저 bass, 없는 항목 fallback |
| 뷰어 | 320/375/768px 및 데스크톱, 200% 확대, 긴 무공백 가사·긴 코드·연속 코드, 텍스트 불변·가로 overflow 없음 |
| 연주 조작 | 30/60/120fps에서 시간 기준 이동량, 시작/정지/재개/끝/탭 비활성/수동 개입/정리 |
| 저장 설정 | storage 접근 예외, JSON 손상, 범위 밖 값, 곡 간 설정 격리, 테마 bootstrap 일치 |
| 에디터 | 실제 임시 파일 read/write, 원문 보존, 충돌 거부, 잘못된 경로·symlink·Host·Origin 거부 |
| 배포 격리 | production routes와 추적 파일에 에디터/쓰기 모듈 없음; 로컬 endpoint는 공개 앱에서 404 |
| 라우팅/SEO | 각 Host의 홈/목록/상세, 내부 prefix·블로그 경로 교차 접근, 미등록 곡 404, canonical·robots·sitemap·RSC/prefetch |
| 기존 블로그 | ko/en 진입→블로그 목록·언어 쿠키·글 이동·Records 목록/상세·이전 Inspirations redirect·테마·폰트·자산·sitemap·관리자·댓글 동작 보존 |

웹 변경의 최종 검증 순서는 `pnpm --filter web typecheck` → `pnpm --filter web build`를 유지한다. 여기에 `pnpm test`, 에디터 별도 타입 검사, 신규 `pnpm --filter web test:e2e`를 결합한다. E2E는 production 서버와 명시적으로 구성한 테스트 Host에서 실행하며 실제 브라우저 검증은 Chromium과 WebKit을 포함한다.

CI에 콘텐츠 오류 실패와 production editor 부재 검증을 추가한다. 로컬 에디터 관련 TS 변경도 품질 검사에서 빠지지 않도록 lint-staged/Quality의 검사 대상을 조정한다. worker·DB 회귀는 기존 CI를 유지하고 이번 기능을 위해 새로운 데이터 계층 테스트를 만들지 않는다.

### 수동·운영 검증

- 실제 모바일 Safari/Chrome에서 터치, 회전, 고정 조작부, viewport 변화, dialog, 수동 스크롤을 확인한다.
- 초기 악보 HTML과 서버 검색 요청 부재, 필요한 client bundle만 전달되는지 확인한다. 크기 설정 복원·폰트 로드로 인한 레이아웃 이동도 측정한다.
- LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1은 실사용 목표다. 로컬 테스트나 Lighthouse만으로 달성했다고 선언하지 않는다. 출시 전 lab 측정과 출시 후 제공 가능한 실제 사용자 지표를 구분해 기록한다.
- 공개 곡의 가사·원곡·편곡 사용 근거를 확인한다. 예제는 자작 가사와 코드 진행으로 만들고, 필요 시 운영자가 제공한 연락 경로로 저작권 고지·삭제 문의를 안내한다.

### Must-have / Can defer

**Must-have:** FR-01~FR-10 전체, 원본 capo 계산, 모바일 정렬, 정확한 운지법 또는 명시적 fallback, 로컬 저장, production 쓰기 경로 부재, Host·SEO 격리, 기존 블로그 회귀 검증, 공개 콘텐츠 사용 근거 확인.

**Can defer:** FR-11~FR-14, 다국어 Guitar UI, ChordPro 전체 표준, 복수 운지법 선택, 코드 사전의 모든 확장 코드, 초성/fuzzy 검색, 코드 에디터 라이브러리, 곡별 OG 이미지, 구조화 데이터, domain 간 설정 동기화.

최소 구현 순서는 **Host 경계 → 파서/순수 계산 → 샘플 상세/운지법 → 연주 설정 → 로컬 작성 → 검색/SEO → 운영 연결**이다. P0를 줄여 부르는 대신 첫 동작 가능한 기능 묶음과 출시 가능한 MVP를 구분한다.

## 9. 미확인 사항과 PRD 차이

| 항목 | 확인 상태와 처리 |
| --- | --- |
| Vercel Root Directory·Git 연동·추가 도메인 | 파일만으로 미확인. 배포 단계에서 실제 프로젝트를 확인하며 이미 설정됐다고 가정하지 않는다. |
| Cloudflare DNS·프록시·캐시·TLS | Pulumi의 선언만 확인했다. 실제 상태와 Host 전달·캐시 격리를 출시 전에 확인한다. |
| 공개할 곡과 권리·문의 연락처 | 제공되지 않았다. 자작 테스트 콘텐츠로 개발 가능하며 외부 곡 공개 전에 확정한다. |
| PRD의 기존 Light/Dark/System 재사용 | 실제 기존 구현에는 System이 없다. 공유 Provider·bootstrap을 확장하되 기존 블로그 토글 동작을 보존한다. |
| 원본 key의 의미 | 공식 ChordPro대로 운지 기준으로 확정했다. 별도 실음 기준 key 필드를 추가하지 않는다. |
| 최근 추가 날짜 | 필수 metadata를 늘리지 않기 위해 added는 선택 확장으로 두고 에디터가 자동 기록한다. 날짜 없는 수동 파일은 경고와 명시적 후순위 처리다. |
| 미지원 음악 지시어 | 단순 경고로 틀린 실음을 게시할 수 있어 일부는 게시 오류로 강화했다. 전체 표준 지원 대신 지원 범위 내 수정이 MVP 대안이다. |
| 별도 서버 금지 | 새 운영 서비스는 없다. PRD가 허용한 개발 서버 전용 도구로만 로컬 파일 API를 제공한다. |
| 입력 PRD/실행 프롬프트 | 조사 시 로컬 미추적 파일이다. 이번 계획 문서는 요구사항과 결정을 독립적으로 기록하며 입력 파일의 추가 커밋은 포함하지 않는다. |

구현 진행 기록 (2026-10-10): 1~6단계는 코드와 자동 검증까지 완료했다. 블로그 회귀 E2E는 언어 쿠키, 글·댓글, Records 상세, 이전 Inspirations redirect, 자산, 관리자, 테마와 글꼴까지 확인한다. 7단계는 Cloudflare DNS·Pulumi/Vercel 운영 상태와 인증 수단을 현재 작업 환경에서 확인할 수 없어 보류 중이다. Cloudflare/Vercel CLI와 자격 증명이 없고, 공개 Guitar 도메인은 Chrome에서 `DNS_PROBE_FINISHED_NXDOMAIN`으로 확인됐다. 실제 DNS 변경이나 배포는 수행하지 않았다. 운영 연결 전 Pulumi preview, 기존 레코드 대조, TLS/Host/캐시 격리 및 실기기·성능 검증을 완료해야 한다. 이 작업 세션에서는 커밋하지 않는다.
