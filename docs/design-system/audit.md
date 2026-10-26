# 디자인 시스템 감사

현재 감사와 결정은 [Storybook 마이그레이션](storybook-migration.md)을 따른다. 운영 UI는 코드/토큰이 SSOT이며 Storybook이 문서·검증 도구다. 아래 CSS/Lab 및 Pen-first 감사는 이전 작업의 역사 기록이다. Pen 갱신은 필수 작업이 아니다.

2026-10-11 현재 워크트리 기준. 9월 감사는 제안 문서이며 현재 구현과 다르다. 미커밋 P0/Guitar 변경을 기준선으로 조사했다. 이번 단계는 코드 감사이며 화면 검증 결과는 README에 별도로 기록한다.

## 유지할 기준선

`[locale]/page.tsx`는 blog로 redirect한다. Blog List는 sr-only h1, 구분선 기반 PostCard, 모바일 이미지 규칙을 이미 사용한다. `globals.css`의 단색 semantic 색상, 4–64px spacing, 4/8/12px radius, 72rem container와 44rem reading width를 재사용한다. 서체는 Blog Korean Title과 기존 Pretendard 선택이다. SiteShell의 Starry/Snowy와 여섯 Shooting Stars, wordmark, theme bootstrap을 보존한다. 과거 감사의 홈 생성/서체 교체/유성 제거 제안은 이번 요구사항에 적용하지 않는다.

## Foundations

| 영역 | 현재 구현 | 판정 및 영향 |
| --- | --- | --- |
| Color/theme | globals.css :root dark + data-theme light, 상태색/표면/하늘 역할 토큰 | 유지. 기존 palette를 재사용. 하늘 gradient/glow는 정체성으로 유지 |
| Typography | 기존 font variables, 제목 600/-0.025em, 본문 1rem/1.65, metadata .8125rem, code 별도 CSS | 개선 P1: 이름 있는 typography 토큰. 코드 테마는 추가 검토 |
| Spacing/layout | space-1~8, container/measure/panel 폭 | 유지. Page/reading/component 밀도를 획일화하지 않음 |
| Radius/border/shadow | sm/md/lg/pill, 1px border, overlay만 shadow | 유지. 일반 PostCard는 flat divider이며 과도한 card 문제로 다시 분류하지 않음 |
| Motion | 160ms UI, 배경 keyframes, Records 전용 움직임, reduced-motion | 유지. UI duration만 토큰화; 배경과 Record 연출 별도 관리 |
| Breakpoint | 45rem 모바일, 60rem tablet, project 46rem 및 Guitar 별도 | 추가 검토 P2. CSS 변수는 media query에 적용되지 않으므로 억지 토큰화하지 않음 |

## 발견한 문제와 결정

| 문제/현재 구현 | 관련 파일·컴포넌트 | 이유 | 개선 방향 | 영향 범위 | 우선순위/분류 |
| --- | --- | --- | --- | --- | --- |
| 전역 파일에 설정과 약 2,800줄 규칙이 혼재 | app/globals.css | 수정 대상과 페이지 영향 파악이 어려움 | 선언을 tokens.css로 옮겨 실제 제품과 Lab에서 동일하게 사용 | Blog/Records/Admin/Guitar에서 참조하는 토큰 | P1 개선 |
| 제목/본문/메타 size·weight·line-height와 UI 160ms 반복 | globals.css, code-block.module.css | 역할 이름 없이 숫자가 반복되어 변경이 분산됨 | 기존 값을 유지하는 역할 토큰과 필요한 component alias만 연결 | 공유 제목/본문, 버튼/필드/태그/PostCard | P1 개선 |
| 버튼과 입력 markup 반복 | comment-form, quiz-gate, admin-* | 현재 CSS class는 공유하지만 props/variant 계약이 없음 | 댓글 폼에서 최소 Button/Input 추출; 나머지 호출자는 후속 점진 전환 | 댓글 작성, 기존 class 소비자 | P1 개선 |
| 독립 preview/수정/source diff 도구 없음 | package.json, components | 작업 결과를 제품 코드로 검토·저장할 경로가 없음; Storybook 없음 | Next 개발 전용 Lab + iframe 실제 viewport + allowlist CSS 저장 | 개발 도구만 | P1 개선 |
| CodeBlock은 두 테마 모두 dark code surface와 hardcoded RGBA | code-block.tsx/module.css | 의도인지 대비 문제인지 별도 화면 평가 필요 | syntax theme/복사 상태를 후속 감사 | Blog article | P2 추가 검토 |
| 오래된 home hero CSS 남음 | globals.css home-* | 홈 route는 redirect여서 공개 홈에서 사용하지 않음 | 참조 조사 후 후속 정리 | legacy class consumers | P3 제거 검토 |
| Record tile의 shadow/gradient/회전은 독립적인 음반 상호작용 | records/collection.tsx, globals.css record-* | 임의 장식으로 단정할 근거 없음 | 독립 리디자인에서 검토 | Inspirations/Records | 별도 유지 |

