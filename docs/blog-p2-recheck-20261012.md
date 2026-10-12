# P2 현황 재검토와 잔여 작업 완료

2026-10-12. Branch `main`, HEAD `894cdaf2fb5f35c24e1aa88d09115a7d03ea4bbf`와 미커밋 working tree 기준. 기존 `blog-p2-review.md`는 보존하고 이번 재검토 결과를 별도로 기록한다. 배포 사이트나 과거 Pen 시안과 동일 버전이라고 가정하지 않는다.

## Overall Verdict

**COMPLETE — 현재 스냅샷에서 확인된 P2 잔여 결함을 수정하고 관련 회귀를 검증했다.** 전체 WCAG 인증이나 실기기 성능 검증을 뜻하지 않는다. 기존 3000 개발 서버 오류는 격리 검증 결과와 구분한다.

## Initial / Final Matrix

| Area | Initial | Final | 이번 변경 | 근거 |
| --- | --- | --- | --- | --- |
| Motion / Reduced Motion | PARTIAL | DONE | 배경 효과 정지·재생 제어 | 기존 Reduced Motion은 동작하지만 17–23초 반복 효과의 사이트 내 정지 제어가 없었음. 정지·재생·reload·locale·storage 거부·OS 우선 적용 검사 |
| Keyboard / Focus / Contrast | PARTIAL | DONE | skip link 가림과 대상 위치 수정 | 링크 중앙 hit test가 false, 이동 후 제목 top 32px < header bottom 69px였음. 최종 링크가 위에 표시되고 제목 top 101px > 69px |
| Light/Dark Code / States | PARTIAL | DONE | Dark Article 불투명 패널 제거 | 기존 dual-theme Shiki는 유지. Dark article의 전체 `::before` 패널이 P0의 투명한 읽기 영역 요구와 충돌해 해당 규칙만 제거 |
| Responsive | DONE | DONE | 새 리디자인 없음 | 320/390/768/1440 × light/dark 목록·본문 회귀. 제목 겹침/페이지 overflow 없음 |
| Performance | PARTIAL | DONE | 측정 후 불필요한 최적화 생략 | 현재 Canvas 호출·선택형 폰트 요청량 측정. FPS/배터리/CWV 개선을 선언하지 않음 |

초기 코드·기존 검증 기록을 읽고 기존 P2 E2E 12개를 현재 스냅샷에서 먼저 통과시켰다. 이후 실제 화면에서 발견한 surface/가시성 결함도 평가에 포함했다. 기존 테스트의 focus assertion만으로 실제 가시성을 완료 판정하지 않았다.

## Already Done

- 눈의 모바일 32개/데스크톱 80개 설정, Reduced Motion과 숨긴 문서의 pause, 기존 별 28개와 유성 6개의 정상 주기·속도 유지.
- Shiki `github-light-default` / `github-dark-default`, fallback, 복사 성공·실패 status, 코드·표 내부 키보드 스크롤.
- 기존 메뉴 Escape/복원, Locale 키보드, 퀴즈 radio 화살표, 댓글 status, 차단된 storage 처리.
- ko/en redirect와 서버 HTML lang, 기본 서체·Pretendard specificity/로컬 파일, 44rem 읽기 폭, 숨김 h1, Footer.

위 항목은 재작성하지 않았다. QuizGate/CommentForm/CodeBlock/Markdown의 소스는 이전 P2 최종 스냅샷과 동일함도 확인했다. 운영 댓글을 게시하지 않았다.

## Changes

