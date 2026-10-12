# Guitar Editorial Songbook 구현·검증 기록

2026-10-13. 기준 HEAD `755fad9`. 사용자 제공 `guitar-editorial-songbook-codex-implementation.md`의 확정된 결정을 구현했다. 추가 요청으로 Vaundy 곡의 기본 운지 조성을 F로 변경했다.

## 구현한 결정

- Guitar `/`는 HTTP 308로 `/songs`에 연결한다. 별도 Home/Hero와 중복 목록을 제거하고 sitemap에서도 redirect 원점을 제외했다. 상세 slug/canonical과 Host 경계는 유지한다.
- 목록은 44rem, 악보는 52rem 상한이다. Songs h1, 검색 입력 하나, 곡명/아티스트 행과 얇은 separator를 사용한다. 검색 정책과 곡 정렬은 기존 catalog를 따른다.
- 실제 Blog wordmark 클래스, font-family, semantic color/spacing/focus 토큰과 ThemeProvider를 재사용한다. SiteFooter에 선택적 탐색 props만 추가하여 Guitar에서도 같은 구현을 사용한다. Blog의 기본 props와 HTML은 유지된다.
- 악보의 중첩 card/설정 box를 없앴다. 조옮김/스크롤/옵션만 주요 툴바에 두고 카포·폰트 크기·속도·곡별 초기화는 native dialog에 넣었다. 모바일 툴바는 하나만 고정하며 safe-area와 문서 끝 여백을 적용한다.
- 공통 palette/폰트/Blog CSS와 배경은 변경하지 않았다. 신규 의존성, 아이콘 라이브러리, Home, Design Lab 및 데이터 저장 계층은 추가하지 않았다.

## 기능 수정 블록

- N.C.: pitch가 없는 `no-chord` 토큰으로 보존한다. 조옮김하지 않으며 미지원 경고/운지 버튼을 만들지 않는다. 원본 diagnostics의 위치 정보는 보존하고 실제 미지원 경고는 공개 화면에서 중복 메시지를 제거해 접힌 안내에 표시한다.
- 운지 없음: 실제 voicing lookup 결과가 없는 코드는 span이다. 빈 팝업이나 죽은 버튼을 만들지 않는다. 검증된 기존 운지 데이터와 slash chord 계산을 그대로 유지한다.
- 정렬: 각 ChordPro 구간의 chord/lyric 시작 x좌표, 원문 순서와 공백을 보존한다. 코드가 붙은 구간만 최소 간격을 확보해 코드 이름이 붙어 보이지 않게 한다. 빈 가사 구간도 행 높이를 맞춘다.
- 읽기 모드: 긴 원문 행은 악보 내부에서 가로 스크롤한다. 문자 중간 강제 줄바꿈과 전체 페이지 가로 overflow를 피한다. 해당 영역은 키보드로 접근·스크롤할 수 있다. 이것은 모든 악보를 모바일 폭으로 자동 재조판했다는 뜻이 아니다.
- 공유 경계: 공개 페이지가 목록 이동 href를 SongReader에 전달한다. SongReader는 Next.js Router/Link에 의존하지 않으며 Vite 로컬 에디터에서도 같은 컴포넌트를 사용한다. 최초 검증에서 발견된 Next Link/Vite 충돌을 이 방식으로 해결했다.
- Vaundy: D→F, 156개 chord의 root/bass를 3반음 올렸다. F/A, Bb, F/C, F 등을 사용하고 A/C#·Dm/C# 표기를 보존했다. 비교 검사에서 가사·공백·다른 metadata와 N.C. 4개가 동일함을 확인했다. 저장된 사용자 transpose/capo 설정 키는 바꾸지 않았으므로 기존 선택은 새 기본 조성에 대해 적용된다.

## 수정 파일