## 컴포넌트·페이지 관계

- SiteHeader → SiteNavLinks/MobileHeaderShell/LocaleSwitcher/FontToggle/ThemeToggle: locale 공개 페이지. SiteFooter/SiteShell/ThemeBackground도 공유.
- PostCard: Blog List. ProjectLinkCard: projects, PostCard class 일부 공유 (component 토큰 변경 영향 포함).
- button/secondary, field input/textarea/select, status-pill, surface-card: 댓글/QuizGate와 admin 화면. Tag pill은 PostCard/Article.
- Article: 제목/요약/Markdown detail-content/CodeBlock/PostCommentsPanel/CommentList/CommentForm. Markdown 서버 파이프라인을 유지하며 Lab 본문은 같은 renderer를 사용한다.
- Records: tile/detail/dialog/탭/음반 인터랙션, 일반 카드와 구별되는 독립 패턴. Guitar: features/guitar 및 별도 route/styles; 공통 CSS 토큰의 영향을 점검한다.

일반 PostCard의 목적 없는 그림자·부상 hover·badge 남용은 현재 코드에서 발견되지 않았다. 카드/아이콘/gradient를 일괄 제거하지 않는다. 전체 컴포넌트를 한 번에 추상화하거나 사이트를 리디자인하지 않는다.

## pen.dev SSOT 전환 감사 (2026-10-11, 현재 P0/P1 코드)

최신 기준은 `docs/blog-p1-review.md`와 `[locale]/layout.tsx`/`SiteDocument`다. 루트 HTML 언어·모바일 wordmark·탐색·Footer는 완료된 P1을 보존한다. 기존 `designs/current-blog*.pen`은 Home 및 오래된 서체/색상 시안이 포함되어 있어 현재 제품의 기준이 아니다. MCP 조회상 재사용 컴포넌트도 없었다. 기존 파일은 역사 자료로 보존하고 새 원장과 연결하지 않는다.

| 분류 | 근거와 현재 구현 | 조치·영향 |
| --- | --- | --- |
| Preserve | PostCard의 flat divider, 제목/요약/메타/태그, 모바일 icon 숨김 (`globals.css` blog-index-page/PostCard/mobile 규칙) | 구조·P0 간격과 반응형 동작 유지. 최초 browser import는 첫 행 특수 padding-top=16px, 일반 padding-bottom=24px을 관찰 |
| Improve | `src/design-system/tokens.css`가 디자인 값의 원본이었음 | `design/hodako.lib.pen`으로 시각 원장을 이전. CSS는 구현 결과. 기존 숫자·서체를 복원하고 새 팔레트만 명시적으로 반영 |
| Remove | `features/design-lab`, `app/%5F%5Fdesign-lab`, `api/design-lab`, 전용 테스트/설정 | 자체 비주얼 편집기와 파일 저장 API 제거. pen.dev를 편집기로 사용 |
| Improve | 기존 색상은 Ink #172234/light, #f3f6fc/dark 등. 확정 5색과 불일치 | 새 Primitive→Semantic→Component 연결. Light 링크 Blue, Dark 링크 밝은 Cyan 파생색. 기존 상태색은 별도 지원 primitive로 보존 |
| Preserve | `SiteShell` 배경 레이어/유성6개, `ThemeBackground` 눈 | 기존 배경 연출과 keyframes 유지. core palette와 기존 sky 색상의 관계는 원장에서 역할을 구분. 배경의 RGBA/gradient 조합은 CSS 구현 사양으로 유지 |
| Investigate | CodeBlock의 dark syntax theme/하드코딩 copy control 색상 | 기존 의도를 유지하며 별도 후속 대비 검토. 이번 palette 연결만으로 syntax 전체를 리디자인하지 않음 |
| Investigate | media query 45/60rem, clamp 제목·icon 폭, flex wrap | 캔버스의 Desktop/Mobile 대표 사양과 runtime 계산은 구분. 정적 pen frame이 런타임 반응형을 대체하지 않음 |

실제 import된 PostCard는 원래 font-family와 이미지 asset을 사용한다. Browser import의 고정 좌표는 reusable 구조에서 flow layout으로 정리한다. 이것은 디자인 파일의 편집 가능성을 위한 변환이며 제품 DOM/Props 변경이 아니다. 레코드/기타 효과는 독립적이며 이번 작업에서 삭제하거나 획일화하지 않는다.
