import type {AppLocale} from "@/lib/site";

export interface ProjectLink {
  title: string;
  description: string;
  href: string;
  period: string;
}

const projectsByLocale: Record<AppLocale, ProjectLink[]> = {
  ko: [
    {
      title: "원티드 매니저",
      description: "원티드 채용 목록을 관리하기 편하게 정리한 도구입니다.",
      href: "https://github.com/hodadako/wanted-manager",
      period: "2026.03 ~",
    },
    {
      title: "Blue Archive Voice Downloader",
      description: "블루 아카이브 음성 리소스를 내려받기 쉽게 정리한 도구입니다.",
      href: "https://github.com/hodadako/blue-archive-voice-downloader",
      period: "2026.02 ~",
    },
    {
      title: "Mercury",
      description: "DNA sequence와 text/binary 표현 사이를 번역하는 오픈소스 Java 라이브러리입니다.",
      href: "https://github.com/hodadako/mercury",
      period: "2025.06 ~",
    },
  ],
  en: [
    {
      title: "Wanted Manager",
      description: "A tool for organizing 원티드 job listings more easily.",
      href: "https://github.com/hodadako/wanted-manager",
      period: "2026.03 ~",
    },
    {
      title: "Blue Archive Voice Downloader",
      description: "A tool for organizing and downloading Blue Archive voice assets.",
      href: "https://github.com/hodadako/blue-archive-voice-downloader",
      period: "2026.02 ~",
    },
    {
      title: "Mercury",
      description: "An open-source Java library for translating between DNA sequences and text/binary representations.",
      href: "https://github.com/hodadako/mercury",
      period: "2025.06 ~",
    },
  ],
};

export function getProjects(locale: AppLocale): ProjectLink[] {
  return projectsByLocale[locale];
}
