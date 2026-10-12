# 블로그 P2 마감 검증

## 범위와 사전 조사 (2026-10-11)

작업 전 `docs/git-rules.md`, 디자인 시스템 README/audit, P1 검증, local-rendering, 현재 코드와 Git 상태를 확인했다. 기존 P0/P1/Guitar/디자인 도구의 미커밋 변경을 기준선으로 보존한다. 기준선 소스와 diff는 `/tmp/blog-p2-baseline`, `/tmp/blog-p2-review/before.patch`에 보관한다. Commit/push는 하지 않는다.

| 사전 조사 | 분류 | 근거/결정 |
| --- | --- | --- |
| 저장소 규칙·working tree | DONE | staged 없음, 여러 기존 tracked/untracked 변경. 전체 파일 교체/되돌리기 금지 |
| P0/P1 구조 | DONE | locale redirect, Blog List, 기존 서체/wordmark, 44rem 읽기 폭, Footer/모바일 메뉴 유지 |
| CSS·tokens | PARTIAL | 기존 spacing/radius/UI 160ms 유지. 입력 경계와 코드 상태 대비 검증 필요 |
| Theme | DONE | bootstrap/localStorage/system 정책 유지. 실제 전환·새로고침 검증 예정 |
| Starry/Shooting Stars | DONE | 별 15+13개, transform drift 22/30s, 유성 6개 17–23s. reduced에서 기존 정적 표현 유지 |
| Snowy | PARTIAL | 80개 canvas 입자, reduced에서도 rAF 계속 실행. 기존 라이브러리 pause API로 정적 유지 필요 |
| UI motion/scroll | PARTIAL | 기존 160ms 전환 유지. reduced smooth scroll/chevron/quiz hover 보완 |
| 반응형 | PARTIAL | 기존 45/60rem 및 프로젝트 46rem 유지. 320/390/768/1440 실제 검증 필요 |
| Code / Shiki | PARTIAL | github-dark 고정. fallback은 light foreground와 dark surface 불일치 가능. 복사 오류/상태 안내 없음 |
| Accessibility | PARTIAL | 기존 focus/menu Escape·locale 화살표·form labels 유지. 본문 건너뛰기, 퀴즈 radio 화살표, 입력 대비 검증 |
| Inspirations/Guitar 독립 디자인·기능 | OUT OF SCOPE | 공유 CSS/theme/layout 회귀만 검증 |

## 검증 방법

기존 Playwright/Chromium과 production build를 사용한다. `web-perf` 스킬의 Chrome DevTools MCP는 제공되지 않아 전용 trace 절차를 사용하지 않는다. 신규 의존성을 설치하지 않는다. 자동 브라우저 검사, computed style 대비, 키보드 조작, screenshots, Canvas 호출/프레임 측정 결과를 기록한다. WCAG 전체 준수 인증이나 실기기 성능 수치로 확대 해석하지 않는다.

