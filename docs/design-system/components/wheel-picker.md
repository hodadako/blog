# WheelPicker

## Purpose

[SEED Wheel Picker](https://seed-design.io/components/wheel-picker)의 중앙 선택 표시와 흐려지는 주변 항목을 참고한 순서 값 선택기. 날짜·시간·수량 등에 사용한다. 검색이나 자유 입력이 필요한 선택은 다른 입력 방식을 사용한다.

## Anatomy / Variables

Column → Scroll viewport → Ordered options, Selection indicator, Scroll fog. `--wheel-item-height`, `--wheel-visible-items`, `--wheel-font-size`, `--wheel-radius`, `--wheel-text`, `--wheel-muted-text`, `--wheel-selection-background`. 값은 원장에서 관리한다. 여러 Column을 나란히 조합할 수 있다.

## States / Behavior

선택/비선택, Enabled/Disabled를 구분한다. Loop는 지원하지 않아 양 끝에서 멈춘다. 스크롤 중 강조되는 값은 미리보기이며 정렬이 끝난 뒤 확정한다. 드래그 후 잘못된 click 선택을 막는다. Disabled에서는 현재 값을 유지하고 입력/포커스를 막는다. 항목은 짧은 한 줄 label이며 내부 버튼/링크를 넣지 않는다.

## Implementation

```tsx
import {WheelPicker} from "@/components/wheel-picker";
<WheelPicker
  label="시"
  options={hours}
  value={hour}
  onValueChange={setHour}
  disabled={pending}
/>
```

`hours`는 unique value를 가진 `{value, label}[]`. value는 options에 존재해야 한다. controlled 값과 데이터 검증은 호출자 책임이다. ArrowUp/Down, Home/End와 aria-activedescendant를 사용한다. touch는 native scroll, mouse는 drag/wheel, 보이는 항목은 tap/click으로 선택한다. 감소된 모션에서는 즉시 정렬한다. 키보드 선택은 즉시 확정한다.

## Validation / Status

React 구현 준비. 임시 검증 route는 제품 소스에 포함하지 않는다. 키보드·경계·disabled·scroll·drag·선택 정렬과 모바일을 브라우저에서 검사한다. 날짜별 유효일/시간 형식/연동 Column의 값 보정은 각 제품의 도메인 책임이다. 실제 제품 배치는 후속 페이지에서 결정한다.
