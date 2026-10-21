# Shared components — production consolidation

이 문서는 Tailwind 전환 이전의 공통화 이력이다. 현재 API/토큰/검증은 [Tailwind 통합 기록](tailwind-ui-integration.md)을 따른다.

## 기준과 범위

기준 HEAD `4d31116`, branch `main`. 시작 시 tracked 변경은 없었고 `.playwright-mcp/`, `supabase/`는 기존 untracked였다. 이전 감사의 단계별 추출 계획을 실제 제품에 적용한다. 기존 문서의 Lab/P3 제안은 역사 기록이며 실행 계획이 아니다.

Next 15 App Router / React 19 / strict TypeScript / pnpm workspaces. CSS variables와 전역 CSS, Guitar 및 CodeBlock CSS modules를 재사용한다. 새 UI dependency, Storybook, preview 제품 route, 토큰 빌드 프레임워크를 추가하지 않는다. Blog list/Article과 Records는 locale layout, Guitar는 같은 앱의 host rewrite와 별도 layout을 사용한다. 기본 폰트·44rem·redirect·숨김 h1·기존 배경과 동작을 유지한다.

작업 중 별도 세션에서 조회수 제거와 privacy 페이지/링크 추가를 진행했다. 해당 변경을 이 작업으로 보고하지 않으며 되돌리거나 staging하지 않는다. 겹치는 Article/Footer는 추가 편집을 멈추고 검증 스냅샷을 구분한다.

## Inventory / 추출 결정

| Layer | 실제 구현 / 사용처 | 결정과 이유 |
| --- | --- | --- |
| Foundations | `src/design-system/tokens.css`, `design/hodako.lib.pen` Variables | 기존 Primitive → Semantic → Component alias 유지. 공통 control-size/control-padding만 기존 spacing에서 연결 |
| Primitive: Button | `components/ui.tsx`, 댓글/QuizGate/admin/Guitar settings | 기존 세 variant 유지. 실제 Guitar 조작에 compact와 quiet 추가. 모든 같은 `.button` 직접 사용처 전환 |
| Primitive: Input/Textarea/Select | `components/ui.tsx`, 댓글/QuizGate/admin/Guitar | 같은 field 토큰. native type/size/required/name/ref/handler 보존. Guitar는 outline/compact, 검색은 같은 Input에 전용 search 레이아웃 |
| Primitive: Tag | 같은 파일, PostCard/Article/QuizGate/admin locale | 같은 읽기 label. native span props 지원. status-pill의 상태색 의미는 별도 유지 |
| Primitive: TextLink | 같은 파일, 댓글 actions/Footer/Guitar preset source | anchor 유지. 이동을 action button으로 바꾸지 않음 |
| Pattern: UiLink | `components/ui-link.tsx`, Footer/Article fallback/admin 이동 | Next Link + shared text/button appearance. Route generic과 ref/Next props 보존. Vite primitives에서 Next를 import하지 않음 |
| Pattern: EmptyState | `components/ui.tsx`, Records empty/Guitar search/comments/admin empty | 기존 plain message와 panel만 지원. 새 Card 생성 없음 |
| Pattern: Header/Nav/Footer | `site-header`, `site-nav-links`, `mobile-header-shell`, `site-footer` | 이미 공통 구현. Footer에 link primitive 적용. locale/menu/focus logic과 Records의 Footer 제외 유지 |
| Domain: BlogPostItem/ArticleMetadata | `post-card.tsx`, Blog slug page | 목록 전체 anchor/제목 variants/메타데이터 구조 유지. 공통 Tag와 댓글 UI 조합. SongRow와 무리하게 합치지 않음 |
| Domain: Record / Tabs / Filters / Zoom | `app/[locale]/records/*` | route transition, 회전/기울기, tablist roving focus, dialog restoration 유지. Guitar의 category button은 pressed filter이므로 Records tab/link와 같은 컴포넌트로 합치지 않음 |
| Domain: SongRow / SongReader / ChordControl | `features/guitar/components/*` | 공통 fields/actions만 교체. chord hover/focus/tap, source anchors, scroll, lyrics, cover presets는 그대로 유지 |
| Domain: Theme/Font/Motion/Locale / Code copy | 기존 named components | 이미 재사용됨. 전용 current/expanded/copy states가 있어 generic Button appearance를 덧씌우지 않음 |
| Not extracted | Checkbox/Pagination/Tooltip/Icon wrapper/Surface/Card/metadata mega component | 동일 의미의 반복 사용 근거가 없거나 기존 domain 패턴이 충분함. 미사용 부품을 생성하지 않음 |
| Existing prepared | Brand Button / WheelPicker | 이전 승인된 준비 컴포넌트 보존. 이번 작업에서 사용처를 만들기 위해 제품 기능을 추가하지 않음 |