기준: [WCAG 비텍스트 대비](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [ARIA radio 키보드 패턴](https://www.w3.org/WAI/ARIA/apg/patterns/radio/), [Shiki dual themes](https://shiki.style/guide/dual-themes).

## 구현 결과

- 별 28개와 유성 6개의 기존 밀도·분포·17–23초 주기·속도는 유지했다. 일반 UI 160ms 전환도 유지했다. normal motion의 유성은 Dark/Starry에서 계속 움직이며 Light/Snowy에서 별/유성을 숨기는 기존 테마 정책도 유지한다.
- Snowy는 동일한 `react-snowfall`의 공개 `SnowfallCanvas` API를 사용한다. 기본 80개, 기존 모바일 breakpoint 45rem 이하 32개. 프레임별 React 상태 갱신은 없다. ResizeObserver/미디어 쿼리/visibilitychange 때만 크기·설정을 변경하며, 숨긴 탭·reduced motion에서는 loop를 pause하고 unmount에서 정리한다.
- 라이브러리가 입자를 화면 위에서 시작하므로 초기 reduced 상태에는 정적 산포를 한 번 그린다. 새 `--snow-static-radius: 1.5px`는 기존 라이브러리 0.5–3px 반경 범위 안의 정적 눈 전용 값이다. 위치는 일정한 간격과 결정적 수평 분산으로 배치한다. 입자 엔진이나 라이브러리를 추가하지 않았다.
- reduced에서는 smooth scroll, 언어 선택 chevron transition, quiz hover 이동도 중단한다. 기존 Records 전용 reduced-motion 처리는 유지한다. 색·포커스 구분은 계속 제공한다.
- Shiki의 기존 client 렌더링 경로에서 `github-light-default` / `github-dark-default`를 한 번 생성하고 CSS로 전환한다. 테마를 바꿀 때 다시 하이라이팅하지 않는다. unsupported language와 JS 없는 fallback에도 읽을 수 있는 surface/text를 사용한다.
- 복사 버튼은 기존 caption/spacing/radius/motion 토큰과 44px 높이를 사용한다. 성공·실패를 status로 안내하며 clipboard 거부를 처리한다. 코드 scroll region과 표에 키보드 포커스를 제공한다. 긴 줄은 내부에서 가로 스크롤되고 페이지 폭은 늘어나지 않는다.
- 본문 건너뛰기 링크, 댓글 quiz radio의 roving Tab/화살표 순환 선택, 댓글 등록 결과 live status를 보완했다. 입력 경계는 기존 `--field-border` alias를 사용하고 인증 완료 상태의 본문은 기존 foreground를 사용한다.
- 저장소 접근을 거부하면 기존 FontToggle의 localStorage 읽기/쓰기가 예외를 내어 전체 client UI를 중단하던 문제를 좁게 수정했다. 기본 서체와 저장 정책을 바꾸지 않고 해당 세션에서 설정이 동작하도록 한다. P2 테마·키보드 검증을 차단한 기존 문제이므로 포함했다.

## 기존 구현 유지

`/ko → /ko/blog`, `/en → /en/blog`, 숨김 h1과 flat Blog List, font family/wordmark, Article 제목·요약·metadata·tag 순서, 44rem 읽기 폭, 기존 반응형 제목 규칙, Locale 경로와 번역 미지원 안내, Footer, 모바일 메뉴 Escape/경로 변경 닫힘, 언어 메뉴의 화살표/Home/End 및 focus 복원, ThemeProvider/bootstrap/system/localStorage 정책을 보존한다. 공개 영어 글이 없어 `/en/blog`에는 카드가 없는 현재 상태를 검사했다. 새 Home/Hero나 콘텐츠를 추가하지 않았다.

## 실제 검증 결과

Chromium production rendering에서 320/390/768/1440px × Light/Dark의 Blog List·긴 실제 Article을 검사했다. 추가 1024px와 영어 목록, 임시 실제 Markdown fixture의 긴 표·긴 코드·미지원 언어·blockquote도 검사했다. 40개 route/viewport/theme 조합의 페이지 가로 넘침은 모두 0px였다. 이미지의 폭은 본문 안에 유지된다. 실제 Article의 GitHub 이미지와 YouTube embed 렌더링을 스크린샷으로 확인했다.

메뉴 320px에서 wordmark/열기/언어/서체/테마의 충돌과 focus 가림이 없다. 키보드 Escape 중첩 닫힘과 복원, 언어 전환, 테마 새로고침 유지, skip link → main, 코드·표 ArrowRight 스크롤, copy 실패 status를 검사했다. 댓글 challenge/verify/등록 오류는 **로컬 브라우저에서 응답을 가로채는 fixture**로 검사했다. 실제 댓글을 게시하지 않았으며 운영 backend 권한/저장은 이번 검증 결과가 아니다. 두 테마 모두 quiz 화살표 순환/Tab/Enter, label로 연결된 author/password/content, 등록 실패 status가 동작했다.

### 대비

브라우저 computed style의 실제 Shiki token·입력·댓글·표·본문 색을 사용했다. 투명 배경은 상위 배경과 합성해 계산했다. 별도 fixed sky gradient의 모든 픽셀을 인증한 것은 아니며, 실제 화면도 병행 확인했다.

| 측정 대상 | 수정 전 | 최종 |
| --- | --- | --- |
| 실제 Article syntax 최소 대비 | 3.046:1 (github-dark 주석) | Light 4.547:1 / Dark 6.153:1 |
| 입력 경계와 바깥 surface | Light 1.358:1 / Dark 1.623:1 | Light 10.223:1 / Dark 3.580:1 |
| 본문/메타/태그/inline code/표/댓글/코드 측정 텍스트 | 부분 검사 | Light 최소 4.547:1 / Dark 최소 6.153:1 (syntax 포함) |

최종 `focus.cjs`에서 Navigation/Theme/Font/Locale/Input/Copy/Code region/Footer 8종을 양쪽 테마에서 직접 focus하여 측정했다. 포커스 최소 대비는 Light 9.234:1 / Dark 4.457:1, 해당 컨트롤 텍스트는 Light 최소 6.330:1 / Dark 최소 9.955:1이었다. 결과는 `/tmp/blog-p2-review/focus.json`에 있다.

현재 공개 Article에 표/figcaption이 없어 표는 실제 Markdown fixture로 검증했고, caption은 기존 CSS와 색상 토큰만 확인했다.

Dark 입력 경계와 내부 fill의 비율은 2.360:1이지만 컨트롤을 구분하는 바깥 surface에 대해서는 3.580:1이다. focus outline은 기존 accent를 유지한다. AA 기준으로 해당 텍스트·경계 검사와 keyboard 동작을 확인했으며, WCAG 2.2 전체 준수 인증을 주장하지 않는다. axe/Lighthouse, 스크린리더, 실기기 검사는 수행하지 않았다.

### Motion/Performance

동일 Chromium canvas 계측에서 normal 모바일의 입자 draw 수는 프레임당 80 → 32(60% 감소), desktop은 80을 유지했다. reduced의 1초 안정 구간은 변경 전 약 60 clear/4,800 arc, 변경 후 0 clear/0 arc였다. 초기 reduced canvas의 nontransparent pixel과 프레임 간 동일 이미지도 검사했다. 설정 해제 시 다시 움직이며 Dark에서 meteor-fall이 활성화되는 것을 검사했다. 정적 배경을 삭제하지 않았다.

CSS 별·유성은 transform/opacity만 애니메이션하며 새로운 will-change/GPU 강제나 JS animation loop를 추가하지 않는다. 기존 Snowfall renderer는 layout 크기를 읽지만 프레임마다 DOM layout을 쓰지 않는다. 이 결과는 draw 호출 수 감소이며 FPS·배터리·Core Web Vitals 개선 수치로 해석하지 않는다. Chrome DevTools MCP가 없어 해당 스킬의 trace는 미실행이다.

### 회귀

기존 Blog/Records/Guitar Chromium 11개 회귀가 통과했다. Records 목록/상세와 Admin login은 320/1440px 양쪽 테마에서 overflow 없이 확인했다. Guitar의 호스트 라우팅, 정적 노래, chord dialog/포커스 복원, 자동 스크롤, 테마/저장 동작은 기존 회귀를 실행했을 뿐 기능/디자인을 수정하지 않았다.

작업 중 별도 세션에서 공통 palette/버튼·입력 토큰, Pretendard 파일과 locale 서체 검사, wheel picker 등이 변경되었다. 그 변경을 덮어쓰지 않고 최종 현재 토큰을 반영한 복사본으로 검사했다. 표의 최종 공통색 대비는 그 동시 변경도 반영한다. 새 palette·버튼 variant·wheel picker·Pretendard 설치는 P2 구현 내역이 아니다.

## P2 변경 파일과 이유

| 파일 | P2 변경만 |
| --- | --- |
| `src/components/theme-background.tsx` | 기존 renderer 수명주기, reduced/static/visibility, 모바일 밀도 |
| `src/design-system/tokens.css` | 정적 눈 반경 토큰. 입력 alias는 동시 작업의 기존 정의와 통합하여 중복 제거 |
| `src/app/globals.css` | canvas 크기, skip link, reduced scroll/quiz/chevron, 표 focus, 입력 border alias, 인증 text |
| `src/components/site-shell.tsx` | skip link와 main focus target |
| `src/components/code-block.tsx` | Shiki dual theme, clipboard status/error, 키보드 scroll region |
| `src/components/code-block.module.css` | 기존 토큰으로 header/control/fallback, 테마 CSS, 내부 스크롤/focus |
| `src/lib/markdown.tsx` | 표 accessible name/keyboard focus |
| `src/components/quiz-gate.tsx` | radio 화살표/단일 Tab 진입 |
| `src/components/comment-form.tsx` | 댓글 결과 live status |
| `src/components/font-toggle.tsx` | storage 거부로 UI가 중단되는 문제 처리 |
| `e2e/blog-p2.e2e-spec.ts` | viewport/theme/keyboard/motion/clipboard/storage 회귀 |
| `p2.playwright.config.ts` | 독립 P2 테스트 실행·산출물 경로 |
| `playwright.config.ts` | 기존 Guitar suite에서 P2 spec 제외 |
| `docs/blog-p2-review.md` | 사전 분류, 범위, 측정·검증·제한 기록 |

파일 경로는 docs 외 `apps/web/` 기준이다. 여러 파일에 이미 P0/P1과 별도 변경이 있었으므로 전체 Git diff를 P2 diff로 간주하면 안 된다.

## 검증 재현과 산출물

- 기준선: `/tmp/blog-p2-baseline`, 수정본: `/tmp/blog-p2-final`, 결과: `/tmp/blog-p2-review`.
- `before.patch`/`before-status.txt`: 작업 시작 시 기존 변경. `before-measure.json`/`after-measure.json`: 실제 수치.
- `audit.cjs`/`audit.json`: 40개 반응형 조합, 댓글 fixture, computed contrast, Records/Admin 검사. `measure.cjs`: canvas 호출 계측. `finish.cjs`: 복사 성공, 이미지와 최종 스크린샷.
- `final-*-article-top.png`, `final-*-code.png`, `final-*-image.png`, `final-*-menu.png`, `final-*-reduced.png`, `final-*-list.png`: 실제 렌더링 검토.
- 임시 fixture는 복사본에서만 생성했고 최종 build 전 `/tmp/blog-p2-review/fixture-source`로 이동했다. 제품 route/콘텐츠에는 추가하지 않았다. 초기 fixture의 임의 이미지 경로는 404였으며 제품 이미지 검사는 실제 Article의 정상 GitHub 이미지를 별도로 사용했다.
- 테스트 두 실행이 동일 결과 폴더를 정리하면서 trace 저장 충돌이 한 번 발생했다. P2 설정의 outputDir를 분리하고 단독 재실행으로 해결했다. 제품 동작 실패는 아니었다.


## 최종 테스트 명령

Node 24.18.0, pnpm 10.17.1. 로컬 셸의 다른 Node가 섞이지 않게 `PATH=/Users/daniel/.volta/tools/image/node/24.18.0/bin:$PATH`를 명시했다.

| 검사 | 결과 |
| --- | --- |
| `pnpm --filter web typecheck` | 통과 |
| `pnpm --filter web test` | 초기 10개 파일/37개 통과. 최신 동시 작업 반영 후 11개 파일/42개 중 41개 통과, Guitar catalog 날짜 검사 1개 실패 (아래 참조) |
| `/tmp/blog-p2-final`에서 `pnpm --filter web build` | 최종 production 65개 페이지 통과. fixture와 mock Worker URL 제외 |
| `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3135 pnpm --filter web exec playwright test -c p2.playwright.config.ts` | 12개 통과 (최종 65-page build, 저장소 차단 회귀 포함) |
| 기존 `playwright.config.ts --project chromium` | Guitar/Blog/Records 11개 통과 |
| 기존 `locale.playwright.config.ts` | JS 없는 locale/redirect/Article 및 동시 작업의 font preference 포함 4개 통과 |
| `git diff --check` | 통과 |

독립 lint 스크립트/ESLint 설정은 없다. 기존 lint-staged는 웹 typecheck를 사용하며 최종 Next build의 lint/type 단계와 typecheck를 실행했다. 웹 변경만 하므로 Worker/Pulumi 테스트는 추가 실행하지 않았다.

최종 `finish.cjs`도 통과했다. 양쪽 테마의 실제 Article 이미지 naturalWidth=1024, 표시 폭=342px(390 viewport), 코드 clipboard 복사 성공, system preference의 OS 추종/수동 선택 이후 유지, 저장소 거부 시 theme toggle 동작을 확인했다. 최종 P2 소스 10개 파일을 빌드 복사본과 byte 비교하여 모두 일치함을 확인했다.

## 남은 범위와 제한

P2에서 확인된 제품 문제는 수정했다. 최종 점검 중 별도 Guitar 작업에서 새 곡이 추가되어 `src/features/guitar/server/catalog.spec.ts:9`의 `songs[0].added === "2026-10-09"` 기대가 실제 `"2026-10-11"`과 달라졌다. 이 실패는 P2 CSS/theme 변경 경로를 사용하지 않는 catalog 데이터/기대값 문제이며 P2 변경 전 보관한 Guitar 소스·콘텐츠의 37개 테스트와 회귀 11개는 통과했다. Guitar 작업 범위 밖이므로 테스트나 곡을 수정하지 않았다. 최신 전체 suite는 41 passed / 1 failed이고, 동시 추가된 token contrast 5개는 통과했다. 또 새 곡의 N.C. chord 경고가 나오며 이 역시 별도 Guitar 범위다.

마지막 공유 token 변경(`--post-padding-y: 2rem`, light `--button-neutral-hover`)을 보존하고 검증 복사본에 동기화하여 production build와 P2 브라우저 검사를 다시 수행했다. 이 두 토큰 변경은 P2가 작성한 변경이 아니다.

 실제 모바일 하드웨어·Safari/VoiceOver, axe/Lighthouse와 전체 WCAG 인증, 운영 댓글 서비스에 대한 end-to-end 등록은 미실행이다. 브라우저 결과는 Chromium이며 댓글은 명시한 fixture 경계에서 검증했다. Inspirations/Guitar 독립 리디자인·기능 개발, 새 콘텐츠와 전체 전역 디자인 시스템 개편은 별도 범위다.

## Git 상태

Staged 파일은 없다. P2의 tracked 변경은 CSS/코드 블록/댓글/퀴즈/SiteShell/ThemeBackground/FontToggle/Markdown에 있으며, 일부는 기존 P0/P1 변경과 같은 파일에 공존한다. P2 신규 파일은 e2e spec, p2.playwright.config.ts, 본 문서다. tokens.css와 playwright.config.ts는 이미 untracked였던 파일에 P2 변경을 더했다. 아래 나머지 Guitar/infra/디자인 파일·서체·wheel picker 등은 시작 전 또는 동시 별도 작업으로 보존했다.

```text
 M .github/workflows/quality.yml
 M .gitignore
 M .lintstagedrc.cjs
 M AGENTS.md
 M apps/web/next.config.mjs
 M apps/web/package.json
 M apps/web/src/app/[locale]/blog/[slug]/page.tsx
 M apps/web/src/app/[locale]/blog/page.tsx
 M apps/web/src/app/[locale]/layout.tsx
 M apps/web/src/app/globals.css
 D apps/web/src/app/layout.tsx
 M apps/web/src/components/code-block.module.css
 M apps/web/src/components/code-block.tsx
 M apps/web/src/components/comment-form.tsx
 M apps/web/src/components/font-toggle.tsx
 M apps/web/src/components/locale-switcher.tsx
 M apps/web/src/components/mobile-header-shell.tsx
 M apps/web/src/components/post-card.tsx
 M apps/web/src/components/post-view-count.tsx
 M apps/web/src/components/quiz-gate.tsx
 M apps/web/src/components/site-header.tsx
 M apps/web/src/components/site-shell.tsx
 M apps/web/src/components/theme-background.tsx
 M apps/web/src/components/theme-context.tsx
 M apps/web/src/components/theme-toggle.tsx
 M apps/web/src/lib/markdown.tsx
 M apps/web/src/lib/site.ts
 M apps/web/src/middleware.ts
 M apps/web/vitest.config.mts
 M docs/hodako-guitar-implementation-plan.md
 M package.json
 M pnpm-lock.yaml
?? .junie/
?? .playwright-mcp/
?? .sisyphus/
?? apps/web/e2e/
?? apps/web/locale.playwright.config.ts
?? apps/web/p2.playwright.config.ts
?? apps/web/playwright.config.ts
?? apps/web/src/app/[locale]/blog/layout.tsx
?? apps/web/src/app/fonts/pretendard/
?? apps/web/src/app/guitar/
?? apps/web/src/components/site-document.tsx
?? apps/web/src/components/site-footer.tsx
?? apps/web/src/components/ui.tsx
?? apps/web/src/components/wheel-picker.tsx
?? apps/web/src/design-system/
?? apps/web/src/features/
?? apps/web/src/lib/guitar-links.ts
?? apps/web/src/lib/guitar-routing.spec.ts
?? apps/web/src/lib/guitar-routing.ts
?? apps/web/tools/
?? content/guitar/
?? design/
?? designs/
?? docs/blog-p1-review.md
?? docs/blog-p2-review.md
?? docs/blog-redesign-audit.md
?? docs/design-system/
?? docs/guitar.md
?? docs/local-rendering.md
?? supabase/
```

No commit was created and nothing was pushed.


최종 완료 감사: 최신 공유 토큰을 포함한 production build(65 pages)에서 독립 서버 4319를 사용한 P2 12개 테스트가 모두 통과했다(11.8s). 10개 P2 소스 파일의 현재 내용과 빌드 복사본이 일치한다. `git diff --check` 통과, staged 없음. P2 구현·검증은 완료했으며 별도 Guitar catalog 테스트 실패는 위 제한/후속 항목으로 남긴다. 작업용 서버는 종료했다.

## 현재 전체 작업 트리 build 재검증

사용자의 후속 요청에 따라 2026-10-11 현재 worktree 전체를 새 임시 복사본 `/tmp/blog-p2-current-build`에 다시 복사해 실행했다. Node 24.18.0 / pnpm 10.17.1, `pnpm --filter web build`: production compile, lint/type check, static page generation 및 tracing까지 exit code 0으로 완료, **66개 페이지**를 생성했다. 기존 `/Users/daniel/WebstormProjects/blog/.next`는 건드리지 않았다. 이번 전체 build에는 동시 Guitar 곡과 motion-toggle 경로도 포함된다.

Build 중 `vaundy/shiawase.chopro`의 `N.C.` 표기 미지원 경고가 반복 출력됐지만 빌드는 성공했다. 앞서 전체 unit test에서 발견한 첫 곡 날짜 기대값 실패와 같은 별도 Guitar 자료 검증 항목이며 P2 build 실패가 아니다.
