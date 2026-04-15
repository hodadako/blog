import {existsSync} from "node:fs";
import path from "node:path";
import type {AppLocale, InspirationType} from "@/lib/site";

export const INSPIRATION_IMAGE_FILENAME = "icon.png";

export const INSPIRATION_TYPES: ReadonlyArray<InspirationType> = ["book", "article", "film", "exhibition", "anime", "album", "conference"];

export function isInspirationType(value: string): value is InspirationType {
  return INSPIRATION_TYPES.includes(value as InspirationType);
}

interface InspirationEntry {
  id: string;
  publishedOn: string;
  type: InspirationType;
  href: string;
  source: Record<AppLocale, string>;
  title: Record<AppLocale, string>;
  summary: Record<AppLocale, string>;
}

export interface InspirationArchiveItem {
  id: string;
  type: InspirationType;
  href: string;
  source: string;
  title: string;
  summary: string;
  dateLabel: string;
  imageUrl?: string;
}

export interface InspirationArchiveMonth {
  key: string;
  label: string;
  items: Array<InspirationArchiveItem>;
}

export interface InspirationArchiveYear {
  year: string;
  months: Array<InspirationArchiveMonth>;
}

const INSPIRATION_ENTRIES: ReadonlyArray<InspirationEntry> = [
  {
    id: "yorushika-second-person",
    publishedOn: "2026-04-01",
    type: "album",
    href: "https://yorushika.com/discography/detail/70/",
    source: {
      ko: "요루시카",
      en: "yorushika",
    },
    title: {
      ko: "Second Person",
      en: "Second Person",
    },
    summary: {
      ko: "관찰자 시점과 감정의 거리감을 교차시키는 요루시카 특유의 서사 방식이 인상적인 앨범.",
      en: "An album that highlights Yorushika’s narrative style, shifting between observer perspective and emotional distance.",
    },
  },
  {
    id: "chainsawman-reze",
    publishedOn: "2025-09-01",
    type: "film",
    href: "https://chainsawman.dog/movie_reze/",
    source: {
      ko: "후지모토 타츠키",
      en: "Tatsuki Fujimoto",
    },
    title: {
      ko: "극장판 체인소 맨: 레제편",
      en: "Chainsaw Man - The Movie: Reze Arc",
    },
    summary: {
      ko: "사랑과 배신, 인간성과 괴물성 사이의 경계를 강렬하게 그려낸 에피소드.",
      en: "A powerful arc exploring love, betrayal, and the boundary between human and monster.",
    },
  },
  {
    id: "yosigo-miles-to-go",
    publishedOn: "2025-06-06",
    type: "exhibition",
    href: "https://groundseesaw.cafe24.com/product/detail.html?product_no=1313&cate_no=48&display_group=1",
    source: {
      ko: "그라운드시소, YOSIGO",
      en: "GROUNDSEESAW, YOSIGO",
    },
    title: {
      ko: "요시고 사진전: 끝나지 않은 여행",
      en: "YOSIGO: MILES TO GO",
    },
    summary: {
      ko: "따스한 지중해의 빛, 도쿄의 밤, 끝나지 않은 여행을 엿볼 수 있었다.",
      en: "A glimpse into a journey that never ends, through the warm Mediterranean light and the nights of Tokyo.",
    },
  },
  {
    id: "infcon-2024",
    publishedOn: "2024-08-15",
    type: "conference",
    href: "https://www.inflearn.com/conf/infcon-2024/",
    source: {
      ko: "인프런",
      en: "Inflearn",
    },
    title: {
      ko: "인프콘 2024",
      en: "INFCON 2024",
    },
    summary: {
      ko: "실무 중심의 다양한 개발 경험과 고민을 나눈 개발 컨퍼런스.",
      en: "A conference sharing practical engineering experiences and insights.",
    },
  },
  {
    id: "mschf-nothing-is-sacred",
    publishedOn: "2024-03-04",
    type: "exhibition",
    href: "https://www.daelimmuseum.org/exhibition/current/PRG202309220002",
    source: {
      ko: "대림미술관 · MSCHF",
      en: "Daelim Museum · MSCHF",
    },
    title: {
      ko: "MSCHF: NOTHING IS SACRED",
      en: "MSCHF: NOTHING IS SACRED",
    },
    summary: {
      ko: "인터넷 밈, 상업 이미지, 제품 문법을 뒤집는 방식이 얼마나 직접적으로 시선을 끄는지 보여준 전시.",
      en: "An exhibition that shows how aggressively MSCHF flips internet, product, and commercial language into attention-grabbing objects.",
    },
  },
  {
    id: "the-tunnel-to-summer-the-exit-of-goodbyes",
    publishedOn: "2023-09-14",
    type: "anime",
    href: "https://bocchi.rocks",
    source: {
      ko: "타구치 토모히사",
      en: "Tomohisa Taguchi",
    },
    title: {
      ko: "여름을 향한 터널, 이별의 출구",
      en: "The Tunnel to Summer, the Exit of Goodbyes",
    },
    summary: {
      ko: "그 터널에 들어가면, 갖고 싶은 것을 뭐든지 손에 넣을 수 있다.",
      en: "If you enter the tunnel, you can have anything you want.",
    }
  },
  {
    id: "bocchi-the-rock",
    publishedOn: "2023-05-28",
    type: "anime",
    href: "https://bocchi.rocks/",
    source: {
      ko: "하마지 아키",
      en: "Aki Hamazi",
    },
    title: {
      ko: "봇치 더 록!",
      en: "Bocchi the Rock!",
    },
    summary: {
      ko: "불안과 성장, 그리고 음악을 통해 관계를 만들어가는 과정을 섬세하게 풀어낸 작품.",
      en: "A story about anxiety, growth, and building connections through music.",
    },
  },
];