## 코드 API

### 구현 / 검증 매핑

코드 위치는 `apps/web/src/` 기준이다. 모든 아래 항목은 실제 소비자를 포함한다.

| Component | Pen location | Code location | Migrated usage | Implementation | Validation |
| --- | --- | --- | --- | --- | --- |
| Button / ActionButton | `d1lHVe`, `u4dfxn`, `W1ypWL`, `A5i6wJ`, `eKufu` | `components/ui.tsx` | 댓글/QuizGate/admin/Guitar actions | 완료, alias 단일 구현 | native props/ref unit, 두 테마 keyboard/44px/preset, cross-site token 전파 |
| Input | `P6lfV`, `zas8N` | 같은 파일 | 댓글/admin/Guitar search/presets | 완료 | native constraints/ref unit, 실제 검색/커버 입력 |
| Textarea | `zDBwx` | 같은 파일 | 댓글 작성/수정, admin quiz/bank | 완료 | SSR name/value/rows, typecheck/build |
| Select | `wwCgl`, `sqztr` | 같은 파일 | admin mapping, Guitar capo/lyrics/speed | 완료 | native default/disabled unit, 실제 capo 선택/설정 유지 |
| Tag | `rbOZU` | 같은 파일 | PostCard/Article/Quiz/admin locale | 완료 | native span/aria unit, Blog 화면 |
| TextLink / UiLink | `Lf5Pn`, button origins | `components/ui.tsx`, `components/ui-link.tsx` | Footer/comments/admin/fallback/cover | 완료 | anchor semantics unit, typed href/build, 실제 페이지 이동 |
| EmptyState | `FLAIU`, `Qu9OY` | `components/ui.tsx` | Records/Guitar/comments/admin | 완료 | status semantics unit, 실제 검색 empty |
| Header / Navigation / Footer | `M9C1W`, `O6WQ3`, `QLjAQ`, `l89K6m` | 기존 named components/layout | 기존 header/nav 유지, Footer 링크 공통화 | 완료 | P2/Locale/Guitar 회귀 및 36개 화면 |

기본 스타일은 `src/design-system/primitives.css` 한 곳에 있고, SiteDocument가 tokens → primitives → globals 순서로 로드한다. `globals.css`에는 page/domain 규칙을 남긴다. Guitar의 중복 button/field/disabled/hover 규칙은 제거하고 placement/grid만 module에 남긴다. 로컬 Vite preview도 같은 CSS를 읽으며 편집기 자체 button 스타일은 `.button`에 적용하지 않는다.

```tsx
import {Button, Input, Select, Tag, Textarea, TextLink, EmptyState} from "@/components/ui";
import {UiLink} from "@/components/ui-link";

<Button variant="secondary" size="compact" onClick={save}>저장</Button>
<Button type="submit" disabled={saving}>등록</Button>
<Input appearance="outline" density="compact" name="cover" required />
<Select name="capo" aria-label="카포"><option value="0">없음</option></Select>
<Textarea name="content" required />
<Tag aria-label="분류">Spring</Tag>
<UiLink href="/ko/blog">글</UiLink>
<TextLink href="https://github.com/hodadako">GitHub</TextLink>
<EmptyState role="status">검색 결과가 없습니다.</EmptyState>
```

- `Button`: `variant=primary|secondary|brand|quiet`, `size=default|compact`, 기본 `type=button`. 제출은 명시적으로 `type=submit`. `ActionButton`은 같은 구현의 alias다.
- `Input`, `Textarea`, `Select`: `appearance=filled|outline`, `density=default|compact`; 생략 시 기존 filled/default. `size`는 native 속성을 그대로 유지한다.
- 모든 primitive는 React 19 `ComponentPropsWithRef`를 사용한다. native ref, form binding, aria/data 속성, 이벤트를 그대로 전달한다. Loading prop은 새로 만들지 않고 기존 disabled/status 문구를 사용한다.
- `UiLink`: 기본 `appearance=text`, 필요할 때 `appearance=button`과 같은 ButtonAppearance. Next typed href/prefetch/scroll/onClick/ref를 유지한다. 일반 anchor에는 TextLink, 라우팅 링크에는 UiLink를 사용한다.
- `EmptyState`: 기본 plain, 기존 댓글/admin 패널에만 `appearance=panel`. 데이터를 불러오는 로직을 포함하지 않는다.

