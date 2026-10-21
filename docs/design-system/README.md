# hodako.dev Design System

## Runtime SSOT

**운영 UI 기준: `tokens.css` + 공통 컴포넌트 코드 · 스타일: Tailwind CSS v4/CVA · 디자인 검토: Pen.dev.**

2026-10-21 Tailwind 통합 요청에 따라 이전 Pen-first 절차를 대체한다. 현재 API, 감사와 검증 결과는 [Tailwind 통합 기록](tailwind-ui-integration.md)을 따른다.

코드의 토큰과 컴포넌트가 실제 구현의 SSOT다. Pen은 디자인 검토용 참고 자료이며 `.pen`이 실행 코드에 자동 동기화되지 않는다. [변경 절차](workflow.md), [컴포넌트 매핑](components.md), [현재 감사](audit.md)를 먼저 확인한다. 자체 Design Lab 및 파일 저장 API는 제거했다. Storybook도 도입하지 않았다.

책임은 다음과 같다.

- pen.dev: 외형/상태/대표 화면을 검토하는 참고 시안. 코드 변경을 선행 차단하는 승인 원장이 아니다.
- 코드: Primitive/Semantic/Component 토큰, CVA variant/size, 렌더링, Props/events, 접근성과 실제 반응형/애니메이션.
- 문서: 사용 목적, 매핑, 승인/동기화 절차와 기술적 예외. 독립적인 디자인 값 저장소가 아니다.

## Identity / Principles

개인 개발 블로그. 콘텐츠와 타이포그래피를 중심에 두고 기존 서체·wordmark·Starry/Snowy·Shooting Stars를 유지한다. Blog List가 홈페이지이며 `/ko`→`/ko/blog` redirect를 유지한다. 별도 Home/Hero를 추가하지 않는다. P0/P1 완료 구조를 재작업하지 않는다. Records의 독립적인 음반 디자인과 Guitar의 도메인 UI는 별도 작업이다.

Content First · Typography Before Decoration · Consistency Without Uniformity · Purposeful Motion · Reuse Before Creation · Preserve Identity. 기존 UI를 살피고 실제 목적이 있는 컴포넌트만 만든다.

## Files

- `design/hodako.lib.pen`: Design Library 검토 자료. Foundations, Components, States, Wheel Picker의 Anatomy/Usage. 운영 값은 코드에서 확인한다.
- `design/blog.pen`: 라이브러리 Import와 refs로 만든 Blog List/Article의 Desktop/Mobile × Light/Dark. 공통 변수/컴포넌트의 독립 복사본을 만들지 않는다.
- `design/fonts/gyeonggi/Title_Medium.otf`: 사용자가 지정한 기본 경기천년제목 Medium 원본. Custom Fonts에 GyeonggiTitle/Medium으로 등록했다. 기존 Light/Bold도 같은 패밀리에서 유지한다.
- `design/fonts/127.0.0.1` 및 `design/images/127.0.0.1`: 실제 브라우저 Import가 가져온 기존 서체/글 이미지 자산. 디자인 파일과 함께 유지한다.
- `apps/web/src/design-system/tokens.css`: 운영 토큰의 SSOT. `tailwind.css`의 `@theme inline`이 이 semantic 값을 참조한다.

기존 `designs/current-blog*.pen`은 과거 시안이며 새 원장의 기준이 아니다.

## Foundations

확정 Primitive Palette는 Ink `#0a1128`, Navy `#001f54`, Blue `#034078`, Cyan `#1282a2`, Paper `#fefcfb`다. 이 목록은 사용자 승인사항이며, 변경 승인 시 원장과 이 기록을 함께 갱신한다.

Semantic 변수는 Primitive를 참조하고 Component 변수는 Semantic/공통 geometry를 참조한다. 예: `--primitive-blue`→`--color-accent`→컴포넌트의 링크/포커스 표현. Light는 Paper/Ink와 Blue 링크, Dark는 Ink/Navy와 밝은 Cyan 파생 링크를 사용한다. Cyan 원색은 일반 텍스트 대비가 부족해 그대로 링크 색으로 사용하지 않는다. 지원색/기존 sky/status primitives는 core 5색과 구분한다. 상태 텍스트의 Light 지원색은 대비를 보완했다.

Typography/Spacing/Radius/Border/Layout/Motion은 현재 코드의 값을 복원했다. 실제 값과 Theme별 값은 `tokens.css`에서 확인한다. Medium 제목의 대표 사양은 canvas의 device theme으로 비교하고, 코드의 clamp와 제목 길이별 변형을 그대로 보존한다. overlay shadow는 유지하며 일반 PostCard에 shadow나 radius를 추가하지 않는다.

기본 서체는 **경기천년제목 Medium**. 웹의 `Blog Korean Title`은 같은 서체를 가리키는 기존 CSS alias다. 지정 OTF와 기존 Medium WOFF의 family/PostScript 이름을 확인했다. 디자인에는 GyeonggiTitle을 사용하며 웹의 기존 CSS alias/폰트 토글/fallback은 호환성을 위해 유지한다. CodeBlock의 캔버스 monospace 예시는 Roboto Mono이며 실제 앱의 기존 시스템 monospace/Shiki 사양은 변경하지 않는다.