| 파일 (`apps/web/` 기준) | 이유 |
| --- | --- |
| `src/components/motion-toggle.tsx` | 기존 설정 버튼 패턴의 최소 배경 정지·재생 제어. `site-motion` 저장, storage 거부 시 세션 선택 유지. OS Reduced Motion에서는 정지 상태 안내와 disabled 제어 |
| `src/components/site-header.tsx` | 기존 설정 그룹에 정지 제어 연결 |
| `src/components/site-document.tsx` | 저장된 정지 선택을 초기 문서에서 복원. 기존 Locale/Theme/Font bootstrap 보존 |
| `src/components/theme-background.tsx` | 기존 SnowfallCanvas pause와 정적 산포 재사용. `data-motion`만 관찰하는 MutationObserver와 정리 추가 |
| `src/components/skip-link.tsx` | 기존 skip link의 텍스트·href를 유지. 열린 메뉴를 기존 toggle로 닫고 한 번의 rAF 후 main focus/scroll. 수정 키 클릭은 native 동작 유지 |
| `src/components/site-shell.tsx` | 기존 anchor를 SkipLink 구현으로 연결 |
| `src/app/globals.css` | 기존 제어 토큰·44px 높이·focus 재사용. 별/유성은 사용자 정지 때만 play-state pause. Dark Article의 큰 불투명 pseudo surface 제거. header layer 10은 유지하고 skip link만 그 위에 표시. main에 기존 anchor의 6rem scroll margin 재사용 |
| `e2e/blog-p2.e2e-spec.ts` | 정지/재생 6개 검사와 열린 메뉴 skip 검사 1개 추가. 기존 viewport 검사에 실제 hit test·제목 가림·Article 패널 회귀 assertion 추가 |
| 본 문서 | 현재 코드/스냅샷/범위/결과 구분 |

색상·서체·입자 속도/밀도·원장 primitive는 변경하지 않았다. 새 라이브러리나 전면 Navigation/Motion 설계는 추가하지 않았다. 설정 제어는 기존 Header의 구현 패턴을 사용하고 skip link의 stacking은 runtime 접근성 사양이다.

## Validation

최종 production preview: `http://localhost:3145`, 복사본 `/tmp/blog-p2-recheck.IwjEIL`, 산출물 `.next-p2-complete`. Node 24.18.0 / pnpm 10.17.1 / Chromium. 기존 서버와 `.next`를 건드리지 않았다. 이번 작업이 만든 중간 3141/3142/3144 서버만 종료했다.

- 320/390/768/1440px, light/dark, 한국어 Blog List/실제 Article. 페이지 overflow와 제목·요약 충돌 없음. 읽기 폭은 272/342/704/704px로 최대 44rem 유지.
- 390/1440px × light/dark, 정상·사용자 일시정지·Reduced Motion. 정적 배경 유지, 정상 유성 animation 유지, focus 이동 후에도 정지 유지. OS 설정 변화에 따른 상태도 검사.
- 키보드 skip link가 header 뒤에 가리지 않음. 닫힌 헤더와 열린 320px 메뉴 모두에서 main focus와 보이는 제목 확인.
- ko/en 서버 HTML, redirect, JS 없는 동작, Pretendard 로딩·CSS 우선순위·reload·언어 전환·기본 글꼴 복귀 유지.
- 기존 Guitar/Blog/Records/Admin 회귀. 별도 서비스 기능/디자인은 수정하지 않음.

## Tests

| 명령/범위 | 최종 결과 |
| --- | --- |
| `NEXT_DIST_DIR=.next-p2-complete pnpm --filter web typecheck` (격리 복사본) | 통과 |
| `NEXT_DIST_DIR=.next-p2-complete pnpm --filter web build` | 통과, 66개 페이지 생성. Blog/Guitar 정적 렌더링 유지 |
| `pnpm --filter web test` (현재 working tree) | 11개 파일 / 42개 통과 |
| `PLAYWRIGHT_BASE_URL=http://localhost:3145 pnpm --filter web exec playwright test -c p2.playwright.config.ts` | 19개 통과 |
| 동일 base URL의 `locale.playwright.config.ts` | 4개 통과 |
| 기존 Guitar spec/config를 임시 복사본에서 포트만 맞춘 Chromium 실행 | 11개 회귀 통과. 원본 테스트·설정은 수정하지 않음 |
| `git diff --check` | 통과 |

독립 lint 스크립트/ESLint 설정은 없다. build/typecheck의 기존 검사 경로를 사용했다. 최초 Unit 실행의 Guitar 날짜 assertion 실패는 새 곡과 고정 기대값의 별도 문제였다. 이후 외부에서 수정된 테스트를 보존했고 현재 전체 42개가 통과한다. 그 수정은 이번 P2 실적으로 포함하지 않는다. Guitar의 `N.C.` 미지원 표기 경고는 비차단 기존 경고로 남긴다.

## Contrast / Performance

