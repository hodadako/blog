# Design ↔ Code Workflow

## Open / Inspect

pen.dev 앱에서 `design/hodako.lib.pen`을 연다. Libraries로 변환된 공식 원장이며 Components/Variables에서 개별 외형과 Theme를 편집할 수 있다. `blog.pen`은 이 원장을 Import한다. 저장한 원장 변경은 참조 문서를 다시 열어 불러온다. Instance override가 원본 변경을 가릴 수 있으므로 override부터 확인한다.

MCP 연결은 앱 Settings → MCP에서 Codex를 활성화하고 클라이언트를 재시작한다. `get_app_state`로 **정확한 활성 파일**을 확인한 뒤 execute를 사용한다. filePath나 CLI `--in`을 적었다고 현재 desktop editor가 자동으로 바뀌었다고 가정하지 않는다. 이번 검증에서도 desktop CLI가 다른 기존 문서를 보고 있는 사례를 발견했으며 해당 세션에서는 편집/저장을 계속하지 않았다.

공식 CLI의 직접 MCP shell도 사용할 수 있다. 새 AI agent를 실행하는 명령이 아니다.

```sh
pen version
pen status
pen interactive --help
pen interactive --in design/blog.pen --out design/blog.pen
```

shell에서 `get_app_state()`, `list_libraries()`, `execute({input: 'Print(GetVariables())'})`, `save()`를 사용한다. 새 빈 문서에 원장을 연결할 때는 `import_library({path: '/absolute/path/design/hodako.lib.pen'})`를 사용한다. 기존 참조 문서에서 remove_library를 갱신 용도로 사용하지 않는다: 연결된 instance가 독립 복사본으로 바뀐다. 문서를 재오픈한다.

.pen 내부 serialized ID/reference를 직접 편집하거나 일반 파일 parser로 읽지 않는다. MCP/공식 CLI가 지원하는 APIs로 검사하고 수정한다.

## Approval Scope

- Global: Primitive/Semantic/공통 spacing·typography. Blog/Article/Admin/Records/Guitar consumers를 확인한다.
- Component: component alias 또는 component origin만 변경한다. 실제 사용처를 registry에서 확인한다.
- Experimental: 별도 실험 공간/임시 변경. 제품 적용 여부를 명시한다. 공식 baseline에 섞지 않는다.

사용자 승인 범위가 이미 명확하면 동일 작업에 다시 승인을 요청하지 않는다. 의미가 달라지는 양쪽 변경 충돌이나 미승인 실험만 확인한다. 파일 저장은 자동 code sync가 아니다.

## Design → Code

Codex 요청 예시:

> hodako.lib.pen의 승인된 PostCard 변경과 현재 PostCard를 비교하고, 대응 토큰/스타일만 반영해줘. Props, 링크, 콘텐츠와 P0 모바일 규칙을 유지하고 공통 토큰의 다른 사용처도 확인해줘.

1. GetVariables와 Get(component)/resolved instance로 사양을 읽는다.
2. components.md의 source/class/token 관계로 영향 범위를 찾는다.
3. CSS 변수 alias 관계를 유지하며 최소 Diff를 만든다.
4. 현재 route에서 actual computed style과 화면을 확인한다.
5. typecheck/tests/build 결과 및 예외를 기록한다.

## Code → Design

현재 CSS/computed style의 의도된 변경을 읽고 기존 origin/Variables를 Update/SetVariables로 수정한다. 컴포넌트를 재생성하여 ID와 instance 관계를 잃지 않는다. 초기 마이그레이션은 browser import-to-canvas로 실제 PostCard를 가져왔고, 레이아웃을 reusable flow로 정리했다. import 당시 snapshot은 `design/evidence/before/VQ8Ia.png`다.

## Mapping / Technical Boundaries

- CSS의 기존 semantic/component key와 pen variable 이름을 대응시킨다. core 색상은 Primitive→Semantic→Component의 참조를 유지한다.
- 숫자 spacing/size는 canvas px, CSS rem 등으로 구현한다. font/zoom과 runtime 계산 때문에 숫자 문자열의 동일성만 비교하지 않는다.
- pen의 variable opacity는 percent이므로 disabled opacity는 CSS fraction으로 변환한다. 텍스트 lineHeight는 ratio다.
- CSS `clamp`, viewport media queries, max-width, flex wrap, 한국어 text-wrap/word-break는 앱의 기술 사양이다. 원장 device theme은 대표 결과를 표현한다.
- 원장 GyeonggiTitle과 CSS Blog Korean Title은 같은 서체의 등록 이름 차이다. CSS alias를 새 font-family로 임의 교체하지 않는다. OTF/기존 WOFF와 Custom Fonts 자산을 유지한다.
- 코드 예시의 canvas monospace는 preview fallback이다. 실제 Shiki 색상과 시스템 monospace는 코드 사양으로 유지한다.
- Starry/Snowy/Shooting Stars는 runtime scene이다. 정적 page frame은 입자·유성 애니메이션 전체를 표현하지 않는다. 원장의 sky 역할/기존 gradient specification과 라이브 브라우저를 함께 확인한다.
- source CSS는 원장의 구현 projection이며 독립 디자인 기준이 아니다. 새로운 변환 프레임워크나 자체 비주얼 편집기는 없다.