| 파일 | 역할 |
| --- | --- |
| `apps/web/src/app/guitar/layout.tsx` | 공유 wordmark/Theme/Footer를 사용하는 Guitar 셸 |
| `apps/web/src/app/guitar/page.tsx` | 루트 영구 redirect |
| `apps/web/src/app/guitar/songs/page.tsx` | Songs h1과 44rem 목록 |
| `apps/web/src/app/guitar/songs/[slug]/page.tsx` | 공개 목록 href를 공유 reader에 전달 |
| `apps/web/src/app/guitar/sitemap.ts` | 단일 목록 원점 |
| `apps/web/src/app/guitar/guitar.module.css` | scoped editorial layout, 원문 행/툴바/dialog/focus |
| `apps/web/src/components/site-footer.tsx` | 기존 기본 동작을 유지하는 선택적 탐색 props |
| `apps/web/src/features/guitar/components/song-search.tsx` | 즉시 검색, 초기화, 전체 행 링크 |
| `apps/web/src/features/guitar/components/song-reader.tsx` | 편집 구조, 옵션/운지 dialog, 원문 정렬, 경고 구획 |
| `apps/web/src/features/guitar/chordpro/types.ts`, `parser.ts` | 독립적인 No Chord 토큰 |
| `apps/web/src/features/guitar/chordpro/parser.spec.ts`, `chords/music.spec.ts` | 쉼/공백/slash/카포 조합 회귀 |
| `apps/web/e2e/guitar.e2e.spec.ts` | 재배치한 옵션 및 redirect에 맞춘 기존 회귀 검사 |
| `apps/web/e2e/guitar-editorial.e2e-spec.ts` | 반응형·테마·원문 위치·대비·키보드·하단 여백 검사 |
| `apps/web/playwright.config.ts` | 격리 포트 지원 및 명시적 Guitar testMatch |
| `content/guitar/songs/vaundy/shiawase.chopro` | 사용자 지정 F 조성 |
| `design/hodako.lib.pen`, `docs/design-system/components.md` | Guitar origin 5개와 CSS/runtime 매핑 |
| `design/evidence/guitar/` | Pen 사양과 실제 전후 화면 |
| `docs/guitar.md`, 이 문서 | 읽기 모드/No Chord/구현 검증 기록 |

## Pen SSOT

공식 headless interactive 세션에서 정확한 활성 파일 `design/hodako.lib.pen`을 확인했다. 기존 variables/components를 조회하고 Header `l89K6m`, Search `AI7qw`, SongRow `yySqV`, SongSheet `koSj9`, PlaybackToolbar `jhOA4`를 기존 라이브러리에 추가했다. Light/Dark board는 같은 variables/origin을 사용한다. 기존 component IDs와 primitive/semantic values를 변경하지 않았다.

폰트 선택/수치 저장/실제 chord anchors/내부 스크롤/native dialog는 브라우저의 기술 사양이다. Pen의 정적 발췌를 실제 악보 데이터 검증으로 간주하지 않는다.

## 검증 결과

Node 24.18.0, pnpm 10.17.1. `/tmp/hodako-songbook.XpxOme`에 소스 스냅샷과 별도 `.next`를 만들었다. 기존 3000/3145 프로세스 및 산출물을 덮어쓰거나 종료하지 않았다. Guitar는 4327, P2는 4319, Locale은 4318, 에디터는 4174에서 검증했다.

| 명령 | 결과 |
| --- | --- |
| `pnpm --filter web typecheck` | 통과 |
| `pnpm --filter web build` | 통과, 66개 정적 페이지 |
| `pnpm --filter web test` | 11개 파일 / 44개 통과 |
| `pnpm guitar:editor:typecheck` | 통과 |
| `PLAYWRIGHT_BASE_URL=http://guitar.localhost:4327 pnpm --filter web exec playwright test --workers=2 --output=songbook-results` | Chromium 21 + WebKit 21 = 42개 통과 |
| `pnpm --filter web exec playwright test -c p2.playwright.config.ts --output=p2-results` | 19개 통과 |
| `pnpm --filter web exec playwright test -c locale.playwright.config.ts --output=locale-results` | 4개 통과 |
| `pnpm --filter web exec playwright test -c tools/guitar-editor/playwright.config.mts --output=editor-results` | 2개 통과; 임시 곡 파일만 사용 |
| `git diff --check` | 통과 |

