# Article reading card — 검토 및 적용 기록

사용자 요청: 글 상세 페이지의 가독성을 위해 제목과 본문을 카드 배경 위에 올려 본다. 로컬 시안 검토 후 사용자가 커밋·푸시를 요청해 본문 카드 구성을 채택했다.

## 범위

- 글 상세의 기존 section에 `article-reading-card`를 붙인다. Article/Markdown 의미 구조, 본문 순서, 코드 블록, 댓글과 라우팅은 유지한다.
- 제목과 본문 뒤에 불투명한 `--color-surface-panel`을 사용해 눈·별 배경과 글자를 분리한다. 배경 효과는 카드 밖에서 계속 재생한다.
- 기존 border/radius/spacing 토큰을 재사용한다. 전역 토큰과 공통 Card API를 추가하지 않는다.
- 데스크톱 카드 안의 읽기 폭은 최대 `--measure-width`(44rem)다. 좁은 화면에서는 카드 여백을 줄인다. 기존 서체와 font toggle은 유지한다.
- Blog List, Records, Guitar와 댓글 영역의 디자인은 변경하지 않는다.

## 코드 / Pen

- 코드: `apps/web/src/app/[locale]/blog/[slug]/page.tsx`, `apps/web/src/app/globals.css`.
- Pen 검토: `design/article-reading-card.experiment.pen`. 기존 `blog.pen`의 Article Header/Body reference를 재사용한 별도 실험 파일이다. 확정 `hodako.lib.pen`과 `blog.pen`은 수정하지 않았다.
- Pen 파일은 기존 라이브러리의 상대 import를 유지하도록 `blog.pen`과 같은 디렉터리에 둔다. 하위 디렉터리에서 재오픈하면 라이브러리 참조가 깨지는 CLI 제약을 확인했다.
- Pen은 stroke를 flow padding에 포함하지 않아, 코드의 padding + border 합을 materialize했다. 최종 데스크톱 본문 704px, 모바일 본문 332px을 확인했다. 운영 값은 코드가 기준이다.
- 현재 CLI에서 페이지의 imported semantic color alias와 numeric variable이 검은 fill/누락된 geometry로 해석되는 경우가 있었다. 실험 카드의 색은 같은 라이브러리 primitive를 직접 참조하고 border/radius는 기존 변수에서 읽은 값을 materialize했다. 새 palette나 토큰 원본을 만들지 않았으며 운영 CSS는 semantic 참조를 그대로 유지한다.
- Pen의 글은 대표 발췌이며 header/footer 문구는 이전 검토 시점이다. 실제 긴 글과 배경 효과는 브라우저에서 확인한다.
- 사용자 검토 후 채택한 이번 구성이 글 상세 페이지에서 과거 P2의 투명 본문 정책을 대체한다. Blog List와 다른 페이지의 기존 surface 정책은 유지한다.

## 검증

- Node 24의 web typecheck 통과.
- 기존 design-system Playwright 6개 통과: 390/768/1440px × Light/Dark. 각 조합에서 Blog List/Article/Records/detail/Guitar list/detail 총 36개 페이지 확인.
- 가로 overflow 없음, Article 최대 704px, 기존 글꼴·이미지·코드 블록 표시와 다른 화면의 레이아웃 유지 확인.
- Pen 실험 파일을 다시 열어 라이브러리 reference와 실제 치수를 확인하고 PNG를 다시 export했다.
- `git diff --check` 통과. 전체 build 및 별도 키보드 회귀 suite는 이 시안 작업에서 재실행하지 않았다.

## 검토 자료

- 실제 페이지: <http://127.0.0.1:4351/ko/blog/gave-up-bean-validation>
- 실제 브라우저 이미지: `design/experiments/article-reading-card/browser/`.
- Pen 이미지: `design/experiments/article-reading-card/`의 S23eB/pyAbz/Awyd5/mmZYj PNG.

로컬 preview는 격리 사본 `/tmp/hodako-tailwind-ui-5s8jzc82`의 dev server다. 저장소 변경은 사본에 복사해 반영했다. 이후 사용자 요청으로 코드와 검토 자료를 main에 커밋·푸시한다. 운영 배포 완료 여부는 이 로컬 검증 결과에 포함하지 않는다.