## Pen 원장 / 유지보수

원장은 기존 `design/hodako.lib.pen` 하나다. 기존 origin ID를 보존하고 ref variant로 확장했다. `hEhAz` Light / `uztw8` Dark / `M7mAla` Mobile 보드에서 독립 편집한다. 원장의 Guitar stepper/scroll도 공통 compact Button instance를 사용한다.

`design/blog.pen`은 기존 `1:` import를 유지한다. 새 `design/guitar.pen`은 같은 원장을 `z:`로 import한다. 로컬 복제 토큰/새 library는 없다. Imported theme axis는 `z:mode`, `z:device`를 쓴다. string label override는 실제 locale/theme 예시만 담당하고 공통 radius/fill/padding을 가리지 않는다.

Pen `--leading-article`의 과거 1.72 표기를 실제 P0 CSS 1.78에 맞췄다. 코드의 Article typography는 바꾸지 않았다. 기본 Button은 원장에 이미 있던 height/font-size 토큰을 실제 CSS에 연결했다. Compact는 기존 Guitar의 touch geometry다. 숫자 dimension binding 예외는 [workflow](workflow.md)를 따른다.

### Button 한 번 수정하기

1. 원장 `d1lHVe` 또는 그 variant에서 변경한다. 색상/spacing은 기존 Variable을 우선 사용한다.
2. Codex에 origin ID와 의도를 전달하고 `ui.tsx` + `primitives.css` + token 영향을 비교한다. Label/width 등 instance override만 필요한 것인지 먼저 확인한다.
3. 승인된 값을 대응 CSS alias에 적용한다. 새 Button 구현을 만들지 않는다.
4. 댓글/admin/Guitar settings의 소비자에서 실제 computed style, native states와 화면을 검증한다.
5. 원장을 저장하고 blog.pen/guitar.pen을 재오픈하여 import 갱신을 확인한다. 자동 동기화라고 표시하지 않는다.

### 새 공통 컴포넌트 추가

실제 중복 의미와 소비자를 확인 → 원장 origin/ref/state 정의 → `ui.tsx` API 또는 적합한 기존 모듈 구현 → 같은 변경에서 실제 사용처 전환 → registry/테스트/화면 갱신. 도메인 전용 위젯은 해당 feature에 둔다.

## 검증

상세 실행 명령과 최종 결과는 [workflow](workflow.md)의 이번 consolidation 기록에 남긴다. 변경 전 스크린샷은 HEAD 4d31116의 기존 격리 서버 4336, 첫 변경 후 검증은 `/tmp/hodako-shared-components.kd2ii5me`의 4340이다. 배포 사이트와 동일 버전이라고 가정하지 않는다. 4340 스냅샷에는 별도 privacy 작업의 일부가 포함되어 있으므로 footer 차이를 이번 디자인 변경으로 오인하지 않는다.

최종 앱 검증은 `/tmp/hodako-shared-final._o0b8ly_` / `127.0.0.1:4341`과 `guitar.localhost:4341`이다. 최종 `apps/web/src` 전체 파일을 스냅샷과 hash 비교하여 차이 없음을 확인했다. 별도 세션의 privacy/조회수 제거 커밋 `2d70033`을 보존했다. 최초 구현 완료 보고 시점에는 staging/commit/push/deploy를 실행하지 않았다. 이후 사용자가 디자인 시스템 변경의 커밋과 origin 푸시를 승인했으며, 별도 콘텐츠 변경은 해당 범위에서 제외한다.

검증 종료 무렵 별도 작업의 `content/guitar/songs/a2o-lite/neon.chopro`가 새로 생겼다. 해당 콘텐츠는 편집/삭제하지 않았고 위 빌드·테스트 스냅샷에 포함되지 않는다. 이번 완료 판정은 공통 UI 구현과 기존 공개 콘텐츠의 검증에 대한 것이며, 이 새 곡의 게시/코드 추출 검증까지 완료했다는 의미가 아니다. 기존 Guitar 테스트의 단일 곡 fixture 기대는 새 콘텐츠 작업에서 별도로 갱신해야 한다.

