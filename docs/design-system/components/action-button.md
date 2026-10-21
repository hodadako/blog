# Button / ActionButton

운영 기준은 `src/design-system/tokens.css`와 `control-variants.ts`다. Button은 shadcn/ui의 CVA + cn 구성 방식을 기존 디자인에 맞춰 구현한다. `ActionButton`은 같은 구현의 alias다.

## Purpose / Anatomy

상태 변경과 form 제출용 native button. leading/trailing content는 children으로 조합한다. 페이지 이동은 같은 CVA를 사용하는 UiLink 또는 TextLink를 사용한다. React 19 native ref, events, name/value/form/disabled/aria/data props를 그대로 전달한다. 기본 type은 button이며 submit은 명시한다.

## Variants / Sizes

| Variant | 용도 | 실제 소비자 |
| --- | --- | --- |
| primary | 가장 중요한 중립 solid action | 댓글 등록, 관리자 로그인/저장 |
| secondary | 약한 surface action | Guitar 설정/프리셋 적용 |
| outline | 투명 배경과 공통 경계 | 모바일 메뉴, 코드 복사, Records 닫기/재생 |
| ghost | 조용한 탐색/설정/선택 | Header, locale menu, navigation, segmented choices |
| destructive | 기존 danger semantic을 쓰는 실제 삭제 | 댓글 삭제, 개인 Guitar 프리셋 삭제 |

| Size | 최소 높이 | 용도 |
| --- | --- | --- |
| sm | 44px | Header/보조 조작 |
| md (default) | 48px | form action |
| lg | 56px | API 및 검토 fixture에서 확인. 현재 제품 사용처 없음 |
| icon | 44 × 44px | IconButton. 필수 aria-label |

모든 버튼은 공통 button-radius(현재 8px), 기존 font-ui, 동일 focus/disabled/state 토큰을 사용한다. 같은 값을 페이지 CSS에 복사하지 않는다.

## States

Hover/Active는 색상 변화이며 scale/lift/shadow를 추가하지 않는다. Focus-visible은 공통 accent 2px outline/2px offset이다. Disabled는 native disabled와 공통 opacity(0.55)를 쓴다. 토글/펼침/탐색의 선택 상태는 aria-pressed/expanded/current/selected/checked로 표현한다. 서로 다른 의미를 하나의 aria 속성으로 바꾸지 않는다.

ToggleButton은 controlled pressed + native onClick을 제공한다. IconButton은 Button의 icon size를 재사용한다. SegmentedControl은 별도 client component에서 Radix single ToggleGroup을 조합하며 radiogroup/radio, roving focus, disabled option skip, Arrow/Home/End와 필수 단일 선택을 제공한다.

## Usage

```tsx
import {Button, IconButton, ToggleButton} from "@/components/ui";
import {SegmentedControl} from "@/components/segmented-control";
import {UiLink} from "@/components/ui-link";

<Button type="submit">등록</Button>
<IconButton variant="secondary" aria-label="한 음 높이기" onClick={raise}>＋</IconButton>
<ToggleButton pressed={paused} onClick={togglePaused}>효과 정지</ToggleButton>
<UiLink href="/ko/blog" appearance="button" variant="ghost" size="sm">글</UiLink>
<SegmentedControl aria-label="분류" value={category} onValueChange={setCategory} options={options} />
```

`brand`/`quiet`와 button size `compact`/`default`는 새 API에서 제거했다. 기존 소비자는 ghost/sm/md로 마이그레이션했다. Field density의 compact는 다른 API이므로 유지한다. Pen의 Brand 준비 origin은 과거 시안으로 보존하며 runtime variant를 만들지 않는다.

## Implementation / Validation

- token: `tokens.css`; Tailwind alias: `tailwind.css` @theme inline.
- CVA: `control-variants.ts`; class merge: `lib/cn.ts` (custom text/font/spacing namespace 등록).
- native components: `components/ui.tsx`; Next routing adapter: `components/ui-link.tsx`.
- unit/native/ref/contrast와 브라우저 matrix/상태/키보드 검증은 [통합 기록](../tailwind-ui-integration.md)을 따른다.
- Pen의 기존 d1lHVe/u4dfxn은 참고 origin이며 운영 사양의 자동 생성 원장이 아니다.
