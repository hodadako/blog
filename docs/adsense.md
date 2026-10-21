# 수동 AdSense 운영

## 사이트 검토 메모 (2026-10-21)

AdSense의 `hodako.dev`는 「게시자 콘텐츠가 없는 화면에 Google 게재 광고」 사유로 주의 필요 상태다. 정책 센터에는 별도 게재 제한 항목이 없고 ads.txt는 승인됨으로 표시된다. 공개 `/en/blog`는 게시글이 0개였으므로 영문 게시글이 생기기 전에는 `/ko/blog`로 임시 이동한다. 배포 빌드의 canonical·사이트맵·robots 기준 주소는 `https://www.hodako.dev`로 고정한다. 기존 공개 사이트에서는 글 canonical과 사이트맵에 `http://localhost:3000`이 노출되었다.

일반 서브도메인인 `guitar.hodako.dev`는 AdSense 사이트 목록에 별도로 추가·심사할 수 없다. [Google의 사이트 관리 안내](https://support.google.com/adsense/answer/12170421?hl=ko)에 따라 루트 도메인 심사를 먼저 해결한다. 코드 수정만으로 사이트 승인이나 기타 콘텐츠의 심사 포함을 보장하지 않는다. 글의 추가 게시와 지급 정보 완료 여부를 확인한 뒤 재검토를 요청한다.

## 구조와 현재 상태

Next.js App Router의 한 앱에서 locale Blog와 host rewrite Guitar를 제공한다. 별도 광고 SDK/의존성을 추가하지 않았다.

- `src/lib/ads.ts`: 사이트·위치·환경 플래그, ID 검증, 소유권 확인 및 ads.txt의 단일 설정 경계.
- `AdPlacement`: 서버에서 자격을 확인하고 비활성/ID 누락이면 `null`.
- `AdSlot`: 광고 동의를 구독하고 허용된 경우에만 영역과 스크립트를 표시. 경로가 바뀌면 새 물리적 `<ins>`를 사용한다. WeakSet 및 Google status로 동일 노드 재초기화를 차단한다.
- `AdSenseScript`: Next Script의 고정 ID/URL로 문서 내 중복 로딩 방지. 수동 `push({})`만 사용한다. 오류를 무한 재시도하지 않는다.
- `ad-consent.ts`: CMP 연결 경계. 동의 시스템 자체가 아니며 쿠키/동의 기록을 만들지 않는다.

현재 **전역 광고 OFF / CMP 미연결 / 실제 unit ID 없음**이다. 실제 광고 송출 완료나 AdSense 승인 완료를 의미하지 않는다. 사용자가 제공한 계정 `ca-pub-2583784505029772`만 기본 verification 값으로 등록했다. 환경변수로 덮어쓰거나 빈 문자열로 verification을 제거할 수 있다. 확인용 meta/ads.txt는 광고 요청이나 쿠키를 발생시키지 않는다.

## 배치

| 사이트 | 위치 | 배치 기본값 | 실제 연결 |
| --- | --- | --- | --- |
| Blog | article-end | ON | Markdown 본문 뒤, 댓글 앞. 44rem 기존 토큰 |
| Blog | article-inline | OFF | 설정만 준비, 본문 삽입 없음 |
| Blog | post-list / records / design-lab | OFF | 삽입 없음 |
| Guitar | song-end | OFF | Next 상세 페이지에서 SongReader 뒤. editor에는 연결하지 않음 |
| Guitar | song-list | OFF | 삽입 없음 |

전역/사이트/배치 활성화와 유효한 ID, 정책 준비 플래그, 실제 동의가 모두 필요하다. 설정만 바꿔 목록이나 정적 페이지에 광고가 새로 삽입되지는 않는다. 기타는 권리 및 Publisher Policies 검토가 끝나기 전까지 OFF를 유지한다.

## 환경변수

`apps/web/.env.example` 및 Vercel 프로젝트의 기존 Environment Variables를 사용한다. ID는 비밀키가 아니지만 Publisher와 unit을 혼동하지 않는다. SSG HTML의 설정이 바뀌므로 변경 후 재빌드·재배포한다.

| 변수 | 기본값 / 역할 |
| --- | --- |
| ADSENSE_PUBLISHER_ID | 위 소유자 계정. `ca-pub-` + 16자리. 빈 값/잘못된 형식은 비활성 |
| ADS_ENABLED | false. 전체 요청 스위치 |
| ADS_CONSENT_CONFIGURED | false. 개인정보 고지 및 선택한 CMP adapter 검토가 끝난 뒤만 true |
| ADS_ALLOW_DEVELOPMENT | false. production 이외 실행의 별도 허용 |
| ADS_BLOG_ENABLED | true |
| ADS_GUITAR_ENABLED | false |
| ADS_BLOG_ARTICLE_END_ENABLED | true |
| ADS_GUITAR_SONG_END_ENABLED | false |
| ADSENSE_BLOG_ARTICLE_END_SLOT | 미설정. 숫자 `data-ad-slot` |
| ADSENSE_GUITAR_SONG_END_SLOT | 미설정 |

기타 예약 위치의 flag/unit 키는 `ads.ts`의 `placements`에 함께 정의한다. 새로운 위치는 같은 표에 추가하고 승인된 페이지에 명시적인 `AdPlacement` 한 개를 연결한다. 광고 개수를 자동으로 늘리거나 본문을 임의 분할하지 않는다.

## AdSense 관리자 작업

1. 사이트 연결에서 meta 또는 ads.txt 인증을 선택하고 사이트 검토를 요청한다. 승인 전에는 송출을 보장할 수 없다.
2. **광고 → 사이트 기준 → 해당 사이트 편집 → 자동 광고 OFF**를 확인한다. 수동과 자동은 동일 스크립트를 사용할 수 있으므로 코드만으로 계정 설정을 강제로 끌 수 없다. 자동 최적화가 수동 위치를 변경하는 설정도 검토한다.
3. **광고 → 광고 단위 기준 → 디스플레이 광고**에서 반응형 단위를 만들고 코드의 `data-ad-slot` 숫자를 복사한다. `client`는 Publisher ID이며 unit ID가 아니다. 계정 스크립트를 중복 붙이지 않는다.
4. 개인정보처리방침, 지역별 동의 요구 및 **개인정보 보호 및 메시지**의 CMP를 결정한다. 아래 연결을 검증한 후 두 준비 플래그를 켠다.
5. 승인·실제 ID·동의가 갖춰진 환경에서 실광고와 CLS를 확인한다. 자신의 광고 클릭/반복 노출로 시험하지 않는다.

## 개인정보와 CMP — 미해결 운영 결정

조사 시 기존 개인정보처리방침/CMP는 발견되지 않았다. 임의의 CMP 서비스, 자체 동의 배너, 지역 IP 추정 또는 NPA 우회는 추가하지 않았다. 정책 완료를 허위 선언하지 않도록 기본 차단한다.

- TODO: 실제 운영 정보를 반영한 개인정보처리방침을 작성·게시하고 양 사이트에서 접근 경로를 정한다. 광고 관련 제3자 쿠키/기기 저장소/데이터 사용 고지가 필요하다.
- TODO: 대상 지역에 맞는 CMP를 선택한다. EEA/UK/스위스는 Google 인증 TCF CMP 요구를 확인한다. 현재 Google 안내의 신규 TC string 요구는 TCF 2.3이다.
- TODO: 선택한 CMP adapter에서 해당 방문자의 광고 요청이 허용되고 Google이 소비할 동의 신호가 준비된 뒤에만 `setAdvertisingConsent("granted")`를 호출한다. 단순 localStorage 체크나 사이트 전체 강제 granted는 허용하지 않는다. 해당 CMP의 API/지역 정책이 결정되기 전에는 이 adapter를 추정 구현하지 않는다.

```ts
import { setAdvertisingConsent } from "@/lib/ad-consent";
// CMP의 초기 평가/선택 변경 callback에서 실제 결과를 매핑한다.
// 이 함수 자체는 Google TCF 신호를 작성하지 않는다.
setAdvertisingConsent("denied"); // unknown / denied / granted
```

초기 상태는 unknown, 새로고침은 CMP 재평가가 필요하다. bridge는 문서 내 SPA 탐색에서 상태를 유지하고, 동의 철회 시 광고 DOM을 제거해 이후 unit 초기화를 막는다. 이미 수행된 요청/다운로드를 되돌리지는 못한다. 외부 adapter는 필요시 `window.hodakoAdvertisingConsent`를 갱신하고 `hodako:advertising-consent` 이벤트로 알릴 수 있다. CMP의 Google TC string 전달과 별도인 앱 요청 허용 경계다. non-personalized ads도 필요한 동의 검토를 면제하지 않는다.

## ads.txt 및 verification

공통 `app/ads.txt/route.ts`가 `text/plain`을 반환한다. Guitar host router도 정확히 `/ads.txt`를 허용한다. 기존 파일은 없었다.

```text
google.com, pub-2583784505029772, DIRECT, f08c47fec0942fa0
subdomain=guitar.hodako.dev
```

`pub-` 판매자 ID는 동일 설정의 `ca-pub-`에서 변환한다. 루트가 참조한 Guitar 서브도메인에서도 동일 판매자를 제공한다. 배포 후 `https://hodako.dev/ads.txt` (기존 www redirect 포함), `https://www.hodako.dev/ads.txt`, `https://guitar.hodako.dev/ads.txt`를 확인하고 관리자에서 업데이트 확인한다. 로컬 route 통과와 실제 배포 크롤링/Google 승인은 별개다.

공통 문서 head의 `google-adsense-account` meta는 같은 ID를 사용한다. 승인 확인을 위해 스크립트를 사전 실행하지 않는다.

## 디자인/실패 처리

기존 font/color/44rem measure/spacing을 그대로 사용한다. label은 광고/Advertisement이며 카드·테두리·그림자·배경은 없다. 비활성/미동의 시 DOM/빈 공간 없음. 허용 후 rectangle 영역에 최소 250px를 예약하고 Google의 `data-full-width-responsive=false`를 사용해 화면 가장자리 확장을 막는다. 실제 creative의 높이는 Google이 결정하므로 실광고 CLS 보장은 별도 검증 사항이다. 나중에 동의가 허용되며 영역이 추가되거나 오류로 제거되는 시점의 이동도 실제 CMP 환경에서 측정해야 한다.

스크립트 오류는 같은 문서에서 재시도하지 않고 영역을 숨긴다. `push` 예외는 해당 노드에서 한 번만 처리한다. unfilled/차단기가 조용히 요청을 막는 경우 예약 공간이 남을 수 있으며 반복 요청하지 않는다. 콘텐츠/댓글/연주 조작은 계속 사용할 수 있다.

## 검증 방법

단위 테스트 `src/lib/ads.spec.ts`: 기본 OFF, ID 구분, gate, development, 사이트 독립성, 판매자 ID 변환. 기존 Guitar routing 테스트에 ads.txt 추가.

실제 송출 없는 E2E는 **별도 복사한 격리 checkout**에서만 아래 가상 설정으로 빌드·실행한다. 테스트가 Google 네트워크를 차단하고 광고 스크립트를 mock한다. 운영 계정/실제 광고 단위로 실행하지 않는다.

```sh
ADS_ENABLED=true ADS_CONSENT_CONFIGURED=true ADSENSE_PUBLISHER_ID=ca-pub-1234567890123456 ADSENSE_BLOG_ARTICLE_END_SLOT=5678 pnpm --filter web build
ADS_ENABLED=true ADS_CONSENT_CONFIGURED=true ADSENSE_PUBLISHER_ID=ca-pub-1234567890123456 ADSENSE_BLOG_ARTICLE_END_SLOT=5678 pnpm --filter web exec playwright test -c ads.playwright.config.ts
```

테스트 설정은 운영 CMP가 준비됐다는 선언이 아니다. 실제 페이지의 비동의 차단, 두 host ads.txt, 허용 후 390/1440px × Light/Dark, SPA 왕복 초기화 및 실패 1회만 확인한다. 정상 설정의 전체 regression/build 및 결과는 최종 작업 보고와 구분해 기록한다. 자동 광고 실험은 이번 구현에 포함하지 않으며 계정 변경과 별도 승인·검토가 필요하다.

### 최종 검증 기록 (2026-10-18)

기준은 `f13f62e` 위의 미커밋 AdSense working tree다. `/tmp/hodako-ads-default.D29Ek3`(실제 계정 verification, 광고 기본 OFF)와 `/tmp/hodako-ads-enabled.2nzDSe`(가상 계정, 모의 광고 ON)를 분리했다. Node 24.18.0, Chromium 및 기존 Guitar suite의 WebKit을 사용했다. 원래 개발 서버와 빌드 산출물을 삭제하지 않았다.

- Typecheck 통과. Unit 12개 파일/51개 테스트 통과. `git diff --check` 통과.
- 기본 OFF 및 가상 ON production build 모두 통과(66 static pages). 별도 lint script는 없으며 Next build의 lint/type 검증을 사용했다. 최초 sandbox 빌드는 기존 Projects의 GitHub API DNS 접근으로 실패했고, 네트워크 허용 후 통과했다.
- 광고 E2E 최종 production 7개, Strict Mode development 7개 통과. 두 환경 모두 Google 광고 네트워크를 차단하고 모의 스크립트만 실행했다.
- 모바일 label의 최초 x=0 문제는 기존 본문 여백 토큰으로 수정했다. 수정본의 article/slot x와 width 일치 검사를 390/1440px × Light/Dark에서 통과했다. 개발 서버가 수정 전 module CSS를 제공하던 중간 검사 2개 실패는 검증 서버 재시작 후 같은 검사로 통과했다.
- 기본 OFF production에서 실제 소유자 meta 및 두 host ads.txt 확인, 강제로 bridge를 granted로 해도 광고 DOM/AdSense loader 요청 없음 확인.
- 기존 Blog P2 19개, Guitar Chromium/WebKit 42개, Locale/Font 4개 통과. 320/390/768/1440px Blog 및 360/390/768/1440px Guitar, Light/Dark, navigation, 폰트, Records 및 기본 라우팅 회귀를 포함한다.
- 기존 블로그 본문(`content/posts/gave-up-bean-validation/ko.md`)의 YouTube iframe은 `googleads.g.doubleclick.net/pagead/id`, `static.doubleclick.net/instream/ad_status.js` 등을 별도로 요청했다. initiator frame은 `youtube.com/embed/KTZ-y85Erus`다. **사이트 전체 Google 광고 관련 요청이 0건이라는 뜻은 아니다.** 새 AdSense 배치와 구분하며 기존 콘텐츠 embed의 동의 정책은 별도 검토가 필요하다.
- 개발 로그에서 기존 SongReader metadata의 plain-object 직렬화 경고가 관찰됐다. 이번 변경은 해당 parser/데이터 props를 바꾸지 않았으며 관련 전체 production browser suite는 통과했다. 광고 범위에서 임의로 기타 데이터를 리팩터링하지 않았다.

실광고 승인/송출, 실제 creative 높이 및 CLS, 선택할 CMP의 실제 Google 신호 전달, 정책 준수 전체는 미검증이다. 공개 영어 Article이 없으므로 영어 본문에서의 실광고도 미검증이다. 영문 label은 구현했으며 영어 목록에는 배치하지 않는다.

화살표 제거 `f13f62e`는 별도 커밋·배포 완료 후 공개 Blog/Guitar 390/1440px × Light/Dark에서 확인했다. **AdSense 변경은 아직 커밋·배포하지 않았다.** 로컬 verification과 현재 공개 사이트의 승인 상태를 혼동하지 않는다.

## 공식 근거

- [사이트 연결 / meta·ads.txt 확인 방법](https://support.google.com/adsense/answer/7584263?hl=ko)
- [ads.txt 형식](https://support.google.com/adsense/answer/12171612?hl=ko), [서브도메인 처리](https://support.google.com/adsense/answer/9785052?hl=en)
- [광고 단위 코드](https://support.google.com/adsense/answer/9274019?hl=en), [반응형 매개변수](https://support.google.com/adsense/answer/9183460?hl=en)
- [자동 광고 설정](https://support.google.com/adsense/answer/9305577?hl=en)
- [CMP 요구사항](https://support.google.com/adsense/answer/13554116?hl=en), [TCF와 Google ad tag 호출 조건](https://support.google.com/adsense/answer/9804260?hl=en)
- [Publisher Policies 및 개인정보 고지](https://support.google.com/adsense/answer/10502938?hl=en)