## Validation Record

아래 기록을 실제 완료 시 갱신한다.

- [x] 공식 UI로 hodako.pen을 Design Library로 변환하고 hodako.lib.pen으로 저장.
- [x] 현재 코드의 PostCard browser import, 기존 서체/이미지 자산 가져오기.
- [x] 확인된 5색 Primitive와 Light/Dark Semantic 연결.
- [x] 재사용 컴포넌트 및 Default/Hover/Focus/Disabled 상태 구성.
- [x] 지정 Title_Medium.otf를 Custom Fonts에 등록하고 GyeonggiTitle Medium으로 렌더링 확인.
- [x] blog.pen에서 라이브러리 Import status=ok, refs와 namespace 변수 사용, Desktop/Mobile Light/Dark 8개 대표 화면.
- [x] 원장/페이지를 독립 세션에서 재오픈하고 실제 PNG 렌더링 확인. 잘못된 type의 미사용 font-brand 별칭은 제거한 뒤 재검증.
- [x] WheelPicker React: keyboard, no-loop bounds, disabled, native scroll, tap/click, mouse drag 브라우저 검사.
- [x] PostCard 원장 수정 → source 적용 → actual browser → source/원장 복원 전체 round trip.
  - 기존 component alias(공통 space 참조)를 실험적으로 32로 수정하여 저장. code CSS 2rem 및 browser computed padding-bottom=32px, 링크 유지 확인.
  - blog.pen 재오픈 후 library instance의 padding=[16,0,32,0] 확인.
  - 실제 code를 원래 공통 spacing alias로 복원하고 원장에도 같은 reference를 반영. component resolved padding=24 확인. 변경 실험은 baseline에 남기지 않음.
- [x] Node 24 typecheck 및 웹 Vitest 11개 파일/42개 테스트 통과.
- [x] Node 24 production build 통과 (66개 static pages). Projects의 GitHub API 조회는 네트워크 허용 후 검증.
- Guitar 새 콘텐츠의 N.C. chord 경고는 기존 parser의 경고이며 이 작업에서 변경하지 않음. 새 곡 때문에 첫 항목의 고정 날짜를 기대하던 테스트는 실제 sample 날짜/내림차순 정렬 검사로 보완.

WheelPicker 검증용 component-check route는 `/tmp/hodako-pen-ssot-review`에만 만들었다. 제품 소스에는 preview/editor route를 추가하지 않았다.


## Final Verification (2026-10-12)

- pen library 정상 재오픈. 재사용 origin 14개, 원래 PostCard 간격으로 복원. blog.pen Import status=ok, local variables=[] (모든 공통 변수는 library namespace).
- Library 저장→페이지 재오픈→참조 변화 확인 및 browser round trip 완료. 원장 PNG와 대표 페이지 PNG는 `design/evidence`에 보관한다.
- 웹 typecheck / 단위 테스트 42개 / production build 통과. 별도 lint 스크립트는 없으며 build/typecheck 및 `git diff --check`로 확인.
- 핵심 글자/링크/버튼 AA 대비와 입력 경계 대비 테스트 통과. 기준: [WCAG Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
- Wheel keyboard/scroll/click/drag/disabled 검사 통과. 테스트용 임시 route만 사용했다. 제품 페이지의 실제 배치는 후속 작업.
- Blog Light/Dark 390/768/1440px overflow 없음. 기존 유성6개 유지 및 제거된 Lab/API 404 확인.
- 실기기/스크린리더 전체 감사와 WebKit은 수행하지 않았다. canvas는 실제 배경 animation/전체 Markdown/동적 댓글을 대체하지 않는다.
- Chromium 기존 Blog/Records/Guitar 회귀 11개 통과. locale/서버 HTML/폰트 전환 4개 통과. 병렬 실행의 공용 artifact 경로 충돌은 별도 `/tmp/hodako-ssot-regression-results`로 분리하여 재검증.
- 실제 JSX/이벤트 구현은 코드에 남기고, pen 자산 변경을 코드에 자동 반영하는 watcher는 만들지 않았다. 전체 사이트 일괄 리디자인이나 배포/커밋은 하지 않았다.

### pen 0.3.11 dimension binding exception

실제 검증에서 execute의 `width`/`height`에 number variable reference를 넣으면 일부 frame이 fit_content로 처리되어 붕괴했다. 현재 원장은 Button 높이와 Wheel row 높이를 **원장의 canonical 변수에서 읽어 materialize한 numeric geometry**로 저장한다. 이는 별도 디자인 값 원본이 아니라 해당 변수의 표현 결과다. geometry node context에 원본 변수 이름을 남겼다. 관련 변수 변경 시 Codex가 같은 숫자를 관련 frame에 다시 적용하고 렌더링을 확인해야 한다. 색상/radius/padding/font-size 등 정상 binding과 재사용 instance 관계는 그대로 유지한다. Font weight는 pen String 변수로, CSS unitless 값으로 연결한다.

Wheel row는 flow layout과 Fill Width를 사용하므로 Column 폭 변경과 복수 Column 배치는 실제로 재사용할 수 있다. Button weight는 component alias→공통 Medium weight를 참조하고 implementation CSS도 같은 alias 관계로 연결했다.
