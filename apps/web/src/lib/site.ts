export const SUPPORTED_LOCALES = ["ko", "en"] as const;
export const DEFAULT_LOCALE = "ko" as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export function isSupportedLocale(locale: string): locale is AppLocale {
  return SUPPORTED_LOCALES.includes(locale as AppLocale);
}

export interface RouteProps<T> {
  params: Promise<T> | T;
}

export interface AdminCopy {
  eyebrow: string;
  heading: string;
  intro: string;
  commentsLink: string;
}

export interface AdminCommentsCopy {
  eyebrow: string;
  heading: string;
  intro: string;
  tableHeading: string;
  tableCopy: string;
  approveLabel: string;
  hideLabel: string;
  blacklistIpLabel: string;
  ipHashLabel: string;
}

interface HomeFeatureItem {
  title: string;
  description: string;
}

interface SiteDictionary {
  siteName: string;
  siteTagline: string;
  navigation: {
    label: string;
    home: string;
    projects: string;
    blog: string;
    inspirations: string;
    admin: string;
    languageLabel: string;
    localeNames: Record<AppLocale, string>;
  };
  footer: {
    note: string;
  };
  home: {
    eyebrow: string;
    heading: string;
    intro: string;
    primaryCta: string;
    secondaryCta: string;
    featuredLabel: string;
    featuredCta: string;
    projectsLabel: string;
    projectsHeading: string;
    projectsCopy: string;
    projects: HomeFeatureItem[];
    recentLabel: string;
    recentHeading: string;
    recentCopy: string;
  };
  blogIndex: {
    eyebrow: string;
    heading: string;
    intro: string;
  };
  post: {
    backToBlog: string;
    readMoreLabel: string;
    sidebarTitle: string;
    sidebarCopy: string;
    localeLabel: string;
    commentsHeading: string;
    commentsCountLabel: string;
    commentsEmpty: string;
    commentFormHeading: string;
    commentFormCopy: string;
    commentSubmitLabel: string;
    commentAuthorLabel: string;
    commentPasswordLabel: string;
    commentContentLabel: string;
    replyLabel: string;
    editLabel: string;
    deleteLabel: string;
    submitEditLabel: string;
    submitDeleteLabel: string;
    parentLabel: string;
    quizLoading: string;
    quizQuestion: string;
    quizAnswer: string;
    quizVerify: string;
    quizVerified: string;
    quizUnavailable: string;
    quizFrontendOnly: string;
    commentFrontendOnlyNotice: string;
    notFoundEyebrow: string;
    notFoundTitle: string;
    notFoundCopy: string;
  };
  adminLogin: {
    eyebrow: string;
    heading: string;
    intro: string;
    passwordLabel: string;
    submitLabel: string;
    helperText: string;
  };
  admin: AdminCopy & {
    eyebrow: string;
    heading: string;
    intro: string;
  };
  adminComments: AdminCommentsCopy;
}

