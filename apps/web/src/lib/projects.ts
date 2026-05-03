import type {AppLocale} from "@/lib/site";
import {env} from "@/lib/env";
import {cache} from "react";

const GITHUB_API_BASE_URL = "https://api.github.com";
const GITHUB_REVALIDATE_SECONDS = 60 * 60 * 12;
const ACTIVITY_WEEKS = 18;
const ACTIVITY_DAYS = ACTIVITY_WEEKS * 7;
const COMMITS_PER_PAGE = 100;
const MAX_COMMIT_PAGES = 3;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export interface ProjectRepository {
  owner: string;
  name: string;
}

export interface ProjectLink {
  title: string;
  description: string;
  href: string;
  startedAt: string;
  period: string;
  repository: ProjectRepository;
}

export interface ProjectActivityDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ProjectActivitySummary {
  days: ProjectActivityDay[];
  totalCommits: number;
  activeDays: number;
  primaryLanguage: string | null;
  lastPushedAt: string | null;
  status: "available" | "unavailable";
  weeks: number;
}

export interface ProjectLinkWithActivity extends ProjectLink {
  activity: ProjectActivitySummary;
}

interface GitHubRepositoryResponse {
  language: string | null;
  pushed_at: string | null;
}

interface GitHubCommitActivityWeek {
  days: number[];
  total: number;
  week: number;
}

interface GitHubCommitResponse {
  commit: {
    author: {
      date: string | null;
    } | null;
    committer: {
      date: string | null;
    } | null;
  };
}

const projectsByLocale: Record<AppLocale, ProjectLink[]> = {
  ko: [
    {
      title: "원티드 매니저",
      description: "원티드 채용 목록을 관리하기 편하게 정리한 도구입니다.",
      href: "https://github.com/hodadako/wanted-manager",
      startedAt: "2026-03",
      period: "2026.03 ~",
      repository: {
        owner: "hodadako",
        name: "wanted-manager",
      },
    },
    {
      title: "Blue Archive Voice Downloader",
      description: "블루 아카이브 음성 리소스를 내려받기 쉽게 정리한 도구입니다.",
      href: "https://github.com/hodadako/blue-archive-voice-downloader",
      startedAt: "2026-02",
      period: "2026.02 ~",
      repository: {
        owner: "hodadako",
        name: "blue-archive-voice-downloader",
      },
    },
    {
      title: "Mercury",
      description: "DNA sequence와 text/binary 표현 사이를 번역하는 오픈소스 Java 라이브러리입니다.",
      href: "https://github.com/hodadako/mercury",
      startedAt: "2025-06",
      period: "2025.06 ~",
      repository: {
        owner: "hodadako",
        name: "mercury",
      },
    },
    {
      title: "k-univ-mcp",
      description: "한국 대학(원) 시간표 데이터를 CLI, 파일 export, MCP 서버 형태로 다룰 수 있게 만든 Python 프로젝트입니다.",
      href: "https://github.com/hodadako/k-univ-mcp",
      startedAt: "2026-04",
      period: "2026.04 ~",
      repository: {
        owner: "hodadako",
        name: "k-univ-mcp",
      },
    },
  ],
  en: [
    {
      title: "Wanted Manager",
      description: "A tool for organizing 원티드 job listings more easily.",
      href: "https://github.com/hodadako/wanted-manager",
      startedAt: "2026-03",
      period: "2026.03 ~",
      repository: {
        owner: "hodadako",
        name: "wanted-manager",
      },
    },
    {
      title: "Blue Archive Voice Downloader",
      description: "A tool for organizing and downloading Blue Archive voice assets.",
      href: "https://github.com/hodadako/blue-archive-voice-downloader",
      startedAt: "2026-02",
      period: "2026.02 ~",
      repository: {
        owner: "hodadako",
        name: "blue-archive-voice-downloader",
      },
    },
    {
      title: "Mercury",
      description: "An open-source Java library for translating between DNA sequences and text/binary representations.",
      href: "https://github.com/hodadako/mercury",
      startedAt: "2025-06",
      period: "2025.06 ~",
      repository: {
        owner: "hodadako",
        name: "mercury",
      },
    },
    {
      title: "k-univ-mcp",
      description: "A Python project that exposes Korean university timetable data through a CLI, file exports, and an MCP server.",
      href: "https://github.com/hodadako/k-univ-mcp",
      startedAt: "2026-04",
      period: "2026.04 ~",
      repository: {
        owner: "hodadako",
        name: "k-univ-mcp",
      },
    },
  ],
};

export function getProjects(locale: AppLocale): ProjectLink[] {
  return [...projectsByLocale[locale]].sort((left, right) => right.startedAt.localeCompare(left.startedAt));
}

