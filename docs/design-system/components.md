# Component Registry

운영 UI의 기준은 `tokens.css`와 공통 컴포넌트 코드다. `design/hodako.lib.pen`은 검토 자료다. 이 문서는 디자인 node ↔ 구현 경로/상태/책임을 연결한다. 색상·치수의 값은 코드에서 확인하고, 문서에서 별도 값을 정하지 않는다.

| Component / pen node | 구현 | 상태 / 사용처 |
| --- | --- | --- |
| PostCard `VQ8Ia` | `apps/web/src/components/post-card.tsx`, globals.css post-card-* | Default/Hover/Focus. Blog List. icon 유무는 데이터, 모바일 icon 숨김은 runtime 규칙 |
| ActionButton Neutral Solid `d1lHVe` | `components/ui.tsx` Button/ActionButton, `design-system/control-variants.ts` CVA | primary. 댓글 등록/관리자 주요 액션. native type/ref/form/aria 지원 |
| ActionButton Neutral Weak `u4dfxn` | 같은 CVA, secondary | secondary. 취소·보조 액션 |
| ActionButton Brand Solid `W1ypWL` | Pen 과거 준비 시안만 보존 | 운영 `brand` variant 없음. 실제 소비자 없는 강조 스타일을 배치하지 않음 |
| WheelPicker Column `oUTQh` | `components/wheel-picker.tsx`, `.wheel-picker*` | Enabled/Disabled/선택/비선택. 순서 있는 값 선택용 준비 컴포넌트. 현재 제품 배치 없음 |
| Input `P6lfV` | `components/ui.tsx` Input, primitives.css `.field__input` | Default/Focus/Disabled. CommentForm/QuizGate/관리자/Guitar |
| Tag `rbOZU` | `components/ui.tsx` Tag, `.pill` | PostCard/Article. 읽기용 label, interactive badge 아님 |
| TextLink `Lf5Pn` | `components/ui.tsx` TextLink / `components/ui-link.tsx` UiLink, primitives.css `.text-link` | Default/Hover/Focus. 탐색/댓글 actions |
| ActionButton Compact `A5i6wJ` / Quiet `eKufu` | `components/ui.tsx` Button, CVA | secondary/ghost + sm. Guitar 설정·검색 초기화·커버 프리셋 |
| Input Outline Compact `zas8N` | 같은 Input, `.field--outline.field--compact` | Guitar 커버 이름/URL. 기존 field origin을 참조 |
| Textarea `zDBwx` | `components/ui.tsx` Textarea | 댓글 작성/수정, 관리자 퀴즈/문제. native resize/min-height |
| Select Filled `wwCgl` / Outline Compact `sqztr` | `components/ui.tsx` Select | 관리자 카테고리/Guitar 카포·가사·속도. 실제 native select |
| EmptyState Plain `FLAIU` / Panel `Qu9OY` | `components/ui.tsx` EmptyState | Guitar/Records empty, 댓글/Admin panel. 기존 geometry 재사용 |
| Desktop Header `M9C1W` | `site-header.tsx`, `site-nav-links.tsx`, locale/font/theme controls | 활성 경로·설정. 효과 정지/재생 제어 제거. 배경은 기기 reduced-motion 외 항상 재생 |
| Mobile Header `O6WQ3` | `mobile-header-shell.tsx`와 SiteHeader | 닫힌 wordmark/menu. 열림·Escape·포커스 복원은 코드 사양 |
| Footer `QLjAQ` | `site-footer.tsx`, Blog/Guitar layout | 공통 저자/글/GitHub; Guitar postsHref/label. Records 제외 |
| Article Header `wNfKB` | Blog slug page의 article-header | 제목 길이별 font clamp는 코드. 원장의 대표 예시는 medium 제목 |
| Article Body `QPR6q` | `lib/markdown.tsx` MarkdownArticle | 실제 Markdown과 읽기 폭. 페이지 시안은 대표 발췌 |
| CodeBlock `N1tZX` | `code-block.tsx`, `code-block.module.css` | 캔버스 정적 코드 예시. 실제 Shiki syntax 색상, 복사 및 language는 구현 사양 |
| Guitar Header `l89K6m` | `app/guitar/layout.tsx`, `theme-preference.tsx`, guitar.module.css | 기존 wordmark·악보 링크·공통 current theme trigger. 자동/눈/별 선택 |
| Guitar Search `AI7qw` / SongRow `yySqV` | `features/guitar/components/song-search.tsx` | 검색 하나와 전체 행 링크. 44rem 목록 폭, 검색 결과·초기화는 runtime |
| Guitar SongSheet `koSj9` | `features/guitar/components/song-reader.tsx` | 원문 행·코드 시작 문자·공백 보존. 52rem 상한, 긴 행 내부 스크롤 및 14–28px 사용자 설정은 기술 사양 |
| Guitar Settings rail `jhOA4` | 같은 SongReader | 조옮김/카포/가사 표기/폰트/속도/개인 커버 프리셋. Desktop sticky left, mobile inline collapse. 기존 toolbar origin ID 보존, native modal/bottom-fixed bar 제거 |
| Guitar Chord inspector `BVZyH` | 같은 SongReader / voicings.ts | hover/focus/tap. Desktop sticky right, mobile small non-modal inspector. 실제 SVG와 검증된 frets는 코드 책임 |
| Manual AdSlot `GrQ3A` | `components/ads/ad-slot.tsx`, ad-slot.module.css | 허용된 설정+동의 뒤 표시. 44rem, 작은 locale label, 외부 creative 최소 250px 예약. 기본 OFF/미동의는 DOM 없음. 원장 `LpYsZ`는 승인 후 geometry 설명이며 실제 광고 미리보기가 아님 |

