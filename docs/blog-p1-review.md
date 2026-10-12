# 블로그 P1 구현과 검증

## 범위

2026-10-11 기준. `/ko`와 `/en`은 해당 언어의 Blog List로 이동한다. 별도 Home, Hero, 소개는 추가하지 않는다. 화면에 보이는 “전체 글”도 추가하지 않는다. P0 서체·읽기 폭·제목 변형·배경을 유지한다.

| 후보 | 사전 상태 | 조치 |
| --- | --- | --- |
| 활성 탐색/포커스 표시 | DONE | 기존 컴포넌트 유지 |
| 모바일 브랜드·닫힘·터치 영역 | PARTIAL | wordmark 상시 노출, Escape 포커스 복원, 링크/경로 변경 시 닫힘, 모바일 제어 44px |
| 언어 메뉴 키보드 | DONE | 기존 화살표/Home/End 유지. Escape가 상위 헤더까지 닫지 않도록 보완 |
| Article 편집 구조 | DONE | Title→Description→Metadata→Tags, 본문/댓글 구획, overflow 처리 유지 |
| Locale 문구와 HTML 언어 | PARTIAL | 한국어 탐색/설정 번역, Locale root layout에서 서버 HTML 언어 지정. JavaScript 없이도 ko/en 일치 |
| Article 번역 slug | PARTIAL | 공개 번역의 실제 slug 사용. 미지원 번역의 기존 안내 유지 |
| Footer | TODO | Blog 경로에만 저자명·글 목록·기존 GitHub 계정 링크 추가 |
| Guitar/Inspirations/P2/Design Lab | OUT OF SCOPE | 별도 작업 보존 |

## Locale 범위와 제한

공통 HTML 문서를 `components/site-document.tsx`로 추출하고 `[locale]/layout.tsx`를 locale별 root layout으로 사용한다. 서버가 루트 `<html lang="ko">` 또는 `<html lang="en">`을 생성하므로 JavaScript 없이도 언어가 일치한다. Guitar와 Design Lab은 같은 공통 문서를 별도 root layout에서 재사용한다. 요청 headers/cookies를 읽지 않아 Blog와 Guitar의 정적 렌더링을 유지한다. Guitar의 화면·기능·호스트 라우팅은 변경하지 않는다. 기존 클라이언트 LocaleSwitcher의 lang 동기화는 유지한다.

현재 공개 영어 Article은 없다. 영어 목록과 미지원 Article 안내를 검증하며, 번역 콘텐츠를 새로 만들지 않는다.

## 검증 환경

기존 서버와 `.next`는 보존하고 `/tmp/blog-p1-review.9Z89Pc` 복사본에서 `.next-p1-review` 산출물과 3122 포트를 사용한다. 최종 명령은 Node 24.18.0과 pnpm 10.17.1을 사용한다.

- `pnpm --filter web typecheck`
- `pnpm --filter web test`
- `NEXT_DIST_DIR=.next-p1-review pnpm --filter web build`
- `git diff --check`

Locale 수정은 `/tmp/blog-locale-review.SvKbjA`의 `.next-locale-review`와 3123 포트에서 추가 검증했다. `PLAYWRIGHT_BASE_URL=http://localhost:3123 pnpm --filter web exec playwright test -c locale.playwright.config.ts`로 JavaScript 없는 서버 HTML/리디렉션/Article 테스트 3개가 통과했다. 독립 lint 스크립트는 없다. 테스트 11개 파일/40개 테스트가 통과했다. 중간 스냅샷에서는 별도 Design Lab CSS의 autoprefixer 경고가 있었지만 최종 스냅샷 빌드에는 해당 경고가 없었다.

