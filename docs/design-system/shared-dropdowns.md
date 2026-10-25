# Blog / Guitar 버튼·드롭다운 통합

사용자 요청: Guitar와 Blog의 버튼·드롭다운 차이를 수정하고, 저장소 전체의 컴포넌트를 하나의 공통 시스템으로 유지한다. 별도 브랜치 `fix/shared-dropdown-controls`에서 작업하며 코드·토큰을 운영 SSOT로 사용한다.

## 확인한 차이와 적용

- 기존 Button은 공통 CVA를 사용했지만 Blog 헤더는 ghost, Guitar 반복 조작은 대부분 secondary였다. 값 선택은 outline/sm, 반복 조정·초기화·토글·닫기는 ghost, 프리셋 저장은 secondary로 역할을 정리했다. 실제 삭제 액션의 destructive는 유지한다.
- Blog 언어 메뉴는 커스텀 menu, Guitar는 OS native select라 펼친 목록의 모양이 달랐다. Guitar 카포·가사·속도에 Radix 기반 SelectControl을 적용하고 두 메뉴가 `dropdown.css`를 공유하도록 했다.
- 메뉴와 작은 입력은 기존 토큰의 44px 높이, 8px radius, 13px/500 텍스트, 8px/12px padding을 사용한다. 새 색상이나 장식 caret는 추가하지 않았다. 선택·hover·focus·disabled 표현도 공통 스타일을 사용한다.
- Blog 언어는 기존 menuitemradio와 라우팅 동작을 유지한다. Guitar는 combobox/listbox로 값 선택을 제공한다. 기존 native Select는 Admin의 props/ref/events/form 계약을 보존하기 위해 유지한다. 동일 외형이 필요한 compact field 스타일은 공통 primitive에 둔다.
- 편집기는 원래 Light 미리보기였지만 루트는 기본 Dark 토큰을 상속했다. 독립 편집기 문서의 루트에 Light 테마를 명시해 포털 메뉴까지 같은 토큰을 사용한다.
- 악보 코드 조작, 악보 링크, 저장·키/카포·폰트·스크롤·프리셋 로직, 서체·레이아웃·44rem·배경 효과는 보존한다.

## 구조와 API

| 파일 | 책임 |
| --- | --- |
| `src/design-system/tokens.css` | 기존 semantic/component 토큰, 메뉴 layer token |
| `src/design-system/control-variants.ts` / `tailwind.css` | 기존 공통 Button variant/size, 변경 없음 |
| `src/components/select-control.tsx` | controlled `value`/`onValueChange`, `options`, 필수 accessible label, trigger props/ref/events와 disabled/name/required/form 전달 |
| `src/design-system/dropdown.css` | trigger·menu·item·선택 표시·상태 스타일의 단일 구현 |
| `src/components/locale-switcher.tsx` | 기존 라우팅/키보드 구현에 공통 메뉴 스타일 적용 |
| `src/design-system/primitives.css` | compact Input/native Select의 공통 typography/padding |
| `src/features/guitar/components/song-reader.tsx` | SelectControl의 실제 소비자 3개, 공통 Button 역할별 사용 |
| `src/components/site-document.tsx`, `tools/guitar-editor/main.tsx` | Next/Vite에서 같은 dropdown stylesheet 로드 |
| `tools/guitar-editor/index.html` | 독립 Light 문서 테마 |
| `package.json`, 루트 `pnpm-lock.yaml` | `@radix-ui/react-select` 추가, 기존 CVA/Tailwind/ToggleGroup 유지 |

경로는 `apps/web/` 기준이다. SelectControl은 native select를 흉내 낸 API가 아니라 단일 값 선택용 API다. native Select와 언어 menu는 각각의 의미·폼 계약 때문에 별도 구현이며, 스타일은 공통 토큰과 dropdown 계약을 따른다. Radix는 방향키/Home/End/Enter/Space/Escape, typeahead, 포커스 복원을 담당한다.

중복 제거: 언어 메뉴의 padding/border/radius/background/shadow와 선택 marker CSS를 `globals.css`에서 제거하고 공통 dropdown으로 이동했다. 각 Guitar dropdown에 메뉴 클래스를 반복하지 않는다. 새로운 준비용 variant나 전용 디자인 확인 페이지는 추가하지 않았다.

