# Tailwind 공통 UI 통합

> 과거 구현 기록입니다. 현재 개발·검증 절차는 [Storybook workflow](workflow.md)와 [전환 결과](storybook-migration.md)를 따릅니다. 아래 Pen 갱신·동기화 후속 작업은 필수 작업에서 제외되었으며 선택적 보관 자료 검토로만 남습니다.

작업 시작 2026-10-21, 검증 2026-10-22. 브랜치 `feat/tailwind-shared-ui`.
운영 UI의 SSOT는 코드와 토큰이다. 이 결정은 이전 Pen-first 절차를 대체한다.

## Repository audit

| 항목 | 조사 결과 / 결정 |
| --- | --- |
| Framework | Next.js App Router 15.5.14 / React 19.2.4 / strict TypeScript. 교체하지 않음 |
| Toolchain | pnpm 10.17.1 workspaces, Node 24.18.0. 기존 런타임 유지 |
| Tailwind | 기존 미설치. v4.3.3 + @tailwindcss/postcss 4.3.3 도입 |
| 기존 tokens | `src/design-system/tokens.css`의 Primitive → Semantic → Component alias 재사용 |
| 기존 shared UI | `components/ui.tsx` + Next 어댑터 `ui-link.tsx`. 같은 파일/API를 확장 |
| shadcn / Radix / CVA | 모두 미설치. shadcn의 source-owned CVA + cn 패턴을 적용하고 CVA 0.7.1, clsx 2.1.1, tailwind-merge 3.7.0과 실제 키보드 소비자가 있는 Radix ToggleGroup 1.2.1만 추가 |
| Blog / Guitar 공유 | 같은 `apps/web` 앱. Guitar host rewrite와 별도 layout도 SiteDocument/토큰/공통 React UI를 공유 |
| 로컬 Guitar editor | 같은 SongReader를 Vite로 렌더링. 공통 Tailwind stylesheet도 함께 로드 |
| Pen | `hodako.lib.pen`, `blog.pen`, `guitar.pen`. 자동 동기화 없음. 코드 기준 디자인 검토에 사용 |
| 기존 불일치 | 일반 버튼 48px, header 36/40/44px 혼합, 기본 field radius 4px vs compact 8px. 필터/탭/locale option/복사/설정/재생 버튼의 선택·hover·focus를 각 CSS가 독립 관리 |
| 기존 hover 문제 | secondary normal/hover가 같은 surface를 사용. 선택 방식은 밑줄/current 배경/pressed border 등으로 분산 |
| 기존 검증 도구 | Vitest, Playwright, Vite editor E2E 존재. Storybook/ESLint/lint script는 없음 |

