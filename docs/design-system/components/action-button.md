# ActionButton

## Purpose

사용자의 다음 행동을 명확하게 표현하는 공통 버튼. [SEED Action Button](https://seed-design.io/components/action-button)의 액션 위계와 상태 정리 방식을 참고하고 hodako palette/서체를 적용했다.

## Anatomy / Variables

Root + Label. `--button-height`, `--button-radius`, `--button-padding-x/y`, `--button-font-size`, `--button-weight`. 실제 값은 원장에서 관리한다. 기본 서체는 경기천년제목 Medium.

## Variants / States

| API | Design | 사용 |
| --- | --- | --- |
| primary | Neutral Solid | 댓글 등록 등 가장 중요한 액션 |
| secondary | Neutral Weak | 취소·보조 액션 |
| brand | Brand Solid | 브랜드 강조가 필요한 대표 액션 |

Default/Hover/Focus/Disabled는 native 상태다. 같은 화면에 높은 위계 버튼을 무분별하게 반복하지 않는다. 목적 없는 아이콘을 추가하지 않고 동작을 알 수 있는 라벨을 사용한다. 긴 라벨에서는 부모 layout의 wrap/stack을 확인한다.

## Implementation

```tsx
import {ActionButton} from "@/components/ui";
<ActionButton variant="primary" onClick={save}>저장하기</ActionButton>
<ActionButton variant="secondary" onClick={cancel}>취소</ActionButton>
<ActionButton variant="brand" disabled={pending}>확인하고 적용</ActionButton>
```

기존 Button/primary/secondary 호출자와 같은 구현이다. 이벤트·form type·disabled는 HTML button props를 유지한다. pending 요청의 중복 클릭 방지는 호출자의 disabled와 요청 상태가 담당한다.

## Validation

Light/Dark의 label/background 대비, Tab focus, disabled 클릭 방지, form submit type, 모바일 터치 목표와 긴 라벨을 확인한다. 디자인과 구현 모두 mapping 문서의 동일 node/token을 사용한다.