테마 제어는 glyph/caret 없이 현재 선택 배경과 텍스트만 표시한다. Guitar의 native select/키보드 선택은 유지하고 목록 행·Songs 복귀 링크의 장식 화살표만 제거했다. 원장 `J4X2a`의 눈/별 문구는 text renderer의 string-variable literal 표시를 피하려 대표 light 문구로 materialize했다. 실제 테마·locale별 문구는 코드가 결정한다. 390/1440px Light/Dark에서 Blog/Guitar 전환과 overflow를 확인했다.

Guitar 테마 선택기의 글자 쏠림과 로고 대비 세로 위치를 보정했다. 헤더는 원장과 같은 center 정렬, select는 공통 trigger padding과 `text-align`/`text-align-last: center`를 사용한다. 최소 폭도 같은 control-size를 참조하며 모든 viewport에서 공통 sm 44px을 사용한다. 로컬 브라우저에서 중앙 위치 일치, 390px 가로 overflow 없음, 자동/눈/별 선택 유지 확인. 새로운 dropdown 또는 theme 저장 정책을 만들지 않는다.

Guitar reading workspace는 `O4NtM1`/`qYzsl` Light/Dark 보드에 기록한다. 기존 header/sheet/settings origin을 재사용했다. 왼쪽/오른쪽 rail은 공통 space-8의 세 배 폭이며, CSS breakpoint와 sticky/overflow/개인 저장은 런타임 사양이다. 카테고리는 기존 태그의 실제 값을 유지하며 Radix 기반 SegmentedControl로 선택한다. 화살표/Home/End 키, 단일 선택과 선택 해제를 방지하는 계약을 제공한다.

## 구성 방식

- Component마다 **Purpose → Anatomy → Variants → States → Usage → Implementation → Validation**을 유지한다. [ActionButton](components/action-button.md), [WheelPicker](components/wheel-picker.md)를 첫 상세 문서로 삼는다.
- `blog.pen`의 `1:` namespace는 자동 Import alias다. 해당 namespace의 refs와 variables는 원장 소유이며 페이지에서 공통 값을 다시 정의하지 않는다.
- 기존 제품 컴포넌트와 새 준비 컴포넌트를 구분한다. Brand Button/Wheel Picker는 사용자 요청에 따라 준비했으며 페이지가 필요해질 때 연결한다.
- 디자인용 상태는 인스턴스 override다. 별도 React variant로 Hover/Focus/Disabled를 만들지 않는다. DOM의 native state/props를 사용한다.
- IconButton/ToggleButton도 같은 Button과 CVA를 조합한다. 같은 렌더링을 Button과 ActionButton 두 구현으로 만들지 않는다. ActionButton은 기존 Button의 export alias이며 호출자 호환성을 유지한다.
- 새 컴포넌트는 실제 목적과 기술 경계가 정해지면 공통 코드 + 이 매핑 + 검증을 함께 추가하고 Pen 검토 자료를 필요한 범위에서 갱신한다. 프리셋을 대량으로 만들지 않는다.

Pen 검토 보드는 Light `EvZPZ` / Dark `y7sA97`이며 Dark는 같은 Light 보드의 연결된 reference다. Outline `yDsir` / Destructive `Teapy`는 기존 Button origin의 variant ref다. 운영 사양은 아래 코드 API다.

