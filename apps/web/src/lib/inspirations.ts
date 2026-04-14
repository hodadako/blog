import {existsSync} from "node:fs";
import path from "node:path";
import type {AppLocale, InspirationType} from "@/lib/site";

export const INSPIRATION_IMAGE_FILENAME = "icon.png";

export const INSPIRATION_TYPES: ReadonlyArray<InspirationType> = ["book", "article", "film", "exhibition", "anime", "album", "conference"];

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
      ko: "Yorushika",
      en: "Yorushika",
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
      en: "",
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

export function getInspirationsArchive(locale: AppLocale): Array<InspirationArchiveYear> {
  const monthFormatter = new Intl.DateTimeFormat(getLocaleCode(locale), {month: "long"});
  const dateFormatter = new Intl.DateTimeFormat(getLocaleCode(locale), {
    month: locale === "ko" ? "long" : "short",
    day: "numeric",
  });
  const archive: Array<InspirationArchiveYear> = [];

  for (const entry of [...INSPIRATION_ENTRIES].sort((left, right) => right.publishedOn.localeCompare(left.publishedOn))) {
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