독립 lint 명령은 현재 프로젝트에 없다. Next build의 기존 품질 검사를 수행했다. 첫 격리 실행은 PATH의 Node 18로 Vitest가 시작하지 못했고 Node 24를 명시해 해결했다. 첫 build는 Projects의 GitHub API에 대한 sandbox DNS 제한으로 실패했으며 네트워크 허용 후 통과했다. 코드/콘텐츠 오류로 분류하지 않는다.

실제 Guitar 목록과 한국어/일본어 곡을 360/390/768/1440px × light/dark × Chromium/WebKit에서 검사했다. 모든 source lyric row/segment/column과 DOM을 비교하고 transpose 및 28px 폰트 상태에서도 x 앵커와 행 정렬이 같음을 검증했다. 코드만 있는 행의 최소 간격, 목록 44rem/악보 52rem 상한, 전체 페이지 overflow 없음, 모바일 footer의 toolbar 위 노출을 확인했다.

검색 0/1/2개 결과, 검색 초기화, 전체 행 키보드 활성화, 메뉴/dialog Escape와 focus restoration, 저장 차단, reload, System 테마, native chord diagram, 카포, 자동 스크롤의 시간 기반 이동/수동 중지 및 reduced-motion 환경의 명시적 재생을 확인했다. 긴 제목은 테스트 중 DOM 문구를 바꿔 겹침/overflow를 검사했다. 공개 콘텐츠를 추가하지 않았다. 등록 곡은 2개이므로 대량 catalog 성능은 측정하지 않았다.

실제 computed color 기준 목록 제목 대비는 light/dark 모두 18.27:1, 아티스트는 light 6.33:1 / dark 11.73:1이다. 전환이 끝난 스크린샷과 값을 사용했다. 전체 WCAG 준수 선언은 아니다.

Blog의 홈 redirect, 숨김 h1, 44rem 본문, Locale HTML lang, Pretendard/기본 폰트 복귀, light/dark, Starry/Snowy/Shooting Stars 및 motion pause, 키보드/skip link/코드 복사 회귀가 기존 P2/Locale suite에서 통과했다. Records와 관리자 경로도 기존 Guitar suite의 Blog 회귀 시나리오로 확인했다.

## 전후 화면

변경 전은 기존 P2 완료 스냅샷 서버 3145, 변경 후는 이번 최종 프로덕션 스냅샷 4327이다. 동일 viewport/테마에서 촬영했다. 변경 후 Vaundy 기본 조성은 사용자 요청대로 F다.

- `design/evidence/guitar/before/`: 390/1440 × light/dark의 목록/곡 상세 8개.
- `design/evidence/guitar/after/`: 같은 조합의 최종 화면 8개.
- `design/evidence/guitar/IjHo1.png`, `mDcPO.png`: 공유 Pen 사양 Light/Dark.
- 전체 360/390/768/1440 × 양 테마 × 양 엔진의 정상/큰 글자 화면은 `/tmp/hodako-songbook.XpxOme/apps/web/songbook-results`에 있다.

## 잔여 검증과 Git 범위

구현 범위에서 확인된 미해결 결함은 없다. 실제 iPhone Safari/Android 터치·회전, VoiceOver, 대량 catalog 및 운영 성능 수치는 미검증이다. WebKit 데스크톱 에뮬레이션을 실기기 검증으로 간주하지 않는다.

곡 데이터와 리디자인은 별도 커밋으로 남긴다. 기존 미추적 `.playwright-mcp/`, `supabase/`는 포함하지 않는다. 이번 요청은 커밋까지이며 원격 push와 새 운영 배포는 수행하지 않는다.
