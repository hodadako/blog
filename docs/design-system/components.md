# Component Registry

시각적 원장은 `design/hodako.lib.pen`. 이 문서는 디자인 node ↔ 구현 경로/상태/책임을 연결한다. 색상·치수의 값은 원장에서 확인하고, 문서에서 별도 값을 정하지 않는다.

| Component / pen node | 구현 | 상태 / 사용처 |
| --- | --- | --- |
| PostCard `VQ8Ia` | `apps/web/src/components/post-card.tsx`, globals.css post-card-* | Default/Hover/Focus. Blog List. icon 유무는 데이터, 모바일 icon 숨김은 runtime 규칙 |
| ActionButton Neutral Solid `d1lHVe` | `components/ui.tsx` Button/ActionButton, `design-system/primitives.css` `.button` | primary. 댓글 등록/관리자 주요 액션. native type/ref/form/aria 지원 |
| ActionButton Neutral Weak `u4dfxn` | 같은 구현과 primitives.css, `.button--secondary` | secondary. 취소·보조 액션 |
| ActionButton Brand Solid `W1ypWL` | 같은 구현, `.button--brand` | brand. 후속 페이지의 명확한 핵심 액션. 현재 Blog에 억지로 추가하지 않음 |
| WheelPicker Column `oUTQh` | `components/wheel-picker.tsx`, `.wheel-picker*` | Enabled/Disabled/선택/비선택. 순서 있는 값 선택용 준비 컴포넌트. 현재 제품 배치 없음 |
| Input `P6lfV` | `components/ui.tsx` Input, primitives.css `.field__input` | Default/Focus/Disabled. CommentForm/QuizGate/관리자/Guitar |
| Tag `rbOZU` | `components/ui.tsx` Tag, `.pill` | PostCard/Article. 읽기용 label, interactive badge 아님 |
| TextLink `Lf5Pn` | `components/ui.tsx` TextLink / `components/ui-link.tsx` UiLink, primitives.css `.text-link` | Default/Hover/Focus. 탐색/댓글 actions |
| ActionButton Compact `A5i6wJ` / Quiet `eKufu` | `components/ui.tsx` Button, primitives.css | secondary/quiet + compact. Guitar 설정·검색 초기화·커버 프리셋 |
| Input Outline Compact `zas8N` | 같은 Input, `.field--outline.field--compact` | Guitar 커버 이름/URL. 기존 field origin을 참조 |
| Textarea `zDBwx` | `components/ui.tsx` Textarea | 댓글 작성/수정, 관리자 퀴즈/문제. native resize/min-height |
| Select Filled `wwCgl` / Outline Compact `sqztr` | `components/ui.tsx` Select | 관리자 카테고리/Guitar 카포·가사·속도. 실제 native select |
| EmptyState Plain `FLAIU` / Panel `Qu9OY` | `components/ui.tsx` EmptyState | Guitar/Records empty, 댓글/Admin panel. 기존 geometry 재사용 |
| Desktop Header `M9C1W` | `site-header.tsx`, `site-nav-links.tsx`, locale/font/theme/motion controls | 활성 경로·설정. 디자인의 glyph는 정적 상태 예시. 최근 P2 MotionToggle의 기본 표시도 반영 |
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

Guitar reading workspace는 `O4NtM1`/`qYzsl` Light/Dark 보드에 기록한다. 기존 header/sheet/settings origin을 재사용했다. 왼쪽/오른쪽 rail은 공통 space-8의 세 배 폭이며, CSS breakpoint와 sticky/overflow/개인 저장은 런타임 사양이다. 카테고리는 기존 태그의 실제 값이며 탭 같은 조용한 텍스트 필터를 사용한다. 새 팔레트/폰트/버튼 라이브러리를 추가하지 않았다.

## 구성 방식

- Component마다 **Purpose → Anatomy → Variants → States → Usage → Implementation → Validation**을 유지한다. [ActionButton](components/action-button.md), [WheelPicker](components/wheel-picker.md)를 첫 상세 문서로 삼는다.
- `blog.pen`의 `1:` namespace는 자동 Import alias다. 해당 namespace의 refs와 variables는 원장 소유이며 페이지에서 공통 값을 다시 정의하지 않는다.
- 기존 제품 컴포넌트와 새 준비 컴포넌트를 구분한다. Brand Button/Wheel Picker는 사용자 요청에 따라 준비했으며 페이지가 필요해질 때 연결한다.
- 디자인용 상태는 인스턴스 override다. 별도 React variant로 Hover/Focus/Disabled를 만들지 않는다. DOM의 native state/props를 사용한다.
- 같은 렌더링을 Button과 ActionButton 두 구현으로 만들지 않는다. ActionButton은 기존 Button의 export alias이며 호출자 호환성을 유지한다.
- 새 컴포넌트는 실제 목적과 기술 경계가 정해지면 원장 component + 이 매핑 + 최소 구현 + 검증을 함께 추가한다. 프리셋을 대량으로 만들지 않는다.

## Public API / styles

| Design component | Code component | Token dependencies | Migrated usage |
| --- | --- | --- | --- |
| `d1lHVe` / `u4dfxn` / `W1ypWL` / `A5i6wJ` / `eKufu` | `components/ui.tsx` Button | button-radius/height/padding/background/text/weight, control-size/padding, color-accent | 댓글/퀴즈/admin/Guitar 설정·검색 |
| `P6lfV` / `zas8N` | 같은 파일 Input | field-background/border/radius/padding, control-size/padding | 댓글/admin/Guitar 검색·커버 입력 |
| `zDBwx` | 같은 파일 Textarea | field-* | 댓글·admin |
| `wwCgl` / `sqztr` | 같은 파일 Select | field-* / control-* | admin 매핑/Guitar 설정 |
| `rbOZU` | 같은 파일 Tag | tag-text/size, font-ui | Blog List/Article/Quiz/admin locale |
| `Lf5Pn` | 같은 파일 TextLink / `components/ui-link.tsx` UiLink | color-text/muted/accent, text-caption, font-ui; button appearance는 Button 토큰 | Footer/댓글/본문 fallback/admin 이동/커버 출처 |
| `FLAIU` / `Qu9OY` | 같은 파일 EmptyState | color-text-muted, space-5, border-width, color-border, radius-md, color-surface-panel | Records/Guitar empty, 댓글/admin panel |

`@/components/ui`는 React 19 native props/ref를 지원하는 Button(ActionButton alias), Input, Textarea, Select, Tag, TextLink, EmptyState와 buttonClassName/types를 export한다. `@/components/ui-link`는 Next typed route를 보존하는 UiLink다. 구현 스타일은 `src/design-system/primitives.css`, 값은 `tokens.css`에만 둔다. API 예시·추출하지 않은 domain UI와 이유는 [production review](production-review.md)를 따른다.

공통 Origin의 색상/radius/padding은 variant의 의미가 다른 경우에만 override한다. 예제 frame의 label/대표 폭 override는 가능하지만 공통 geometry를 가리는 임의 instance style을 만들지 않는다. 기존 Header/Locale/Theme/Motion/CodeBlock/Records UI는 이미 재사용되는 domain/pattern이며 불필요하게 generic Button으로 갈아끼우지 않는다.