동일한 Chromium Canvas 계측의 1초 안정 구간. 시간에 따른 호출 차이를 FPS 개선으로 해석하지 않는다.

| 측정 대상 | 결과 |
| --- | --- |
| 정상 390px | clear 60회, arc 1,920회: 프레임당 입자 32개 유지 |
| 정상 1440px | clear 60회, arc 4,800회: 입자 80개 유지 |
| 일시정지 / Reduced Motion | 양쪽 폭 모두 clear 0회, arc 0회 |
| 실제 syntax 최소 대비 | Light 4.547:1 / Dark 6.153:1 |
| 입력 경계 vs 외부 surface | Light 10.223:1 / Dark 3.580:1 |
| 새 제어의 일반 텍스트 vs header | Light 6.330:1 / Dark 9.955:1 |
| 키보드 focus outline vs header | Light 10.223:1 / Dark 6.762:1, solid 2px |
| 기본 글꼴 fresh context | Pretendard woff2 요청 0개 |
| Pretendard 선택 | encoded body 2,057,688 bytes, transfer 2,057,988 bytes, font preload 0개 |

폰트 요청의 loopback 측정 duration은 약 40.2ms였으나 배포/모바일 통신망 수치로 일반화하지 않는다. 폰트 전략/subset 변경의 근거로 삼지 않았으며 기존 선택형 로딩을 유지한다. 반투명 sky의 모든 픽셀이나 전체 WCAG AA 준수를 인증하지 않는다. 수정은 color palette를 바꾸지 않았으며 Dark surface 제거 후에도 기존 코드/입력 자체의 opaque 배경과 색은 유지한다.

`web-perf` 스킬은 필수 Chrome DevTools MCP가 없으면 STOP하도록 명시한다. 해당 trace 절차는 실행하지 않았다. Canvas/network 측정은 별도로 기록했고 LCP/INP/CLS, Paint trace, FPS·배터리·React commit 수치를 만들지 않았다.

## Concurrency / Git / Environment

다른 root-thread 하위 에이전트는 없었다. 파일 hash를 여러 번 대조했다. 검토 중 외부 `tokens.css` 변경과 Guitar catalog test 수정이 관찰되어 원본을 수정하지 않았다. 마지막 token 변경은 버튼 weight `500`을 `var(--font-default-weight)`로 연결한 것이며 값은 500으로 동일하다. 최신 선언의 브라우저 computed weight도 확인했다.

최종 token SHA-256: `dd8f35b11e2bb8b1483c2f8aa3f8580d16e6140b0ec55087caadeb612db67731`. 최종 구현 소스와 검증 복사본은 일치한다. 이후 변경은 이 검증 버전의 결과로 자동 간주하지 않는다. 기존 P2 문서에 외부 기록이 추가되어 이 파일을 별도 작성했다.

기존 3000 포트는 이번에도 `/en/blog` HTTP 500과 `react-snowfall@2.4.0...` vendor chunk 누락을 반환했다. 과거 `react-fast-compare` 누락과 다른 현재 결과다. 누가 산출물을 변경했는지는 확정하지 않는다. 이 개발 환경 문제는 정상 production preview의 P2 디자인 결함으로 분류하지 않는다.

이번 P2 파일 외 기존 P0/P1/Guitar/디자인/infra 변경은 보존했다. 새 Staging/commit/push/reset/clean/stash/discard를 수행하지 않았다. 공통 CSS/SiteDocument에는 여러 작업의 diff가 있으므로 파일 단위 일괄 commit으로 분리했다고 가정하지 않는다.

## Remaining / Limits

현재 검증 범위에서 남은 확인된 P2 제품 결함은 없다. 영어 공개 Article 본문, 실제 모바일/Safari/VoiceOver, 운영 댓글 저장/인증, 전체 WCAG/CWV/trace는 UNVERIFIED다. 기존 프런트엔드 댓글 fixture 기록과 동일 코드임을 확인했으며 운영 댓글을 새로 등록하지 않았다. 3000 개발 서버 복구, Guitar `N.C.` 지원, Pen/별도 서비스 작업은 이번 완료 범위와 분리한다. P3 또는 별도 기능 개발로 넘어가지 않는다.

No commit was created and nothing was pushed.