## Components

현재 공통 UI는 [Tailwind 통합 기록](tailwind-ui-integration.md)을 따른다. [production review](production-review.md)는 전환 이전 이력이다. 공통 API는 `@/components/ui`, Next.js 탐색 어댑터는 `@/components/ui-link`, 버튼 스타일은 `control-variants.ts`의 CVA와 `tailwind.css`, 나머지 기본 스타일은 `primitives.css`다. SiteDocument에서 토큰 → Tailwind → 기본 컴포넌트 → 페이지 CSS 순서로 로드한다. Vite 악보 편집기도 같은 토큰과 기본 스타일을 사용한다.

각 컴포넌트는 Purpose → Anatomy → Variables → Variants → States → Usage → Implementation → Validation을 유지한다. SEED의 정리 방식을 참고하되 자체 palette와 서체를 적용한다.

[Button](components/action-button.md)은 primary/secondary/outline/ghost/destructive와 sm/md/lg/icon을 갖는다. IconButton/ToggleButton은 같은 Button 구현을 사용하고 SegmentedControl은 Radix의 키보드 제어를 사용한다. ActionButton은 Button의 export alias다. [WheelPicker](components/wheel-picker.md)는 순서 있는 값 선택용으로 미리 준비한 재사용 컴포넌트이며, 실제 제품 페이지에는 아직 배치하지 않았다.

Hover/Focus/Disabled는 디자인 상태 인스턴스와 DOM 상태의 대응이다. React에 상태마다 별도 Variant를 만들지 않는다. 새로운 Variant는 목적을 문서화한다. 미래 페이지용 준비 컴포넌트는 실제 제품 사용처와 구분해 registry에 기록한다.

## Themes / Accessibility / Responsive

같은 Semantic 변수에 pen theme `mode: light/dark`를 적용한다. 대표 device theme은 Desktop/Mobile이며 브라우저 breakpoint 자체를 대체하지 않는다. pen number는 디자인 단위이고 CSS rem/px/ms, opacity percent의 변환을 [workflow](workflow.md)에 기록한다.

코드의 theme bootstrap, locale root layout, focus-visible, 콘텐츠 렌더링과 키보드 제어를 보존한다. 대비 테스트는 핵심 텍스트/링크/액션과 입력 경계를 확인한다. 이것이 전체 사이트의 WCAG 인증을 뜻하지 않는다. Wheel의 fog·드래그/스크롤 settling, 배경 입자/유성, Shiki syntax, 서버 데이터와 동적 댓글은 실제 브라우저에서 검증한다.

## Design ↔ Code

1. 코드의 토큰/컴포넌트와 실제 소비자, Pen 참고 origin을 확인한다.
2. Global/Component/Experimental로 분류한다. 실험은 확정 원본을 덮어쓰기 전에 분리하고, 동기화 검증용 임시 변경은 반드시 원복한다.
3. `tokens.css`와 CVA에서 필요한 사양을 수정하고 실제 사용처를 함께 갱신한다.
4. Pen과 코드의 차이를 검토하고 검토용 시안을 필요한 범위에서 갱신한다.
5. Diff, typecheck/tests/build와 실제 브라우저 결과를 확인한다.
6. 결과와 예외를 기록한다. Pen을 저장했다면 참조 문서를 다시 열어 갱신한다.

충돌 시 승인된 변경과 코드 변경 이유를 조사한다. 의도하지 않은 차이는 코드 기준으로 조사하고, 접근성/기술적 예외는 문서화한다. 양쪽의 동시 변경은 승인된 기준을 확인한 뒤 병합한다.

## Adding Components

[registry](components.md)에서 기존 구성부터 확인한다. 공통 코드를 실제 소비자와 함께 추가하고 Purpose/States/Usage를 연결한다. 페이지에는 기존 컴포넌트를 import해 사용한다. 구현은 현재 React/CSS 구조를 재사용하며 동작과 accessibility를 별도로 명세한다. 매핑과 검증 상태를 함께 갱신한다. 컴포넌트를 자동으로 전부 새 코드로 재생성하지 않는다.

## Environment / Verification

pen CLI 0.3.11 및 최신 registry 버전을 확인했고 계정은 Active다. Codex CLI의 pencil MCP가 활성화되어 있으며 live tools는 get_app_state/read_skill/execute/browser/get_style이다. 공식 [Libraries](https://docs.pen.dev/core-concepts/design-libraries), [Variables](https://docs.pen.dev/core-concepts/variables), [Design ↔ Code](https://docs.pen.dev/design-and-code/design-to-code), [AI Integration](https://docs.pen.dev/getting-started/ai-integration)를 확인했다. Tailwind/CVA/Radix 통합과 현재 검증은 [통합 기록](tailwind-ui-integration.md)을 따른다.

검증 결과와 완료 여부는 [workflow의 검증 기록](workflow.md)에 남긴다. 검증하지 않은 항목은 완료로 간주하지 않는다.