- 단위: 13개 파일 / 56개 테스트 통과. JSX를 실제 SSR로 검증하기 위해 기존 Vite 8 Vitest 설정에 automatic JSX 변환을 명시했다. 신규 dependency 없음.
- Typecheck, Guitar editor typecheck, production build(68 static pages) 통과.
- 신규 design-system E2E: 화면 matrix 6개 테스트(6페이지 × 3폭 × 2테마 = 36개 조합), Light/Dark 설정 2개, Button token 전파 1개, Records keyboard 1개 통과.
- 기존 Blog P2 19개, locale/font 4개, Guitar Chromium/WebKit 42개, local editor 2개 통과.
- Guitar 기존 8개 실패를 변경 전 서버에서도 동일 재현했다. 펼침 뒤 이름이 바뀌는 selector, 0.09375px footer 좌표 오차, mouse click에 keyboard focus를 기대한 테스트였다. 실제 UI 코드를 우회 수정하지 않고 정확한 expanded locator, 1px geometry tolerance, 실제 keyboard 입력으로 보완했다.
- 실제 렌더링 스크린샷을 390/768/1440 Light/Dark에서 검토했다. 제목·본문 폭·navigation·footer·원본 가사 앵커·배경·전체 가로 overflow 회귀 없음. viewport 내 이미지 로딩을 기다리고 캡처한다. 코드 블록 내부 스크롤/모바일 확대 글자 검사는 기존 회귀를 재사용했다.
- 선택한 before/after 8개와 설정 두 테마 이미지는 `design/evidence/shared-components/`에 보존한다. 원장 PNG는 `design/evidence/shared-controls/`다. 외부 YouTube embed의 로딩 시점과 별도 privacy 링크 추가는 pixel 차이 원인으로 구분한다.
- 별도 lint 명령/ESLint 설정은 없다. production build의 검사 단계와 `git diff --check`를 실행했다. lint-staged는 typecheck wrapper이며 staging을 유발하는 검증은 실행하지 않았다.
- 실기기/보조기술 전체 감사, 실제 댓글 저장·관리자 API mutation, 모든 게시물/미디어와 외부 embed, 실광고 송출을 검증했다고 주장하지 않는다. 이 작업은 해당 서버 로직/외부 서비스를 변경하지 않았다.

## 변경 파일

- Primitive/API: `components/ui.tsx`, `components/ui-link.tsx`, `design-system/primitives.css`, `design-system/tokens.css`, `components/site-document.tsx`.
- Blog/Admin routes: `app/[locale]/blog/[slug]/page.tsx`, `app/[locale]/admin/page.tsx`, `app/[locale]/admin/login/page.tsx`.
- 실제 소비자: `comment-form.tsx`, `comment-list.tsx`, `quiz-gate.tsx`, `admin-comment-quizzes.tsx`, `admin-comments-table.tsx`, `admin-invite-tokens.tsx`, `admin-post-quiz-mappings.tsx`, `admin-quiz-bank.tsx`, `site-footer.tsx` (모두 `components/`).
- Records: `app/[locale]/records/collection.tsx`의 empty 메시지만 공통화. 실제 Records art/tabs/transition 파일은 유지.
- Guitar: `features/guitar/components/song-reader.tsx`, `song-search.tsx`, `app/guitar/guitar.module.css`. 도메인 데이터/ChordPro/voicings/lyrics/presets 저장 로직 변경 없음.
- Editor shared styling: `tools/guitar-editor/main.tsx`, `editor.css`. 편집기 기능/저장 API 변경 없음.
- 검증: `components/ui.spec.ts`, `design-system/tokens.spec.ts`, `vitest.config.mts`, `design-system.playwright.config.ts`, `e2e/design-system.e2e-spec.ts`, 기존 `e2e/guitar-editorial.e2e-spec.ts`, `guitar.e2e.spec.ts`.
- 원장/운영: `design/hodako.lib.pen`, `design/guitar.pen`, 두 evidence 디렉터리, `docs/design-system/{README,components,workflow,production-review}.md`, `AGENTS.md`.

## 후속 디자인 문제

| 범주 | 항목 | 우선순위 / 처리 |
| --- | --- | --- |
| Global Token | 새 색상/서체/배경 정책 변경 근거 없음 | 변경 없음 |
| Shared Component | Brand/Wheel 준비 origin은 실제 제품 배치 없음 | 기존 준비 상태; 억지 사용 금지 |
| Domain Component | QuizGate의 hover lift/선택 번호 pill은 독립 상태 UI | 공통 Button 추출과 별도 평가, 일괄 삭제하지 않음 |
| Page Layout | Records art/rotation, Guitar rails, publication rows는 서로 다른 정보 구조 | 기존 고유 표현 유지 |
| Content Hierarchy | 가짜 Hero/Featured/Popular가 필요하다는 근거 없음 | 추가하지 않음 |

모든 접근성/모든 기기 인증을 선언하지 않는다. 측정한 native states, keyboard, theme, viewport, 기존 motion 및 locale 회귀만 보고한다.