브라우저 검증: 320/390/768/1440px, light/dark, `/ko/blog`, `/en/blog`, 실제 한국어 Article. CSS 200, 가로 넘침 없음, 제목/요약 겹침 없음, 이미지 본문 폭 유지, 코드 내부 스크롤, Footer와 댓글 구획을 확인한다. 메뉴 Enter/Escape, 언어 메뉴 ArrowDown/Escape, 동일 경로 링크 선택 시 닫힘, ko→en 전환, 활성 링크와 포커스 표시를 검증한다. Records와 Guitar는 공통 스타일/호스트 라우팅 회귀 관점에서만 확인한다.

## 작업 분리

이번 P1의 파일은 헤더 관련 컴포넌트, LocaleSwitcher, SiteShell, site dictionary, locale root layout과 공통 SiteDocument, Article 번역 경로 데이터, MarkdownArticle/CodeBlock의 복사 문구 번역, Blog layout/Footer, 해당 CSS다. 기존 P0의 숨김 h1/목록 줄바꿈과 기존 Guitar/Design Lab 변경이 같은 working tree에 있으므로 전체 파일을 일괄 stage하지 않는다. 특히 globals.css와 root layout은 여러 작업의 diff가 겹친다.

새 dependency, commit, push는 추가하지 않는다. 전체 접근성/모션 시스템과 Inspirations 리디자인은 별도 승인 범위다.


## Pretendard 회귀 보완 (2026-10-11)

3000 포트 개발 화면에서 `data-font="pretendard"`와 UI 선택은 유지되지만 computed `--font-body`가 기본 글꼴로 돌아가는 CSS 순서 경합을 확인했다. 기존 `[data-font]`와 기본 `:root`의 specificity가 같아 뒤에 로드된 토큰이 선택을 덮어썼다. `:root[data-font="pretendard"]`로 선택 규칙의 우선순위를 높였다.

기존 HEAD와 현재 코드 모두 Pretendard의 font-family 이름만 선언하고 실제 font-face/파일 로딩은 없었다. 공식 v1.3.9 `PretendardVariable.woff2`와 SIL OFL 라이선스를 로컬에 추가했다. 기본 글꼴과 기존 font-family 토큰은 유지한다. 새 font-face는 기존 선택 옵션에서만 사용하며 기본 페이지에 preload하지 않는다. 약 2.06MB 파일의 subset 최적화는 별도 성능 평가 후보다.

검증 복사본 `/tmp/blog-font-review.0PZmjI`, 산출물 `.next-font-review`, production preview 3125 포트. Node 24.18.0에서 typecheck/build, 현재 스냅샷 unit 10개 파일/37개 테스트, Locale/폰트 E2E 4개가 통과했다. 이전 40개 테스트 기록은 당시 스냅샷이며 별도 작업이 혼재한 현재 테스트 수와 혼동하지 않는다. Pretendard 선택 상태의 320/390/768/1440px × light/dark × 한국어 Article/영어 목록 16개 화면 검사에서 overflow/제목 겹침이 없었다. CDP `CSS.getPlatformFontsForNode`는 실제 본문 글꼴을 `Pretendard Variable`, `PretendardVariable-Regular`, `isCustomFont=true`로 확인했다. 폰트 로딩, 늦게 도착한 기본 토큰 CSS, 새로고침, ko→en 전환, 기본 글꼴 복귀를 E2E로 검증했다.

기존 3000 포트는 별도로 HTTP 500과 `.next/server/vendor-chunks/react-fast-compare@3.2.2.js` 누락을 반환했다. 이 서버에 대한 테스트 3개 실패는 정상 production preview의 4개 통과와 구분한다. 누락 파일은 확인했지만 어떤 프로세스가 산출물을 바꿨는지는 확정하지 않는다. 기존 서버/캐시를 삭제하거나 종료하지 않았다. 현재 working tree의 별도 P2/디자인 작업은 이번 P1 폰트 수정의 완료 기록으로 포함하지 않는다.

공식 출처: https://github.com/orioncactus/pretendard/tree/v1.3.9
SHA-256: `9599f12fd42fc0bce1cd50b47a0c022e108d7aa64dd0d1bb0ed44f3282d900b4`