export async function getProjectsWithActivity(locale: AppLocale): Promise<ProjectLinkWithActivity[]> {
  const projects = getProjects(locale);

  return Promise.all(
    projects.map(async (project) => ({
      ...project,
      activity: await getProjectActivity(project.repository),
    })),
  );
}

const getProjectActivity = cache(async (repository: ProjectRepository): Promise<ProjectActivitySummary> => {
  const [repoInfo, commitActivity, fallbackActivity] = await Promise.all([
    fetchGitHubJson<GitHubRepositoryResponse>(`/repos/${repository.owner}/${repository.name}`),
    fetchGitHubJson<GitHubCommitActivityWeek[]>(`/repos/${repository.owner}/${repository.name}/stats/commit_activity`),
    fetchCommitDates(repository),
  ]);

  const countsByDate = new Map<string, number>();

  if (commitActivity !== null) {
    for (const week of commitActivity.slice(-ACTIVITY_WEEKS)) {
      for (let dayIndex = 0; dayIndex < week.days.length; dayIndex += 1) {
        const count = week.days[dayIndex];

        if (count === 0) {
          continue;
        }

        const dateKey = new Date((week.week + dayIndex * 24 * 60 * 60) * 1000).toISOString().slice(0, 10);
        countsByDate.set(dateKey, count);
      }
    }
  }

  if (countsByDate.size === 0) {
    for (const commitDate of fallbackActivity) {
      countsByDate.set(commitDate, (countsByDate.get(commitDate) ?? 0) + 1);
    }
  }

  const status = repoInfo === null && commitActivity === null && fallbackActivity.length === 0 ? "unavailable" : "available";

  return buildActivitySummary(countsByDate, repoInfo, status);
});

async function fetchCommitDates(repository: ProjectRepository): Promise<string[]> {
  const since = new Date(Date.now() - (ACTIVITY_DAYS - 1) * DAY_IN_MS).toISOString();
  const dates: string[] = [];

  for (let page = 1; page <= MAX_COMMIT_PAGES; page += 1) {
    const searchParams = new URLSearchParams({
      per_page: String(COMMITS_PER_PAGE),
      page: String(page),
      since,
    });

    const commits = await fetchGitHubJson<GitHubCommitResponse[]>(
      `/repos/${repository.owner}/${repository.name}/commits`,
      searchParams,
    );

    if (commits === null || commits.length === 0) {
      break;
    }

    for (const commit of commits) {
      const commitDate = commit.commit.author?.date ?? commit.commit.committer?.date;

      if (typeof commitDate === "string") {
        dates.push(commitDate.slice(0, 10));
      }
    }

    if (commits.length < COMMITS_PER_PAGE) {
      break;
    }
  }

  return dates;
}

async function fetchGitHubJson<T>(pathname: string, searchParams?: URLSearchParams): Promise<T | null> {
  const url = new URL(`${GITHUB_API_BASE_URL}${pathname}`);

  if (searchParams !== undefined) {
    url.search = searchParams.toString();
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "hodako-blog-projects-page",
      ...(env.githubToken ? {Authorization: `Bearer ${env.githubToken}`} : {}),
    },
    next: {
      revalidate: GITHUB_REVALIDATE_SECONDS,
    },
  });

  if (response.status === 202 || response.status === 204 || !response.ok) {
    return null;
  }

  return (await response.json()) as T;
}

function buildActivitySummary(
  countsByDate: Map<string, number>,
  repoInfo: GitHubRepositoryResponse | null,
  status: "available" | "unavailable",
): ProjectActivitySummary {
  const days = Array.from({length: ACTIVITY_DAYS}, (_, index) => {
    const date = new Date(Date.now() - (ACTIVITY_DAYS - index - 1) * DAY_IN_MS);
    return date.toISOString().slice(0, 10);
  });
  const maxCount = Math.max(...days.map((day) => countsByDate.get(day) ?? 0), 0);

  const activityDays = days.map((date) => {
    const count = countsByDate.get(date) ?? 0;

    return {
      date,
      count,
      level: getActivityLevel(count, maxCount),
    } satisfies ProjectActivityDay;
  });

  const totalCommits = activityDays.reduce((sum, day) => sum + day.count, 0);
  const activeDays = activityDays.filter((day) => day.count > 0).length;

  return {
    days: activityDays,
    totalCommits,
    activeDays,
    primaryLanguage: repoInfo?.language ?? null,
    lastPushedAt: repoInfo?.pushed_at ?? null,
    status,
    weeks: ACTIVITY_WEEKS,
  };
}

function getActivityLevel(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0 || maxCount === 0) {
    return 0;
  }

  const ratio = count / maxCount;

  if (ratio >= 0.75) {
    return 4;
  }

  if (ratio >= 0.5) {
    return 3;
  }

  if (ratio >= 0.25) {
    return 2;
  }

  return 1;
}
