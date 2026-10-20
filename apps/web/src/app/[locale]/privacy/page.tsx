import type {Metadata} from "next";
import {buildPageTitle, resolveLocale, resolveRouteParams, type AppLocale} from "@/lib/site";

interface PrivacyPageParams {
  locale: string;
}

interface PrivacyPageProps {
  params: Promise<PrivacyPageParams>;
}

interface PolicySection {
  heading: string;
  paragraphs?: string[];
  items?: string[];
}

interface PolicyCopy {
  heading: string;
  intro: string;
  updated: string;
  sections: PolicySection[];
  externalHeading: string;
  externalLinks: Array<{label: string; href: string}>;
  closing: string;
}

const policyCopy: Record<AppLocale, PolicyCopy> = {
  ko: {
    heading: "개인정보 처리방침",
    intro: "이 방침은 hodako.dev 블로그와 guitar.hodako.dev 기타 악보 사이트를 이용할 때 처리되는 정보, 쿠키 및 브라우저 저장소의 사용 방법을 설명합니다.",
    updated: "시행 및 최종 업데이트: 2026년 10월 21일",
    sections: [
      {
        heading: "1. 운영자와 문의",
        paragraphs: [
          "운영자 표시는 Hodako(@hodadako)입니다. 개인정보 관련 문의, 열람·정정·삭제 요청은 GitHub 프로필에 공개된 연락 경로를 이용해 주세요. 공개 게시물이나 이슈에 비밀번호, IP 주소 등 민감한 정보를 올리지 마세요.",
          "이 방침은 두 사이트에 공통으로 적용됩니다. 외부 사이트로 이동하거나 외부 콘텐츠를 불러오면 해당 제공자의 별도 개인정보 처리방침이 적용될 수 있습니다.",
        ],
      },
      {
        heading: "2. 처리하는 정보와 목적",
        paragraphs: ["사이트 기능 제공, 댓글 관리와 악용 방지를 위해 다음 정보를 처리합니다."],
        items: [
          "댓글: 작성자 이름, 댓글 내용, 게시물·댓글 식별자, 작성 시각, 댓글 수정·삭제 인증을 위한 비밀번호 해시를 처리합니다. 스팸·악용 방지를 위해 요청 IP의 HMAC 해시도 처리합니다. 공개 상태의 이름과 댓글 내용은 사이트 방문자에게 표시됩니다. 비밀번호 원문은 저장하지 않습니다.",
          "댓글 작성 퀴즈와 보안 제한: 선택한 답, 일회성 챌린지 식별자와 만료 시각, 요청 IP의 HMAC 해시를 댓글 작성 권한 확인과 요청 제한에 사용합니다. 이메일이나 전화번호를 댓글 작성에 요구하지 않습니다.",
          "기본 웹 요청: 페이지 제공과 보안·장애 대응을 위해 호스팅 및 네트워크 서비스가 IP 주소, 요청한 URL, 브라우저·기기 정보 등 연결 정보를 처리할 수 있습니다.",
        ],
      },
      {
        heading: "3. 쿠키와 브라우저 저장소",
        paragraphs: ["사이트는 언어 선택과 관리자 로그인에 필요한 쿠키를 사용합니다. 테마와 악보 보기 설정은 쿠키가 아니라 이용자 기기의 브라우저 저장소에 보관됩니다."],
        items: [
          "site_locale 쿠키: 선택한 사이트 언어를 기억하며 최대 1년 동안 보관됩니다.",
          "blog_admin_session 쿠키: 관리자 로그인에만 사용하며 최대 7일 동안 보관됩니다. HttpOnly와 SameSite 속성을 사용하고, 운영 환경에서는 Secure 속성도 적용합니다.",
          "브라우저의 localStorage: 테마, 글꼴, 배경 움직임 설정과 기타 악보의 글자 크기·스크롤 속도·조옮김·카포 및 이용자가 만든 커버 프리셋을 보관합니다. 이 설정은 브라우저 프로필에 남으며 사이트 계정 간 동기화되지 않습니다.",
          "브라우저의 sessionStorage: 레코드 목록의 스크롤 위치와 일부 화면 설정을 현재 탭 세션 동안 보관합니다.",
        ],
      },
      {
        heading: "4. 외부 서비스와 광고",
        paragraphs: [
          "웹사이트 전달에는 Vercel, API와 네트워크 처리에는 Cloudflare Workers, 댓글·퀴즈 데이터 저장에는 Supabase를 사용합니다. 서비스 제공자는 서비스 운영 과정에서 접속 정보를 처리할 수 있으며, 각 제공자의 개인정보 처리방침과 계정 설정이 적용됩니다. 저장소 코드만으로 각 계정의 데이터 처리 국가와 제공자 로그 보유기간을 확인할 수는 없습니다.",
          "일부 블로그 글에는 YouTube 동영상이 삽입되어 있습니다. 해당 글을 열면 브라우저가 YouTube에 직접 연결되며 Google/YouTube가 쿠키, IP 주소 또는 기기 식별자 등 정보를 처리할 수 있습니다.",
          "현재 사이트 코드의 AdSense 광고 게재는 비활성화되어 있습니다. 향후 광고를 활성화하면 Google과 광고 파트너가 광고 제공·측정·개인화 목적으로 쿠키, 웹 비콘, IP 주소 또는 기타 식별자를 사용할 수 있습니다. 광고를 켜기 전에 관련 지역의 동의 설정과 이 방침을 다시 확인하고 갱신하겠습니다.",
        ],
        items: [
          "개인화 광고 설정은 Google 광고 설정에서 변경할 수 있습니다. 브라우저에서 쿠키와 사이트 데이터를 삭제하거나 차단하면 언어 기억, 관리자 로그인, 개인 설정 일부가 작동하지 않을 수 있습니다.",
        ],
      },
      {
        heading: "5. 보유 기간과 삭제",
        paragraphs: [
          "쿠키와 브라우저 저장소는 위에 적힌 기간 또는 이용자가 브라우저에서 삭제할 때까지 보관됩니다. 댓글 작성자는 댓글 비밀번호를 사용해 댓글을 수정하거나 삭제할 수 있습니다. 삭제 요청이 처리되면 댓글 본문은 비워지고 삭제 상태로 바뀌며, 악용 방지와 기록 관리를 위해 일부 식별자와 이력은 남을 수 있습니다.",
          "현재 코드에는 댓글 데이터를 정해진 기간 후 자동으로 삭제하는 작업이 설정되어 있지 않습니다. 댓글 본문이 삭제된 뒤에도 악용 방지와 기록 관리를 위해 일부 식별자와 이력이 남을 수 있습니다.",
          "퀴즈 인증 토큰은 짧은 만료시간을 갖지만, 만료된 기록의 실제 데이터베이스 삭제 시점은 별도 정리 작업에 따릅니다. 외부 서비스의 접속 로그는 각 제공자의 정책과 설정에 따라 보관됩니다.",
        ],
      },
      {
        heading: "6. 이용자의 권리와 안전 조치",
        paragraphs: [
          "관계 법령이 적용되는 범위에서 이용자는 개인정보 열람, 정정, 삭제 및 처리 정지를 요청할 수 있습니다. 위 연락 경로로 요청해 주세요. 본인 댓글은 댓글 비밀번호를 이용해 직접 수정하거나 삭제할 수 있습니다.",
          "관리자 세션은 HttpOnly 쿠키로 보호하고, 댓글 비밀번호는 해시 형태로 저장합니다. 데이터베이스 접근 권한과 서버 비밀값은 공개 브라우저 코드와 분리해 관리합니다. 이는 보안 사고가 발생하지 않는다는 보증을 뜻하지 않습니다.",
        ],
      },
      {
        heading: "7. 콘텐츠 및 책임 안내",
        paragraphs: [
          "블로그 글과 기타 악보는 일반적인 정보와 연습을 위한 자료입니다. 내용의 정확성·완전성·항상 이용 가능함을 보증하지 않으며, 필요한 경우 이용자가 권리자와 최신 정보를 확인해야 합니다. 외부 링크와 삽입 콘텐츠의 운영·정보 처리 방식은 각 제공자의 정책을 따릅니다.",
          "이 안내는 운영자에게 적용되는 법령상 의무나 책임을 포괄적으로 면제하는 문구가 아닙니다. 개인정보 처리의 구체적인 내용은 실제 운영 설정과 적용 법령에 따라 확인되어야 합니다.",
        ],
      },
    ],
    externalHeading: "관련 제공자 안내",
    externalLinks: [
      {label: "GitHub 운영자 프로필 및 문의 경로", href: "https://github.com/hodadako"},
      {label: "Vercel 개인정보 처리방침", href: "https://vercel.com/legal/privacy-policy"},
      {label: "Cloudflare 개인정보 처리방침", href: "https://www.cloudflare.com/privacypolicy/"},
      {label: "Supabase 개인정보 처리방침", href: "https://supabase.com/privacy"},
      {label: "Google 개인정보 및 YouTube 정책", href: "https://policies.google.com/privacy?hl=ko"},
      {label: "Google 광고 설정", href: "https://adssettings.google.com/"},
      {label: "Google 게시자 개인정보 고지 안내", href: "https://support.google.com/publisherpolicies/answer/10437794?hl=ko"},
      {label: "개인정보보호위원회 개인정보 처리방침 작성지침", href: "https://pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS217&mCode=I030010000&nttId=12018"},
    ],
    closing: "이 방침은 서비스 기능이나 데이터 처리 방식이 바뀌면 갱신됩니다.",
  },
  en: {
    heading: "Privacy Policy",
    intro: "This policy explains how information, cookies, and browser storage are used on the hodako.dev blog and the guitar sheet site at guitar.hodako.dev.",
    updated: "Effective and last updated: October 21, 2026",
    sections: [
      {
        heading: "1. Operator and contact",
        paragraphs: [
          "The site is operated under the name Hodako (@hodadako). For privacy questions or requests to access, correct, or delete information, use the public contact method on the GitHub profile. Do not post passwords, IP addresses, or other sensitive information in public posts or issues.",
          "This policy applies to both sites. When you visit an external site or load external content, that provider's own privacy policy may apply.",
        ],
      },
      {
        heading: "2. Information and purposes",
        paragraphs: ["Information is processed to provide the sites, manage comments, and prevent abuse."],
        items: [
          "Comments: Author name, comment text, post and comment identifiers, timestamps, and a password hash used to authorize comment edits or deletion. An HMAC hash of the request IP is used to prevent spam and abuse. Published names and comments are visible to site visitors. Plain-text passwords are not stored.",
          "Comment quizzes and rate limits: Selected answers, one-time challenge identifiers and expiry times, and an HMAC hash of the request IP are used to authorize comment posting and limit requests. An email address or phone number is not required to comment.",
          "Basic web requests: Hosting and network providers may process connection information such as IP address, requested URL, and browser or device details to deliver the pages and maintain security and availability.",
        ],
      },
      {
        heading: "3. Cookies and browser storage",
        paragraphs: ["The sites use cookies for language preference and administrator login. Theme and guitar-reading preferences are saved in browser storage on your device, not in cookies."],
        items: [
          "site_locale cookie: Remembers the selected site language for up to one year.",
          "blog_admin_session cookie: Used only for administrator login and kept for up to seven days. It uses HttpOnly and SameSite attributes, and Secure in production.",
          "Browser localStorage: Stores theme, font, motion preference, and guitar settings such as font size, scroll speed, transposition, capo, and user-created cover presets. These settings stay in the browser profile and are not synchronized across site accounts.",
          "Browser sessionStorage: Stores the Records list scroll position and some screen preferences for the current tab session.",
        ],
      },
      {
        heading: "4. External services and advertising",
        paragraphs: [
          "Vercel delivers the website, Cloudflare Workers handles API and network processing, and Supabase stores comments and quiz data. These providers may process connection information to provide their services and are subject to their own privacy policies and account settings. The repository code does not establish the processing country or provider log-retention period for each account.",
          "Some blog posts embed YouTube videos. Opening a page with an embed connects your browser directly to YouTube. Google or YouTube may process information such as cookies, IP address, or device identifiers.",
          "AdSense ad serving is disabled in the current site code configuration. If advertising is enabled later, Google and advertising partners may use cookies, web beacons, IP addresses, or other identifiers to serve, measure, or personalize ads. Regional consent settings and this policy should be reviewed before ads are enabled.",
        ],
        items: [
          "You can change personalized ad settings in Google Ads Settings. Blocking or clearing cookies and site data in your browser may affect language preference, administrator login, or some saved preferences.",
        ],
      },
      {
        heading: "5. Retention and deletion",
        paragraphs: [
          "Cookies and browser storage remain for the periods listed above or until you clear them in your browser. Comment authors can edit or delete their comments using the comment password. When a deletion request is processed, the comment body is cleared and its status is changed; some identifiers and history may remain for abuse prevention and record management.",
          "The current code does not configure automatic deletion of comments after a fixed period. Some identifiers and history may remain after a comment body is deleted for abuse prevention and record management.",
          "Quiz authorization tokens have short expiry times, but expired database records are removed only according to separate cleanup operations. Hosting-provider access logs are retained under each provider's policies and settings.",
        ],
      },
      {
        heading: "6. Your rights and safeguards",
        paragraphs: [
          "Where applicable law grants these rights, you may request access, correction, deletion, or suspension of processing. Use the contact method above. You can edit or delete your own comment using its password.",
          "Administrator sessions use an HttpOnly cookie, comment passwords are stored as hashes, and database access credentials are kept out of public browser code. These measures do not guarantee that a security incident will never occur.",
        ],
      },
      {
        heading: "7. Content and responsibility",
        paragraphs: [
          "Blog posts and guitar sheets are provided for general information and practice. Their accuracy, completeness, and continuous availability are not guaranteed; check current information and rights with the relevant owner when needed. External links and embedded content are operated and processed under their providers' policies.",
          "This notice does not waive any duties or responsibilities imposed on the operator by applicable law. The details of processing must be checked against the actual operating configuration and applicable law.",
        ],
      },
    ],
    externalHeading: "Related provider information",
    externalLinks: [
      {label: "GitHub operator profile and contact method", href: "https://github.com/hodadako"},
      {label: "Vercel Privacy Policy", href: "https://vercel.com/legal/privacy-policy"},
      {label: "Cloudflare Privacy Policy", href: "https://www.cloudflare.com/privacypolicy/"},
      {label: "Supabase Privacy Policy", href: "https://supabase.com/privacy"},
      {label: "Google Privacy Policy, including YouTube", href: "https://policies.google.com/privacy"},
      {label: "Google Ads Settings", href: "https://adssettings.google.com/"},
      {label: "Google publisher privacy disclosures", href: "https://support.google.com/publisherpolicies/answer/10437794?hl=en"},
      {label: "Korean PIPC privacy policy guidance", href: "https://pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS217&mCode=I030010000&nttId=12018"},
    ],
    closing: "This policy will be updated when site features or data practices change.",
  },
};

export async function generateMetadata({params}: PrivacyPageProps): Promise<Metadata> {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);
  const copy = policyCopy[locale];

  return {
    title: buildPageTitle(locale, copy.heading),
    description: copy.intro,
  };
}

export default async function PrivacyPage({params}: PrivacyPageProps) {
  const routeParams = await resolveRouteParams(params);
  const locale = resolveLocale(routeParams.locale);
  const copy = policyCopy[locale];

  return (
    <div className="page-main">
      <section className="page-section page-section--article">
        <header className="page-header">
          <h1 className="page-title">{copy.heading}</h1>
          <p className="page-copy">{copy.intro}</p>
          <p className="footer-note">{copy.updated}</p>
        </header>
        <article className="detail-content">
          {copy.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.items ? (
                <ul>
                  {section.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              ) : null}
            </section>
          ))}
          <section>
            <h2>{copy.externalHeading}</h2>
            <ul>
              {copy.externalLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} rel="noreferrer" target="_blank">{link.label}</a>
                </li>
              ))}
            </ul>
          </section>
          <p>{copy.closing}</p>
        </article>
      </section>
    </div>
  );
}
