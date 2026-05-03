export const SUPPORTED_LOCALES = ["ko", "en"] as const;
export const DEFAULT_LOCALE = "ko" as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export type InspirationType = "book" | "article" | "film" | "exhibition" | "anime" | "album" | "conference";

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
    aboutLabel: string;
    aboutHeading: string;
    aboutBody: string;
    aboutFocus: string;
    profilePlaceholder: string;
    profileImageAlt: string;
    primaryCta: string;
    secondaryCta: string;
    featuredLabel: string;
    featuredCta: string;
    projectsLabel: string;
    projectsHeading: string;
    projectsCopy: string;
    projectsCta: string;
    recentLabel: string;
    recentHeading: string;
    recentCopy: string;
  };
  projectsPage: {
    heading: string;
    intro: string;
    activityUnavailableLabel: string;
  };
  inspirationsPage: {
    heading: string;
    intro: string;
    note: string;
    allTypesLabel: string;
    emptyLabel: string;
    yearLabel: string;
    entriesLabel: string;
    yearsStatLabel: string;
    entriesStatLabel: string;
    typesStatLabel: string;
    types: Record<InspirationType, string>;
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
    siteName: "호다코",
    siteTagline: "사라지지 않게, 기록합니다.",
    navigation: {
      label: "주요 탐색",
      home: "홈",
      projects: "Projects",
      blog: "Posts",
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
      heading: "안녕하세요, 호다코입니다.",
      intro: "배우고 만들고 경험한 것을 기록합니다.",
      aboutLabel: "소개",
      aboutHeading: "현재 관심사",
      aboutBody: "기술블로그 비용 최적화, 홈랩 운영하기",
      aboutFocus: "더 많은 기술과 삶에 대한 내용을 최근 글을 통해 확인해보세요!",
      profilePlaceholder: "profile-photo.jpg 파일을 추가하면 사진이 표시됩니다.",
      profileImageAlt: "호다코 프로필 사진",
      primaryCta: "Blog 둘러보기",
      secondaryCta: "Inspirations 보기",
      featuredLabel: "최근 글",
      featuredCta: "포스트 읽기",
      projectsLabel: "Projects",
      projectsHeading: "지금 걸어두는 프로젝트 링크",
      projectsCopy: "확인된 프로젝트만 짧게 남기고, 자세한 맥락은 블로그 글에서 이어갑니다.",
      projectsCta: "Projects 페이지 보기",
      recentLabel: "Inspirations",
      recentHeading: "최근에 남긴 글",
      recentCopy: "짧은 실험부터 운영 메모까지, 최근 업데이트를 한눈에 훑을 수 있는 촘촘한 아카이브입니다.",
    },
    projectsPage: {
      heading: "Projects",
      intro: "현재 확인된 프로젝트 링크만 간단히 모아둔 목록입니다.",
      activityUnavailableLabel: "GitHub 활동 데이터를 지금은 불러오지 못했습니다.",
    },
    inspirationsPage: {
      heading: "Inspirations",
      intro:
        "생각의 흐름과 영감을 주는 경험들을 연도와 월 단위로 차분히 모아둔 아카이브입니다.",
      note:
        "다시 열어보고 싶은 문장, 화면, 공간을 생각하며 기록합니다.",
      allTypesLabel: "전체",
      emptyLabel: "아직 이 분류에 기록된 영감이 없습니다.",
      yearLabel: "연도",
      entriesLabel: "항목",
      yearsStatLabel: "정리한 연도",
      entriesStatLabel: "모아둔 레퍼런스",
      typesStatLabel: "분류",
      types: {
        book: "책",
        article: "아티클",
        film: "영화",
        exhibition: "전시",
        anime: "애니메이션",
        album: "앨범",
        conference: "컨퍼런스",
      },
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
       commentFormCopy: "퀴즈 검증을 통과하거나 토큰을 사용하면 댓글을 작성하실 수 있습니다.",
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
         quizUnavailable: "현재 댓글을 달 수 없습니다.",
         quizFrontendOnly: "현재 댓글을 달 수 없습니다.",
         commentFrontendOnlyNotice: "현재 댓글을 달 수 없습니다.",
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
    siteName: "hodako",
    siteTagline: "write things not to forget",
    navigation: {
      label: "Primary navigation",
      home: "Home",
      projects: "Projects",
      blog: "Posts",
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
      heading: "Hi, I'm hodako",
      intro: "I keep this site as a quiet place to collect what I build, learn, and revisit over time.",
      aboutLabel: "About me",
      aboutHeading: "My Current Interests",
      aboutBody: "Optimizing my tech blog costs, running my homelab cluster.",
      aboutFocus: "Check out my recent posts about more techs and my life!",
      profilePlaceholder: "Add profile-photo.jpg to display your photo here.",
      profileImageAlt: "Profile photo of hodako",
      primaryCta: "Browse blog",
      secondaryCta: "View inspirations",
      featuredLabel: "Latest post",
      featuredCta: "Open article",
      projectsLabel: "Projects",
      projectsHeading: "Current project links",
      projectsCopy: "Only confirmed projects are listed here for now, with fuller context left to blog posts.",
      projectsCta: "Open Projects page",
      recentLabel: "Inspirations",
      recentHeading: "Latest writing",
      recentCopy: "Recent essays, experiments, and operational notes collected in a tighter editorial archive.",
    },
    projectsPage: {
      heading: "Projects",
      intro: "A minimal list of currently confirmed project links.",
      activityUnavailableLabel: "GitHub activity data is temporarily unavailable.",
    },
    inspirationsPage: {
      heading: "Inspirations",
      intro:
        "A quiet archive of books, essays, films, and exhibitions that keep nudging how I design, write, and build.",
      note:
        "Instead of aiming for a finished canon, I keep track of the moods, structures, and editorial cues I return to over time. It is a slow, hand-curated reference shelf for ongoing work.",
      allTypesLabel: "All",
      emptyLabel: "No inspirations have been logged for this type yet.",
      yearLabel: "Year",
      entriesLabel: "entries",
      yearsStatLabel: "Years tracked",
      entriesStatLabel: "References logged",
      typesStatLabel: "Types",
      types: {
        book: "Book",
        article: "Article",
        film: "Film",
        exhibition: "Exhibition",
        anime: "Anime",
        album: "Album",
        conference: "Conference",
      },
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
       commentFormCopy: "You can leave your comment by either passing the quiz or using password token",
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
         quizUnavailable: "Comments are currently unavailable.",
         quizFrontendOnly: "Comments are currently unavailable.",
         commentFrontendOnlyNotice: "Comments are currently unavailable.",
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
