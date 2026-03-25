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
  sidebarHeading: string;
  commentsLink: string;
  editorEyebrow: string;
  editorHeading: string;
  editorCopy: string;
  fields: {
    slug: string;
    title: string;
    description: string;
    tags: string;
    status: string;
    content: string;
  };
  saveDraftLabel: string;
  publishLabel: string;
}

export interface AdminCommentsCopy {
  eyebrow: string;
  heading: string;
  intro: string;
  tableHeading: string;
  tableCopy: string;
  approveLabel: string;
  hideLabel: string;
}

interface SiteDictionary {
  siteName: string;
  siteTagline: string;
  navigation: {
    label: string;
    home: string;
    blog: string;
    admin: string;
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
    statsLabel: string;
    statsHeading: string;
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
    siteTagline: "낮은 비용으로 운영하는 다국어 블로그",
    navigation: {
      label: "주요 탐색",
      home: "홈",
      blog: "블로그",
      admin: "관리",
    },
    footer: {
      note: "Next App Router 기반 공개 블로그/관리자 스캐폴드입니다.",
    },
    home: {
      eyebrow: "Public blog",
      heading: "언어별 포스트와 최소 운영 UI를 한곳에 담은 블로그",
      intro: "`apps/web` 안에서 공개 블로그, 댓글 입력, 간단한 관리자 편집 화면까지 바로 이어지는 최소 구조를 준비했습니다.",
      primaryCta: "포스트 둘러보기",
      secondaryCta: "관리자 로그인",
      featuredLabel: "대표 포스트",
      featuredCta: "포스트 상세 보기",
      statsLabel: "Current scaffold",
      statsHeading: "바로 연결할 수 있는 핵심 화면",
      recentLabel: "Recent posts",
      recentHeading: "최근 포스트 미리보기",
      recentCopy: "마크다운 읽기, SEO 메타데이터, 댓글 경로 연결을 붙이기 좋은 구조로 시작합니다.",
    },
    blogIndex: {
      eyebrow: "Archive",
      heading: "블로그 목록",
      intro: "로케일별로 분리된 공개 포스트 목록입니다. 이후 `src/lib/**` 헬퍼를 실제 콘텐츠 소스로 교체하면 됩니다.",
    },
     post: {
       backToBlog: "블로그 목록으로 돌아가기",
       readMoreLabel: "포스트 읽기",
       sidebarTitle: "게시 구조",
       sidebarCopy: "상세 페이지는 로컬 markdown를 읽고, 댓글은 canonical slug 기준으로 Supabase에 저장되도록 연결됩니다.",
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
       notFoundEyebrow: "Missing post",
       notFoundTitle: "포스트를 찾을 수 없습니다",
       notFoundCopy: "요청한 로케일에 해당 포스트가 없거나 아직 게시되지 않았습니다.",
     },
      adminLogin: {
        eyebrow: "Admin access",
        heading: "관리자 로그인",
        intro: "단일 비밀번호와 서명 쿠키 세션으로 글 작성과 댓글 관리 기능에 접근합니다.",
        passwordLabel: "관리자 비밀번호",
        submitLabel: "로그인",
        helperText: "로그인 후에는 locale별 markdown 저장과 댓글 검수를 같은 앱에서 처리합니다.",
      },
    admin: {
      eyebrow: "Admin editor",
        heading: "포스트 편집기",
        intro: "GitHub API를 통해 locale별 markdown 파일을 저장하는 단일 관리자 화면입니다.",
      sidebarHeading: "현재 게시물",
      commentsLink: "댓글 검수 화면으로 이동",
      editorEyebrow: "Post draft",
      editorHeading: "포스트 작성/수정",
      editorCopy: "마크다운 저장, 미리보기, 업서트는 이후 서버 액션 또는 API 핸들러에 연결하기 좋게 폼 형태로 열어 두었습니다.",
      fields: {
        slug: "로케일 슬러그",
        title: "제목",
        description: "요약",
        tags: "태그 (쉼표 구분)",
        status: "상태",
        content: "본문",
      },
      saveDraftLabel: "초안 저장",
      publishLabel: "게시하기",
    },
    adminComments: {
      eyebrow: "Comment moderation",
      heading: "댓글 검수",
        intro: "canonical slug를 기준으로 모인 댓글을 게시/숨김 상태로 관리합니다.",
        tableHeading: "대기 중인 댓글",
        tableCopy: "댓글은 locale을 공유하지 않고 slug 기준으로 하나의 스레드를 형성합니다.",
        approveLabel: "승인",
        hideLabel: "숨김",
      },
  },
  en: {
    siteName: "Stone & Story",
    siteTagline: "A low-cost multilingual publishing scaffold",
    navigation: {
      label: "Primary navigation",
      home: "Home",
      blog: "Blog",
      admin: "Admin",
    },
    footer: {
      note: "Next App Router scaffold for a public blog and lightweight admin tools.",
    },
    home: {
      eyebrow: "Public blog",
      heading: "A minimal blog shell for multilingual posts and lightweight operations",
      intro: "The new `apps/web` workspace now includes the public blog, comment entry surface, and a simple admin editor skeleton in one place.",
      primaryCta: "Browse posts",
      secondaryCta: "Admin login",
      featuredLabel: "Featured post",
      featuredCta: "Open article",
      statsLabel: "Current scaffold",
      statsHeading: "Pages ready for real data wiring",
      recentLabel: "Recent posts",
      recentHeading: "Latest entries",
      recentCopy: "This structure is ready for markdown loaders, SEO metadata, and route handlers without adding heavy UI dependencies.",
    },
    blogIndex: {
      eyebrow: "Archive",
      heading: "Blog index",
      intro: "This locale-specific archive is intentionally simple so you can replace the placeholder helpers in `src/lib/**` with real content loaders.",
    },
     post: {
       backToBlog: "Back to blog index",
       readMoreLabel: "Read post",
       sidebarTitle: "Page wiring",
       sidebarCopy: "The article page reads markdown content, while comments are stored by canonical slug in Supabase.",
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
       notFoundEyebrow: "Missing post",
       notFoundTitle: "The requested post could not be found",
       notFoundCopy: "The requested locale is missing or the post is not published.",
     },
      adminLogin: {
        eyebrow: "Admin access",
        heading: "Admin login",
        intro: "Sign in with a single password to write markdown posts and moderate comments.",
        passwordLabel: "Admin password",
        submitLabel: "Sign in",
        helperText: "After login, the admin area writes locale-specific markdown files through the GitHub Contents API.",
      },
    admin: {
      eyebrow: "Admin editor",
        heading: "Post editor",
        intro: "A compact admin surface for locale-aware markdown editing, GitHub commits, and comment moderation links.",
      sidebarHeading: "Current entries",
      commentsLink: "Open comment moderation",
      editorEyebrow: "Post draft",
      editorHeading: "Create or update a post",
      editorCopy: "The form surface is ready for markdown content, save/publish intents, and locale-aware persistence once your server logic is in place.",
      fields: {
        slug: "Locale slug",
        title: "Title",
        description: "Summary",
        tags: "Tags (comma separated)",
        status: "Status",
        content: "Content",
      },
      saveDraftLabel: "Save draft",
      publishLabel: "Publish",
    },
    adminComments: {
      eyebrow: "Comment moderation",
      heading: "Comment moderation",
        intro: "A small moderation list for comments grouped by canonical slug.",
        tableHeading: "Queued comments",
        tableCopy: "Use this screen to publish or hide comments after they are written to Supabase.",
        approveLabel: "Approve",
        hideLabel: "Hide",
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