## 현재 인터랙티브 API

- 배경 효과 정지/재생 버튼과 `site-motion` 저장값 복원은 제거했다. 눈·별·유성은 항상 재생하며 OS reduced-motion과 숨겨진 탭의 canvas 일시정지는 유지한다. Pen의 기존 헤더 참고 시안과 이 제어 유무가 다르며 운영 코드를 기준으로 한다.
  - 검증: web typecheck와 배경 관련 Playwright 6개 통과(390/1440px, Light/Dark, 기존 정지 저장값·새로고침·언어 전환·저장소 차단·기기 reduced-motion). 실제 미리보기에서 버튼 제거 확인. 전체 build는 이 후속 수정에서 재실행하지 않았다.
- Language trigger는 현재 언어 텍스트만 표시하며 장식 화살표를 사용하지 않는다. 메뉴 ARIA와 키보드 제어는 유지한다. Guitar 헤더의 ‘악보’는 Button 외형을 적용하지 않는 텍스트 탐색 링크다.
  - 후속 검증: web typecheck, 헤더/Guitar Playwright 1개(언어 텍스트·방향키·Escape·악보 링크 시맨틱), `git diff --check` 통과. 이 소규모 수정에서는 전체 build를 다시 실행하지 않았다.
- `Button` / `ActionButton`: primary/secondary/outline/ghost/destructive × sm/md/lg/icon.
- `IconButton`: 필수 aria-label + icon 크기. 기타 음정/글자 크기, Records 재생/닫기.
- `ToggleButton`: controlled `pressed` + native onClick/ref. Font/Theme/자동 스크롤.
- `SegmentedControl`: `components/segmented-control.tsx`, Radix single ToggleGroup, Guitar 카테고리.
- `UiLink`: Next typed href 유지. button appearance는 같은 CVA. 본문/푸터는 text appearance.
- 새 코드에서 `quiet`/`brand`와 `compact`/`default` button size를 쓰지 않는다. field density `compact`는 유지한다.

## Public API / styles

| Design component | Code component | Token dependencies | Migrated usage |
| --- | --- | --- | --- |
| `d1lHVe` / `u4dfxn` / `A5i6wJ` / `eKufu` / `yDsir` / `Teapy` | `components/ui.tsx` Button | button-radius/height/padding/background/text/weight, control-size/padding, color-accent | 댓글/퀴즈/admin/Guitar 설정·검색 |
| `P6lfV` / `zas8N` | 같은 파일 Input | field-background/border/radius/padding, control-size/padding | 댓글/admin/Guitar 검색·커버 입력 |
| `zDBwx` | 같은 파일 Textarea | field-* | 댓글·admin |
| `wwCgl` / `sqztr` | 같은 파일 Select | field-* / control-* | admin 매핑/Guitar 설정 |
| `rbOZU` | 같은 파일 Tag | tag-text/size, font-ui | Blog List/Article/Quiz/admin locale |
| `Lf5Pn` | 같은 파일 TextLink / `components/ui-link.tsx` UiLink | color-text/muted/accent, text-caption, font-ui; button appearance는 Button 토큰 | Footer/댓글/본문 fallback/admin 이동/커버 출처 |
| `FLAIU` / `Qu9OY` | 같은 파일 EmptyState | color-text-muted, space-5, border-width, color-border, radius-md, color-surface-panel | Records/Guitar empty, 댓글/admin panel |

`@/components/ui`는 React 19 native props/ref를 지원하는 Button(ActionButton alias), IconButton, ToggleButton, Input, Textarea, Select, Tag, TextLink, EmptyState와 buttonClassName/types를 export한다. `@/components/ui-link`는 Next typed route를 보존하는 UiLink다. 버튼 구현 스타일은 `control-variants.ts` + `tailwind.css`, 나머지 primitives는 `primitives.css`, 값은 `tokens.css`에 둔다. 현재 API와 domain 예외는 [Tailwind 통합 기록](tailwind-ui-integration.md)을 따른다.

공통 Origin의 색상/radius/padding은 variant의 의미가 다른 경우에만 override한다. 예제 frame의 label/대표 폭 override는 가능하지만 공통 geometry를 가리는 임의 instance style을 만들지 않는다. Header/Locale/Theme/CodeBlock/Records의 일반 액션은 같은 Button 스타일을 사용한다. Art/Chord/Quiz 같은 콘텐츠 조작은 전용 구조를 유지한다.
