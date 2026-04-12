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
      title: "Mercury",
      description: "DNA sequence와 text/binary 표현 사이를 번역하는 오픈소스 Java 라이브러리입니다.",
      href: "https://github.com/hodadako/mercury",
      period: "2025.06 - 2025.07",
    },
  ],
  en: [
    {
      title: "Mercury",
      description: "An open-source Java library for translating between DNA sequences and text/binary representations.",
      href: "https://github.com/hodadako/mercury",
      period: "Jun 2025 - Jul 2025",
    },
  ],
};

export function getProjects(locale: AppLocale): ProjectLink[] {
  return projectsByLocale[locale];
}