추가한 빌드 경로는 [Tailwind PostCSS](https://tailwindcss.com/docs/installation/using-postcss), 기존 token 참조는 [@theme inline](https://tailwindcss.com/docs/theme#referencing-other-variables)을 따른다. [Preflight 제외 방식](https://tailwindcss.com/docs/preflight#disabling-preflight)을 사용해 기존 문서/본문/배경 reset을 유지한다. [shadcn Button](https://ui.shadcn.com/docs/components/radix/button)과 [Toggle Group](https://ui.shadcn.com/docs/components/radix/toggle-group)의 구성 방식을 기존 디자인에 맞게 적용했으며 기본 shadcn 테마/폰트/반경/애니메이션을 가져오지 않았다.

## 토큰과 공통 컴포넌트

```text
tokens.css (실제 값, Light/Dark)
  → tailwind.css @theme inline (semantic utility alias)
  → control-variants.ts (CVA variant/size/state 조합)
  → ui.tsx Button / IconButton / ToggleButton
  → ui-link.tsx Next typed anchor
  → segmented-control.tsx Radix single choice
```

- 팔레트 Ink/Navy/Blue/Cyan/Paper와 기존 대비 보정색/status/sky 토큰을 유지한다.
- primary는 기존 중립 solid, secondary는 Light의 muted paper/Dark의 navy surface다. outline/ghost는 투명 배경에서 경계/텍스트의 강도를 구분한다.
- destructive는 실제 댓글/개인 프리셋 삭제에 기존 danger semantic을 사용한다.
- Button size sm/md/lg/icon = 최소 44/48/56px 및 44 × 44px. 공통 radius는 button-radius(8px)이며 field도 같은 alias를 참조한다.
- 상태는 native aria-pressed/expanded/current/selected/checked를 보존하고 같은 선택 배경/경계를 공유한다. Focus-visible 2px/offset 2px, disabled opacity 0.55, UI motion 160ms/reduced-motion을 공유한다.
- `cn.ts`는 custom font-size/font-family/font-weight/spacing namespace를 tailwind-merge에 등록한다. 색상과 글자 크기가 서로 제거되는 문제를 단위 테스트로 검사한다.
- `ActionButton` alias는 유지한다. 기존 quiet → ghost, compact → sm, default → md로 소비자를 마이그레이션했다. 실제 사용처 없는 brand runtime variant는 제거했다. field density compact는 유지한다.
- IconButton은 aria-label을 필수로 받는다. ToggleButton은 controlled pressed와 native onClick을 사용한다. SegmentedControl은 Radix의 roving focus와 Arrow/Home/End, disabled 건너뛰기, 선택 해제를 막는 단일 선택을 제공한다.
- variant/size Tailwind 조합은 CVA에 모인다. 페이지는 props와 배치 class만 사용한다.

## 마이그레이션 범위 / 중복 제거

| 범위 | 전환 및 유지한 동작 |
| --- | --- |
| 공유 Header | 모바일 메뉴 Button outline/sm. Escape/경로 변경/링크 클릭 닫기와 ref 포커스 복원 유지 |
| Language / Font / Theme / Motion | 같은 sm/ghost와 선택 상태. 언어 메뉴의 menuitemradio·키보드·번역 경로·검색어, font/theme/motion 저장 정책 유지 |
| Guitar Header | 악보 탐색은 UiLink. 자동/눈/별 선택은 native select를 유지하고 같은 CVA 외형 사용 |
| Blog navigation | Next typed UiLink + ghost/sm. aria-current page 유지 |
| Article | 코드 복사 Button outline/sm, 클립보드·status·Shiki·내부 스크롤 유지. fallback 이동은 기존 UiLink. 현재 pagination 기능은 없어 새 기능을 만들지 않음 |
| 댓글 / Admin | 같은 Button API가 새 CVA를 사용. 실제 댓글 삭제에 destructive 적용. native form submit/name/value 유지 |
| Records | 탭/재생/기울이기/닫기는 같은 Button/Toggle/IconButton. 기존 tab roving focus·transition·zoom 복원·음반 회전 유지 |
| Guitar reader | 음정/글자 크기 IconButton, 스크롤 ToggleButton, 설정 펼침 Button, 초기화/프리셋/삭제의 공통 variant/size. 기존 preferences/voicings/readings/local storage 유지 |
| Guitar search | 카테고리를 SegmentedControl로 전환. 카테고리/검색의 실제 값과 결과 필터 유지 |
| Vite editor | 공유 SongReader에 Tailwind CSS 로드. 편집기 저장/파서/API는 변경하지 않음 |

`primitives.css`의 `.button`/secondary/brand/quiet/compact/pressed/hover/focus 중복을 제거했다. `globals.css`에서 header trigger/menu option/nav/tab/play/close의 시각 규칙과 모바일 높이 예외를 제거했다. `code-block.module.css`의 copyButton 외형, Guitar module의 category button/설정 trigger/preset action 외형을 제거했다. 기존 reset만 base layer에 두어 unlayered reset이 Tailwind의 font/color를 덮지 않게 했다. CSS module에는 배치와 도메인 규칙을 남겼다.

유지한 전용 UI는 음반 artwork 전체 클릭, 악보의 코드 앵커, 이미지/텍스트 Quiz radio option, WheelPicker다. artwork/악보 조작을 일반 버튼의 고정 크기에 맞추면 콘텐츠 배치와 원문 위치가 깨진다. 이들은 기존 구조를 유지하며 Quiz의 radius는 공통 alias를 사용하고 작은 hover lift를 제거했다. 주요 배경·음반 애니메이션은 그대로다.

## Pen 검토

기존 Button/Compact/Field origin과 Variables를 공식 MCP/interactive API로 조회했다. 데스크톱이 같은 경로의 오래된 세션을 보고 있어 그 세션을 저장하지 않고 디스크의 최신 라이브러리를 독립 세션에서 재오픈했다. 기존 origin/ref를 보존하며 공통 field radius, secondary background, 작은 버튼 크기/문구를 코드에 맞췄다. Light/Dark 검토 보드를 추가하고 코드가 SSOT임을 명시했다. Pen의 disabled opacity는 percent 55로 코드의 fraction 0.55와 대응시키며, 기존 literal instance는 같은 변수 참조로 묶었다. Brand는 과거 준비 시안으로만 표시한다.

Pen 파일을 일반 JSON parser로 읽거나 serialized ID/reference를 수동 편집하지 않았다. 기존 blog/guitar canvas의 모든 화면을 다시 그리는 작업은 포함하지 않는다. 실제 검증 결과는 브라우저 화면이 기준이다.

## 초기 통합 검증

검증은 `/tmp/hodako-tailwind-ui-5s8jzc82`의 격리 사본과 4350 포트를 사용한다. 기존 `.next`와 실행 중인 앱을 덮어쓰지 않는다. 같은 fixture를 locale layout에 임시 연결한 `/ko/ui-review`는 검증 사본에만 존재한다. 제품 router에는 UI Lab/preview/API를 추가하지 않는다.

| 검증 | 결과 |
| --- | --- |
| Web typecheck | 통과 (최종 제품 소스, Next typegen + tsc) |
| Guitar editor typecheck | 통과 |
| Unit | 13 files / 57 tests 통과. native/ref/form, semantic utility merge, 토큰 alias/대비 포함 |
| 공통 UI / 상태 | 17 E2E 통과. 6페이지 × 390/768/1440 × Light/Dark = 36 화면, 별도 6개 control gallery 조합 포함 |
| Blog P2 | 19 E2E 통과. 추가 320px, 메뉴/Escape/locale, theme/motion persistence, code copy failure, blocked storage, skip link |
| Locale / Font | 4 E2E 통과. JS 없는 HTML/redirect와 Pretendard CSS ordering/reload/locale |
| Guitar | Chromium + WebKit 44 E2E 통과 (42 최초 통과 + 카탈로그 기대 보완 후 2 재검증) |
| Vite editor | 2 E2E 통과. 미리보기/편집/저장 및 기존 API 제약 |
| Production build | 임시 UI route를 뺀 실제 제품 소스 69 static pages 통과 |
| Source / router | 최종 저장소 src 139개 파일과 검증 사본 hash 일치. production manifest에 ui-review 없음 |
| Diff | git diff --check 통과 |
| Lint | 기존 ESLint/config/script 미구성. 별도 lint 실행/통과로 집계하지 않음 |

E2E는 총 86개 시나리오다. 브라우저에서 글/버튼의 기존 서체, 선택 상태, 44/48/56px 크기, 공통 8px radius, 2px focus, 0.55 disabled와 overflow를 확인했다. 핵심 토큰의 일반 글자/액션 대비 4.5:1, 필드 경계 3:1 검사도 통과했다. 모든 기기/콘텐츠의 접근성 인증은 아니다.

검증 중 고친 테스트 전제는 다음과 같다. 기존 영어 글이 draft라 English Blog가 Korean Blog로 fallback하는 정책은 유지했다. locale/motion/font 전환은 양쪽 언어를 제공하는 Records에서 검사하고 server HTML 테스트는 실제 공개 locale 카탈로그로 fallback을 판단한다. Guitar 목록 복원 테스트의 고정 한 곡 기대는 검색 전 실제 목록 개수를 복원하는 검사로 바꿨다. UI를 바꿔 기존 콘텐츠 정책을 우회하지 않았다.

### 다시 실행하기

실제 제품 페이지 검사는 기존 design-system config로 실행한다. Gallery 검사 6개는 UI_REVIEW_FIXTURE=1일 때만 실행하므로 일반 production server에 검증 route가 없어도 기본 검사가 동작한다.

검증용 임시 사본에서만 `src/app/[locale]/ui-review/page.tsx`를 아래 내용으로 만든 뒤 별도 NEXT_DIST_DIR로 build/start한다. locale layout과 실제 공통 UI/토큰을 그대로 사용한다.

```tsx
export {ControlGallery as default} from "../../../../e2e/fixtures/control-gallery";
```

```sh
pnpm --filter web typecheck
pnpm --filter web guitar:editor:typecheck
pnpm --filter web test
pnpm --filter web build
UI_REVIEW_FIXTURE=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:4351 pnpm --filter web exec playwright test -c design-system.playwright.config.ts
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4351 pnpm --filter web exec playwright test -c p2.playwright.config.ts
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4351 pnpm --filter web exec playwright test -c locale.playwright.config.ts
PLAYWRIGHT_BASE_URL=http://guitar.localhost:4351 pnpm --filter web exec playwright test --workers=2
pnpm --filter web test:editor:e2e
git diff --check
```

현재 검토 링크: [Blog](http://127.0.0.1:4351/ko/blog), [Guitar](http://guitar.localhost:4351/songs). 후속 수정부터 4351은 격리 사본의 dev server를 사용하며 검증용 gallery route는 연결하지 않는다. 저장소 변경은 해당 사본에 복사한 뒤 반영한다.

선택한 이미지: [공통 UI Dark](../../design/evidence/tailwind-ui/browser/controls-1440-dark.png), [공통 UI Mobile Light](../../design/evidence/tailwind-ui/browser/controls-390-light.png), [Guitar Dark](../../design/evidence/tailwind-ui/browser/song-1440-dark.png), [Guitar 설정 Light](../../design/evidence/tailwind-ui/browser/settings-390-light.png), [Blog 768px Light](../../design/evidence/tailwind-ui/browser/blog-768-light.png). 전체 실행 artifact는 /tmp/hodako-tailwind-*에 있고 선택 이미지는 design/evidence/tailwind-ui에 보존했다.

## 사용자 검토 후 반영

- Language trigger의 장식 아래 화살표와 관련 CSS를 제거했다. 언어 선택/ARIA/키보드 동작은 유지한다.
- Guitar 헤더 ‘악보’는 공통 UiLink의 텍스트 외형으로 표시한다.
- 배경 효과 정지/재생 버튼과 저장값 복원을 제거했다. 기존 `site-motion=paused`도 재생을 막지 않는다. OS reduced-motion과 숨겨진 탭의 canvas 일시정지는 유지한다.
- 후속 검증은 web typecheck, 헤더/Guitar 키보드 E2E 1개, 배경 관련 E2E 6개와 diff 검사 통과다. 초기 통합의 전체 검증 수와 별도로 기록하며 후속 수정 뒤 전체 build는 재실행하지 않았다.
- 위 헤더 제어 변경은 운영 코드가 기준이며 기존 Pen/증빙 이미지는 초기 통합 시점의 검토 자료다.

## 제한과 후속

- 저장소에는 ESLint와 lint script가 없다. 별도의 lint 통과를 주장하지 않으며 TypeScript/Next build 검사와 diff whitespace 검사를 기록한다.
- lg size는 API/fixture로 검증하며 현재 제품에 필요 없는 큰 CTA를 추가하지 않는다.
- 스크린리더/실기기 전체 감사, 실제 관리자 mutation/댓글 저장, 외부 embed/광고 송출은 이번 UI 검증 범위에 포함되지 않는다.
- 작업 전부터 존재한 generated next-env 상태, privacy page, untracked 콘텐츠/디렉터리는 이 작업의 변경 목록에서 제외한다. 기존 변경을 되돌리거나 staging하지 않는다.
- 초기 요청 이후 사용자가 분리 커밋과 푸시를 요청했다. NEON 악보 파일은 제외하고 `feat/tailwind-shared-ui` 브랜치에 UI 구현·회귀 테스트·디자인 문서를 나누어 기록한다. 배포는 수행하지 않는다.

## 변경 파일

이번 작업의 파일 목록이다. 기존 privacy/콘텐츠 변경은 제외했다.

```text
AGENTS.md
apps/web/design-system.playwright.config.ts
apps/web/e2e/blog-p2.e2e-spec.ts
apps/web/e2e/fixtures/control-gallery.tsx
apps/web/e2e/guitar-editorial.e2e-spec.ts
apps/web/e2e/locale.e2e-spec.ts
apps/web/e2e/tailwind-ui.e2e-spec.ts
apps/web/package.json
apps/web/postcss.config.mjs
apps/web/src/app/[locale]/records/record-view.tsx
apps/web/src/app/globals.css
apps/web/src/app/guitar/guitar.module.css
apps/web/src/app/guitar/layout.tsx
apps/web/src/components/code-block.module.css
apps/web/src/components/code-block.tsx
apps/web/src/components/comment-list.tsx
apps/web/src/components/font-toggle.tsx
apps/web/src/components/locale-switcher.tsx
apps/web/src/components/mobile-header-shell.tsx
apps/web/src/components/motion-toggle.tsx (삭제)
apps/web/src/components/segmented-control.tsx
apps/web/src/components/site-document.tsx
apps/web/src/components/site-header.tsx
apps/web/src/components/site-nav-links.tsx
apps/web/src/components/theme-background.tsx
apps/web/src/components/theme-toggle.tsx
apps/web/src/components/ui-link.tsx
apps/web/src/components/ui.spec.ts
apps/web/src/components/ui.tsx
apps/web/src/design-system/control-variants.ts
apps/web/src/design-system/primitives.css
apps/web/src/design-system/tailwind.css
apps/web/src/design-system/tokens.css
apps/web/src/design-system/tokens.spec.ts
apps/web/src/features/guitar/components/song-reader.tsx
apps/web/src/features/guitar/components/song-search.tsx
apps/web/src/features/guitar/components/theme-preference.tsx
apps/web/src/lib/cn.ts
apps/web/tools/guitar-editor/main.tsx
design/evidence/tailwind-ui/browser/article-1440-dark.png
design/evidence/tailwind-ui/browser/blog-390-light.png
design/evidence/tailwind-ui/browser/blog-768-light.png
design/evidence/tailwind-ui/browser/controls-1440-dark.png
design/evidence/tailwind-ui/browser/controls-390-light.png
design/evidence/tailwind-ui/browser/record-768-light.png
design/evidence/tailwind-ui/browser/settings-390-dark.png
design/evidence/tailwind-ui/browser/settings-390-light.png
design/evidence/tailwind-ui/browser/song-1440-dark.png
design/evidence/tailwind-ui/browser/songs-390-light.png
design/evidence/tailwind-ui/pen/EvZPZ.png
design/evidence/tailwind-ui/pen/y7sA97.png
design/hodako.lib.pen
docs/design-system/README.md
docs/design-system/audit.md
docs/design-system/components.md
docs/design-system/components/action-button.md
docs/design-system/production-review.md
docs/design-system/tailwind-ui-integration.md
docs/design-system/workflow.md
pnpm-lock.yaml
```