function resolveInspirationsContentDirectory(): string {
  const candidates = [
    path.resolve(process.cwd(), "content/inspirations"),
    path.resolve(process.cwd(), "../../content/inspirations"),
  ];

  const existing = candidates.find((candidate) => existsSync(candidate));
  return existing ?? candidates[0];
}

const inspirationsContentDirectory = resolveInspirationsContentDirectory();

export function buildInspirationImageUrl(id: string): string {
  return `/inspirations/${encodeURIComponent(id)}/${INSPIRATION_IMAGE_FILENAME}`;
}

export function resolveInspirationImageFilePath(id: string): string | null {
  if (path.basename(id) !== id) {
    return null;
  }

  const imagePath = path.join(inspirationsContentDirectory, id, INSPIRATION_IMAGE_FILENAME);
  return existsSync(imagePath) ? imagePath : null;
}

function getLocaleCode(locale: AppLocale): string {
  return locale === "ko" ? "ko-KR" : "en-US";
}

function parseDateParts(value: string): {date: Date; year: string; monthKey: string} {
  const [year, month, day] = value.split("-");
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  return {
    date,
    year,
    monthKey: `${year}-${month}`,
  };
}

export function getInspirationsArchive(locale: AppLocale, type?: InspirationType): Array<InspirationArchiveYear> {
  const monthFormatter = new Intl.DateTimeFormat(getLocaleCode(locale), {month: "long"});
  const dateFormatter = new Intl.DateTimeFormat(getLocaleCode(locale), {
    month: locale === "ko" ? "long" : "short",
    day: "numeric",
  });
  const archive: Array<InspirationArchiveYear> = [];
  const entries = type
    ? INSPIRATION_ENTRIES.filter((entry) => entry.type === type)
    : INSPIRATION_ENTRIES;

  for (const entry of [...entries].sort((left, right) => right.publishedOn.localeCompare(left.publishedOn))) {
    const {date, year, monthKey} = parseDateParts(entry.publishedOn);
    const monthLabel = monthFormatter.format(date);
    const item: InspirationArchiveItem = {
      id: entry.id,
      type: entry.type,
      href: entry.href,
      source: entry.source[locale],
      title: entry.title[locale],
      summary: entry.summary[locale],
      dateLabel: dateFormatter.format(date),
      imageUrl: resolveInspirationImageFilePath(entry.id)
        ? buildInspirationImageUrl(entry.id)
        : undefined,
    };
    const currentYear = archive[archive.length - 1];

    if (!currentYear || currentYear.year !== year) {
      archive.push({
        year,
        months: [
          {
            key: monthKey,
            label: monthLabel,
            items: [item],
          },
        ],
      });
      continue;
    }

    const currentMonth = currentYear.months[currentYear.months.length - 1];

    if (!currentMonth || currentMonth.key !== monthKey) {
      currentYear.months.push({
        key: monthKey,
        label: monthLabel,
        items: [item],
      });
      continue;
    }

    currentMonth.items.push(item);
  }

  return archive;
}
