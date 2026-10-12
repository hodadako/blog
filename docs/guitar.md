# Guitar 콘텐츠 작성 안내

곡 파일은 `content/guitar/songs/<artist-id>/<song-id>.chopro`에 둡니다. ID는 소문자 영숫자와 단일 하이픈만 허용합니다. 두 ID는 공개 URL `<artist-id>--<song-id>`를 만들며, 파일 이름 변경은 공개 URL 변경입니다.

새 파일에는 다음 필드를 선언합니다.

```chopro
{title: 곡 제목}
{artist: 표시할 아티스트}
{key: G}
{capo: 0}
{meta: added 2026-10-09}

{start_of_verse: Verse 1}
[G]코드와 [D]가사를 함께 씁니다
{end_of_verse}
```

`title`, `artist`, `key`는 필수이며 `capo`는 생략하면 0입니다. 조성은 A~G, 선택적 한 개의 `#`/`b`, 선택적 단조 `m`을 지원합니다. `added`와 `updated`는 선택값이며 `YYYY-MM-DD` 형식입니다. `tag`는 여러 번 쓸 수 있습니다.

지원 문법은 이 프로젝트의 ChordPro 부분집합입니다. `[C]` 인라인 코드, 가사·코드만 있는 줄·빈 줄, verse/chorus/bridge 구역, `#` 소스 주석, `{comment: ...}` 연주 안내, `[*...]` 조옮김 제외 주석을 지원합니다. Metadata는 `{title: ...}` 또는 `{meta: title ...}` 형식으로 씁니다.

`[N.C.]`는 **No Chord**, 즉 해당 가사 구간에 연주할 코드가 없다는 뜻의 의도적인 표기입니다. 코드 이름이나 잘못된 코드가 아닙니다. 현재 ChordPro parser는 이를 `unsupported-chord` 경고로 분류하므로, 그 경고를 곡 데이터 오류로 해석하지 마세요. 파서를 보완할 때는 일반 코드 목록에 추가하지 말고 별도의 무코드 표기로 다뤄야 합니다.

곡 상세는 빌드 때 정적으로 생성됩니다. 잘못된 metadata, 섹션 구조, 괄호, slug는 빌드를 실패시킵니다. 미지원 directive와 코드는 원문을 보존하고 경고합니다. 조옮김·튜닝·TAB·grid 같이 음악 해석을 바꾸는 미지원 기능은 게시 오류입니다. HTML과 스크립트는 실행하지 않습니다.

가사와 악보를 공개하기 전에 직접 작성했거나 게시 허가를 받았는지 확인하세요. 예제 `hodako/quiet-walk.chopro`는 이 저장소의 자체 작성 연습곡입니다.

## 로컬 편집기

저장소 루트에서 pnpm guitar:editor를 실행하고 http://127.0.0.1:4174를 엽니다. 곡 목록에서 파일을 열거나 새 곡을 만들고, metadata 입력과 ChordPro 원문을 편집하면 같은 공개 파서와 뷰어로 미리보기를 확인할 수 있습니다. 줄/열이 표시된 오류가 남아 있으면 저장할 수 없고 경고는 확인 후 저장할 수 있습니다.

저장 경로는 artist-id/song-id.chopro 형식만 허용합니다. 기존 파일은 읽은 뒤 다른 변경이 있으면 409 충돌로 저장을 거부하므로 최신 파일을 다시 여세요. 이 도구는 loopback 개발 서버에서만 제공되며 production Next 앱에는 읽기/쓰기 endpoint가 포함되지 않습니다.

## 운영 연결 체크리스트

운영 연결은 현재 Cloudflare DNS와 Vercel 프로젝트의 실제 상태를 확인한 뒤 진행합니다. 저장소 선언만 보고 기존 레코드가 없다고 가정하지 않습니다.

1. Cloudflare에서 `guitar.hodako.dev`의 기존 DNS 레코드, proxy 상태, TLS 설정을 확인하고 Vercel 프로젝트에 해당 도메인이 이미 연결되어 있는지 확인합니다.
2. DNS 레코드가 없을 때만 Pulumi에 기존 블로그와 일관된 Guitar CNAME을 선언합니다. 이미 있으면 소유권과 현재 설정을 대조한 다음 Pulumi 관리 상태를 맞춥니다.
3. `infra/pulumi` 타입 검사와 `pulumi preview`에서 변경 대상이 Guitar 레코드로 한정됐는지 확인한 후 적용합니다. 기존 레코드 삭제·교체가 계획에 나타나면 진행을 멈추고 상태를 먼저 정리합니다.
4. Vercel 도메인 검증을 마치고 DNS 전파와 TLS 인증서를 확인합니다. 두 호스트가 올바른 사이트를 반환하는지, 응답 Host가 유지되는지, 블로그와 Guitar 응답이 캐시에서 교차 노출되지 않는지 점검합니다.
5. Guitar 홈·목록·상세·canonical·robots·sitemap과 블로그 ko/en·글·Records·관리자·댓글·조회수 경로를 smoke test합니다. 모바일 Safari/Chrome, 터치·회전·dialog·스크롤과 실사용 성능 목표도 별도로 측정합니다.

운영 도메인 인증과 Cloudflare/Pulumi 자격 증명이 제공되지 않은 작업 환경에서는 위 단계를 실행하지 않습니다. 확인 전에는 DNS 선언을 추가하거나 운영 배포를 적용하지 않습니다.