const dictionaries: Record<AppLocale, SiteDictionary> = {
  ko: {
    siteName: "Stone & Story",
    siteTagline: "독립적으로 운영하는 기술 저널",
    navigation: {
      label: "주요 탐색",
      home: "홈",
      projects: "Projects",
      blog: "Blog",
      inspirations: "Inspirations",
      admin: "관리",
      languageLabel: "Language",
      localeNames: {
        ko: "한국어",
        en: "English",
      },
    },
    footer: {
      note: "제품, 엔지니어링, 운영 메모를 차분하게 축적하는 개인 기술 블로그입니다.",
    },
    home: {
      eyebrow: "Independent publication",
      heading: "제품과 엔지니어링 사이의 실험을 담아내는 기술 블로그",
      intro: "작게 운영하되 읽기 쉽게 정리한 메모, 구현 기록, 운영 관찰을 로케일별로 차곡차곡 쌓아갑니다.",
      primaryCta: "Blog 둘러보기",
      secondaryCta: "Inspirations 보기",
      featuredLabel: "Latest article",
      featuredCta: "계속 읽기",
      projectsLabel: "Projects",
      projectsHeading: "지금 다루는 주제와 작업",
      projectsCopy: "출판 흐름, 다국어 운영, 댓글 경험처럼 블로그를 꾸준히 움직이게 하는 작은 시스템을 기록합니다.",
      projects: [
        {
          title: "Multilingual publishing",
          description: "로케일별 포스트 구조를 단순한 파일 기반으로 유지하며, 번역과 공개 흐름을 가볍게 다룹니다.",
        },
        {
          title: "Reader discussion",
          description: "글마다 이어지는 댓글 흐름을 분리하지 않고, 하나의 대화처럼 정리하는 방식을 실험합니다.",
        },
        {
          title: "Solo operations",
          description: "혼자 운영해도 유지 가능한 관리 화면, 게시 절차, 배포 리듬을 가능한 단순하게 다듬습니다.",
        },
      ],
      recentLabel: "Inspirations",
      recentHeading: "최근에 남긴 글",
      recentCopy: "짧은 실험부터 운영 메모까지, 최근 업데이트를 한눈에 훑을 수 있는 촘촘한 아카이브입니다.",
    },
    blogIndex: {
      eyebrow: "Blog",
      heading: "전체 글",
      intro: "최근 기록과 실험, 운영 메모를 한곳에서 읽을 수 있는 로케일별 아카이브입니다.",
    },
      post: {
        backToBlog: "블로그 목록으로 돌아가기",
        readMoreLabel: "포스트 읽기",
        sidebarTitle: "Article details",
        sidebarCopy: "같은 글은 여러 로케일로 이어지고, 독자 대화는 하나의 스레드로 정리됩니다.",
        localeLabel: "현재 로케일",
        commentsHeading: "댓글",
        commentsCountLabel: "개의 댓글",
       commentsEmpty: "아직 댓글이 없습니다.",
       commentFormHeading: "댓글 남기기",
       commentFormCopy: "퀴즈 검증을 통과하면 댓글을 저장할 수 있습니다. 수정/삭제는 댓글 비밀번호로 처리합니다.",
       commentSubmitLabel: "댓글 등록",
       commentAuthorLabel: "이름",
       commentPasswordLabel: "비밀번호",
       commentContentLabel: "댓글",
       replyLabel: "답글",
       editLabel: "수정",
       deleteLabel: "삭제",
       submitEditLabel: "수정 저장",
       submitDeleteLabel: "댓글 삭제",
       parentLabel: "대댓글 작성 중입니다.",
       quizLoading: "퀴즈를 불러오는 중입니다.",
       quizQuestion: "퀴즈 문제",
       quizAnswer: "정답 입력",
        quizVerify: "퀴즈 검증",
        quizVerified: "검증 완료",
        quizUnavailable: "퀴즈 서비스가 준비되지 않았습니다.",
        quizFrontendOnly: "현재 Cloudflare Worker 응답이 없어 프론트 화면만 동작합니다.",
        commentFrontendOnlyNotice: "현재 댓글 저장은 일시적으로 비활성화되어 있습니다. 페이지 탐색과 읽기는 계속 가능합니다.",
        notFoundEyebrow: "Missing post",
       notFoundTitle: "포스트를 찾을 수 없습니다",
       notFoundCopy: "요청한 로케일에 해당 포스트가 없거나 아직 게시되지 않았습니다.",
     },
       adminLogin: {
         eyebrow: "Admin access",
         heading: "관리자 로그인",
         intro: "단일 비밀번호와 서명 쿠키 세션으로 댓글 관리 기능에 접근합니다.",
         passwordLabel: "관리자 비밀번호",
         submitLabel: "로그인",
         helperText: "로그인 후에는 댓글 검수와 차단 관리 기능에 접근합니다.",
       },
     admin: {
       eyebrow: "Admin moderation",
         heading: "댓글 관리",
         intro: "포스트 작성은 로컬 markdown와 Git으로 처리하고, 어드민은 댓글 검수에만 사용합니다.",
       commentsLink: "댓글 검수 화면으로 이동",
     },
    adminComments: {
      eyebrow: "Comment moderation",
      heading: "댓글 검수",
        intro: "canonical slug를 기준으로 모인 댓글을 게시/숨김 상태로 관리합니다.",
        tableHeading: "대기 중인 댓글",
        tableCopy: "댓글은 locale을 공유하지 않고 slug 기준으로 하나의 스레드를 형성합니다.",
        approveLabel: "승인",
        hideLabel: "숨김",
        blacklistIpLabel: "IP 차단",
        ipHashLabel: "IP",
      },
  },
  en: {
    siteName: "Stone & Story",
    siteTagline: "An independent journal for technical notes",
    navigation: {
      label: "Primary navigation",
      home: "Home",
      projects: "Projects",
      blog: "Blog",
      inspirations: "Inspirations",
      admin: "Admin",
      languageLabel: "Language",
      localeNames: {
        ko: "한국어",
        en: "English",
      },
    },
    footer: {
      note: "A small editorial tech blog for product notes, engineering experiments, and operational patterns.",
    },
    home: {
      eyebrow: "Independent publication",
      heading: "A compact tech blog for product experiments and engineering notes",
      intro: "Writing, observations, and implementation details are organized into a publication surface that stays lightweight but deliberate.",
      primaryCta: "Browse blog",
      secondaryCta: "View inspirations",
      featuredLabel: "Latest article",
      featuredCta: "Open article",
      projectsLabel: "Projects",
      projectsHeading: "Current tracks and ongoing work",
      projectsCopy: "The publication focuses on small systems that make the blog sustainable: publishing flow, multilingual structure, and reader discussion.",
      projects: [
        {
          title: "Multilingual publishing",
          description: "Posts stay file-backed and locale-aware so writing can ship in a simple, predictable editorial flow.",
        },
        {
          title: "Reader discussion",
          description: "Comments are treated as part of the reading experience rather than a separate tool surface.",
        },
        {
          title: "Solo operations",
          description: "The stack favors maintainability and low operational cost for a single-editor publication rhythm.",
        },
      ],
      recentLabel: "Inspirations",
      recentHeading: "Latest writing",
      recentCopy: "Recent essays, experiments, and operational notes collected in a tighter editorial archive.",
    },
    blogIndex: {
      eyebrow: "Blog",
      heading: "All writing",
      intro: "A locale-specific archive for recent essays, implementation notes, and observations from the publication.",
    },
      post: {
        backToBlog: "Back to blog index",
        readMoreLabel: "Read post",
        sidebarTitle: "Article details",
        sidebarCopy: "Each article is available across locales, while reader discussion stays connected as one thread.",
        localeLabel: "Current locale",
        commentsHeading: "Comments",
        commentsCountLabel: "comments",
       commentsEmpty: "No comments yet.",
       commentFormHeading: "Leave a comment",
       commentFormCopy: "Pass the quiz first, then submit your comment. The same password is used later for edit and delete actions.",
       commentSubmitLabel: "Submit comment",
       commentAuthorLabel: "Name",
       commentPasswordLabel: "Password",
       commentContentLabel: "Comment",
       replyLabel: "Reply",
       editLabel: "Edit",
       deleteLabel: "Delete",
       submitEditLabel: "Save edit",
       submitDeleteLabel: "Delete comment",
       parentLabel: "You are writing a reply.",
       quizLoading: "Loading quiz challenge.",
       quizQuestion: "Quiz challenge",
       quizAnswer: "Answer",
        quizVerify: "Verify quiz",
        quizVerified: "Verified",
        quizUnavailable: "Quiz verification is not available right now.",
        quizFrontendOnly: "Cloudflare Worker is not responding right now, so the frontend stays available without comment submission.",
        commentFrontendOnlyNotice: "Comment submission is temporarily disabled. Reading and navigation still work normally.",
        notFoundEyebrow: "Missing post",
       notFoundTitle: "The requested post could not be found",
       notFoundCopy: "The requested locale is missing or the post is not published.",
     },
       adminLogin: {
         eyebrow: "Admin access",
         heading: "Admin login",
         intro: "Sign in with a single password to moderate comments.",
         passwordLabel: "Admin password",
         submitLabel: "Sign in",
         helperText: "After login, the admin area focuses on comment moderation and blocking tools.",
       },
     admin: {
       eyebrow: "Admin moderation",
         heading: "Comment moderation",
         intro: "Post authoring happens in local markdown files and Git, while admin stays focused on comment moderation.",
       commentsLink: "Open comment moderation",
     },
    adminComments: {
      eyebrow: "Comment moderation",
      heading: "Comment moderation",
        intro: "A small moderation list for comments grouped by canonical slug.",
        tableHeading: "Queued comments",
        tableCopy: "Use this screen to publish or hide comments after they are written to Supabase.",
        approveLabel: "Approve",
        hideLabel: "Hide",
        blacklistIpLabel: "Block IP",
        ipHashLabel: "IP",
      },
  },
};

export function resolveLocale(locale: string): AppLocale {
  return isSupportedLocale(locale) ? locale : DEFAULT_LOCALE;
}

export function getDictionary(locale: AppLocale): SiteDictionary {
  return dictionaries[locale];
}

export function buildPageTitle(locale: AppLocale, section?: string): string {
  const siteName = getDictionary(locale).siteName;

  return section ? `${section} | ${siteName}` : siteName;
}

export async function resolveRouteParams<T>(params: Promise<T> | T): Promise<T> {
  return Promise.resolve(params);
}