## 검증

Node 24.18.0 / pnpm 10.17.1. 현재 작업 외 dirty 파일과 새 곡을 포함하지 않은 격리 production snapshot에서 공개 페이지를 검증했다. 공개 페이지의 변경 소스는 작업 트리와 동일하다.

| 검사 | 결과 |
| --- | --- |
| web typecheck / editor typecheck | 통과 |
| Vitest | 13 files / 57 tests 통과 |
| production build | 68 static pages 통과 |
| 새 dropdown E2E | Chromium 7 + WebKit 7 통과 |
| Guitar 기존 회귀 | Chromium/WebKit 합계 44 통과 |
| 공통 Guitar action·헤더 키보드 회귀 | 3 통과 |
| 편집기 저장·검증·Light 포털 | 3 통과 |

새 E2E는 390/768/1440px × Light/Dark에서 Blog/Guitar의 실제 메뉴 색상·border·radius·shadow·padding과 Guitar trigger/item typography·높이를 비교한다. 키보드 선택·취소·포커스 복원·typeahead·저장값 복원, viewport overflow와 기존 악보 의미도 검사한다. `e2e/helpers/select-control.ts`로 기존 Guitar 검사의 native select 전용 조작을 변경했다. 스크린리더·실기기 전체 감사는 수행하지 않았다. 별도 lint script는 없으며 타입·빌드와 `git diff --check`를 사용한다.

브라우저 대표 증거는 `design/evidence/shared-dropdowns/browser/`에 보관한다. 로컬 미리보기는 Blog `http://127.0.0.1:4352/ko/blog`, Guitar `http://guitar.localhost:4352/songs/vaundy--shiawase`다.

후속 Guitar 데스크톱 수정: 자체 스크롤되는 설정·운지법 rail에 기존 spacing token의 오른쪽 안쪽 여백을 두어 스크롤바가 버튼·입력 위에 겹치지 않게 했다. 1440px 실제 화면에서 수정 전 설정 버튼과 rail 오른쪽 경계가 맞닿았고, 수정 후 16px 간격을 확인했다. 격리 production build(68 pages) 통과. 이 runtime 스크롤바 동작은 기존 Pen 정적 시안에 표현되지 않아 코드와 브라우저가 검증 기준이다.

## Pen 검토 예외

기존 `design/hodako.lib.pen`의 Outline Compact Select/Input, Compact/Quiet ActionButton origin을 참고했다. 변경 검토 자료 갱신 요청이 Pen 요금제 사용량 한도로 차단되어 이번 작업에서 `.pen` 파일은 변경하지 않았다. 기존 Pen의 native select/secondary 중심 표현과 운영 코드에 차이가 남는다. 사용량이 복구되면 기존 origin을 유지해 이번 공통 trigger/menu/상태를 반영하고 참조 문서를 다시 열어 검토한다. 코드와 디자인 파일의 자동 동기화는 없다.

사용자의 갱신·커밋·푸시 요청 후 `get_app_state`로 다시 확인했지만 같은 사용량 한도로 디자인 도구가 차단됐다. `.pen`을 직접 수정하는 우회는 하지 않았다. 검증된 운영 코드·유지 규칙·브라우저 증거와 이 예외 기록을 현재 브랜치에 커밋·푸시하는 범위로 진행한다. Pen 갱신은 사용량 복구 후 남은 후속 작업이다.

## 유지 규칙과 제외 범위

`AGENTS.md`, README, registry, workflow에 저장소 전체의 공통 컴포넌트 유지 규칙을 기록했다. 새 UI와 수정 UI 모두 실제 소비자를 검색하고 공통 API/토큰에 반영한다. 의미가 다른 제어를 무조건 Button으로 바꾸지 않으며, 예외는 목적·공유 스타일·검증을 기록한다.

기존 개인정보 페이지의 작업 중 변경, 새 Guitar 곡, `.playwright-mcp/`, `supabase/`는 이 수정 범위에 포함하지 않는다. 사용자가 현재 브랜치의 커밋·푸시를 요청했으며 main 병합·운영 배포는 이번 작업에 포함하지 않는다.
