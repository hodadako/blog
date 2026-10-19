# Guitar 읽기 작업 공간 개선

2026-10-19. 기준 HEAD `30037af` 위 working tree. 사용자의 헤더/테마/카테고리/가사 표기/hover 운지법/비모달 설정/커버 프리셋 요청을 구현했다. AdSense 시스템 및 기존 Blog/Records 구현은 변경하지 않았다.

## 구현

- Header: `호다코 / guitar` 대신 기존 wordmark와 `악보` 탐색 링크. 공통 테마 current-trigger 스타일에 자동/눈/별 문구를 적용하고 System 정책을 보존했다.
- Layout: 70rem 이상에서 sticky 왼쪽 설정, 중앙 악보, sticky 오른쪽 운지법. 좁은 화면에서는 악보 앞에 펼치는 설정 영역. 화면을 가로막는 modal과 하단 고정 toolbar를 제거했다. 설정을 DOM에서도 앞에 두어 키보드로 전체 악보의 코드 156개를 먼저 통과할 필요가 없다.
- Controls: 기존 semantic/spacing/radius/font 토큰으로 weak 버튼/조용한 필터를 사용했다. 새 palette, 의존성, Home/Design Lab은 추가하지 않았다.
- Categories: 기존 metadata.tags를 실제 필터와 검색에 연결. 현재 곡에 J-Pop 태그 하나를 추가했다. 없는 장르/곡은 만들지 않았다.
- Lyrics: 기존 원문은 그대로 두고 별도 author data JSON을 추가. Romaji/한글 발음은 source segment 경계에 대응하고 영어 뜻은 원문 아래 표시한다. 원문/발음/뜻의 모든 행이 일치하는지 catalog 로딩 때 확인한다. 자동 번역 API나 임의의 한자 단순 변환은 사용하지 않았다. 참고용 표기이며 공식 번역/발음 감수를 뜻하지 않는다. 새 곡에도 별도 JSON이 있어야 해당 선택이 표시된다.
- Fingering: 기존 chord catalog를 보존하고 현재 곡에서 빠진 slash form 6개 추가. 다른 root/quality/bass는 제한된 fret 탐색 및 구성음/최저음 검증 후 표시. 해답이 없는 경우 임의의 생략음을 정확한 운지처럼 표시하지 않는다. hover/focus/tap으로 오른쪽 영역이 바뀌며 좁은 화면은 backdrop 없는 작은 inspector. 코드명은 계속 읽을 수 있다.
- Presets: 이름/선택 URL/조옮김/실음 키/카포를 곡별 현재 브라우저에 최대 20개 저장. 적용·삭제·저장 실패 안내. 원곡이 바뀌지 않았다면 저장한 조옮김(옥타브 포함)을 그대로 복원하고 원곡 pitch가 바뀐 경우 목표 실음 키에 맞춰 계산한다. 장단조 변경은 임의 변환하지 않는다. 공개 공유/기기 동기화는 없다.
- Ending: source 끝의 빈 행과 인위적인 scroll spacer 제거. Footer line을 header container와 맞추고 기존 Footer를 재사용했다.

## 디자인 원장

`design/hodako.lib.pen`을 공식 CLI로 열고 활성 파일을 확인한 뒤 기존 origins를 Update했다. Header `l89K6m`, Sheet `koSj9`, Settings `jhOA4` IDs를 보존했다. Chord inspector `BVZyH`, Light/Dark board `O4NtM1`/`qYzsl`를 추가했다. 정적 원장의 fret 숫자는 설명용이며 실제 SVG·정확한 fret/lyrics/scroll/sticky는 브라우저 구현 책임이다. Global token은 바꾸지 않았다.

## 컴파일 및 직접 확인

- `pnpm --filter web typecheck`: 통과.
- `pnpm --filter web guitar:editor:typecheck`: 통과. 공유 SongReader에 Next router 의존성을 추가하지 않았다.
- 격리 production build: 통과, 66 static pages. 원본 개발 서버/캐시를 정리하거나 덮어쓰지 않았다.
- `git diff --check`: 통과.
- `/tmp/hodako-guitar-workspace.gOWWZl` 스냅샷, `guitar.localhost:4336`. Chrome 실제 화면에서 desktop 기본 viewport와 390×844px의 Light/Dark, 모달 없는 설정, Romaji/한글 발음/영어 뜻, slash chord inspector를 직접 확인했다.
- 커버 검토용 프리셋을 만들어 +1/카포2 저장, 초기화 후 적용, reload 복원을 직접 확인하고 검토용 항목은 제거했다. 기본 설정도 원복했다.
- 390px에서 document.scrollWidth=390. 코드/가사 원문은 내부 스크롤. Footer 끝까지 스크롤해 하단 고정 툴바가 없고 구분선이 양쪽 gutter와 맞는 것을 확인했다.
- 기존 UI 테스트의 dialog/toolbar 기대값 및 slash fallback 기대값은 새 동작에 맞게 갱신했다. **자동 Unit/E2E는 이번 요청에서 실행하지 않았다.** 이전 커밋의 통과 결과를 이번 변경의 통과 결과로 재사용하지 않는다.

실기기 Safari/Android, 자동 suite 전체, 대량 곡/프리셋 동시 탭 수정, 모든 chord quality의 물리적 연주 난이도는 미검증이다. 가사 모드는 현재 문서 선택이며 reload 시 원문으로 돌아간다. 프리셋만 영속 저장한다. 원문이 바뀌면 발음 JSON도 함께 편집해야 하며 현재 로컬 편집기에는 이 JSON 전용 편집 UI가 없다.

## 운영 상태

이번 Guitar 개선은 working tree에 있으며 아직 commit/push/deploy하지 않았다. 기존 `.playwright-mcp/`, `supabase/`는 건드리지 않았다. AdSense 인증은 이전 `30037af` 배포 상태이며 광고 ON/CMP 연동은 하지 않았다. 광고 설정은 [운영 안내](adsense.md)의 관리자 작업 및 환경변수를 따른다. unit ID와 동의 연결이 없는 상태에서 활성화 완료라고 선언하지 않는다.
