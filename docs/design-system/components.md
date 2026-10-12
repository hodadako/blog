# Component Registry

시각적 원장은 `design/hodako.lib.pen`. 이 문서는 디자인 node ↔ 구현 경로/상태/책임을 연결한다. 색상·치수의 값은 원장에서 확인하고, 문서에서 별도 값을 정하지 않는다.

| Component / pen node | 구현 | 상태 / 사용처 |
| --- | --- | --- |
| PostCard `VQ8Ia` | `apps/web/src/components/post-card.tsx`, globals.css post-card-* | Default/Hover/Focus. Blog List. icon 유무는 데이터, 모바일 icon 숨김은 runtime 규칙 |
| ActionButton Neutral Solid `d1lHVe` | `components/ui.tsx` Button/ActionButton, `.button` | primary. 댓글 등록/관리자 주요 액션 |
| ActionButton Neutral Weak `u4dfxn` | 같은 구현, `.button--secondary` | secondary. 취소·보조 액션 |
| ActionButton Brand Solid `W1ypWL` | 같은 구현, `.button--brand` | brand. 후속 페이지의 명확한 핵심 액션. 현재 Blog에 억지로 추가하지 않음 |
| WheelPicker Column `oUTQh` | `components/wheel-picker.tsx`, `.wheel-picker*` | Enabled/Disabled/선택/비선택. 순서 있는 값 선택용 준비 컴포넌트. 현재 제품 배치 없음 |
| Input `P6lfV` | `components/ui.tsx` Input, `.field__input` | Default/Focus. CommentForm/관리자 |
| Tag `rbOZU` | `components/ui.tsx` Tag, `.pill` | PostCard/Article. 읽기용 label, interactive badge 아님 |
| TextLink `Lf5Pn` | `.text-link`, Next Link/native anchor 호출자 | Default/Hover/Focus. 탐색/댓글 actions |
| Desktop Header `M9C1W` | `site-header.tsx`, `site-nav-links.tsx`, locale/font/theme/motion controls | 활성 경로·설정. 디자인의 glyph는 정적 상태 예시. 최근 P2 MotionToggle의 기본 표시도 반영 |
| Mobile Header `O6WQ3` | `mobile-header-shell.tsx`와 SiteHeader | 닫힌 wordmark/menu. 열림·Escape·포커스 복원은 코드 사양 |
| Footer `QLjAQ` | `site-footer.tsx`, Blog layout | Blog 경로에서만 저자/글/GitHub |
| Article Header `wNfKB` | Blog slug page의 article-header | 제목 길이별 font clamp는 코드. 원장의 대표 예시는 medium 제목 |
| Article Body `QPR6q` | `lib/markdown.tsx` MarkdownArticle | 실제 Markdown과 읽기 폭. 페이지 시안은 대표 발췌 |
| CodeBlock `N1tZX` | `code-block.tsx`, `code-block.module.css` | 캔버스 정적 코드 예시. 실제 Shiki syntax 색상, 복사 및 language는 구현 사양 |
| Guitar Header `l89K6m` | `app/guitar/layout.tsx`, `theme-preference.tsx`, guitar.module.css | 기존 wordmark와 공통 ThemeProvider. Guitar의 간결한 섹션 표시·System/Light/Dark 선택 |
| Guitar Search `AI7qw` / SongRow `yySqV` | `features/guitar/components/song-search.tsx` | 검색 하나와 전체 행 링크. 44rem 목록 폭, 검색 결과·초기화는 runtime |
| Guitar SongSheet `koSj9` | `features/guitar/components/song-reader.tsx` | 원문 행·코드 시작 문자·공백 보존. 52rem 상한, 긴 행 내부 스크롤 및 14–28px 사용자 설정은 기술 사양 |
| Guitar PlaybackToolbar `jhOA4` | 같은 SongReader | 조옮김·스크롤·옵션. 모바일 safe-area와 고정 툴바, 키보드/포커스/팝업은 실제 브라우저 검증 |

## 구성 방식

- Component마다 **Purpose → Anatomy → Variants → States → Usage → Implementation → Validation**을 유지한다. [ActionButton](components/action-button.md), [WheelPicker](components/wheel-picker.md)를 첫 상세 문서로 삼는다.
- `blog.pen`의 `1:` namespace는 자동 Import alias다. 해당 namespace의 refs와 variables는 원장 소유이며 페이지에서 공통 값을 다시 정의하지 않는다.
- 기존 제품 컴포넌트와 새 준비 컴포넌트를 구분한다. Brand Button/Wheel Picker는 사용자 요청에 따라 준비했으며 페이지가 필요해질 때 연결한다.
- 디자인용 상태는 인스턴스 override다. 별도 React variant로 Hover/Focus/Disabled를 만들지 않는다. DOM의 native state/props를 사용한다.
- 같은 렌더링을 Button과 ActionButton 두 구현으로 만들지 않는다. ActionButton은 기존 Button의 export alias이며 호출자 호환성을 유지한다.
- 새 컴포넌트는 실제 목적과 기술 경계가 정해지면 원장 component + 이 매핑 + 최소 구현 + 검증을 함께 추가한다. 프리셋을 대량으로 만들지 않는다.
