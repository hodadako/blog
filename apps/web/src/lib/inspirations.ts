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
    id: "creative-act",
    publishedOn: "2026-03-18",
    type: "book",
    href: "https://www.penguinrandomhouse.com/books/717356/the-creative-act-by-rick-rubin/",
    source: {
      ko: "Rick Rubin · Penguin Random House",
      en: "Rick Rubin · Penguin Random House",
    },
    title: {
      ko: "The Creative Act",
      en: "The Creative Act",
    },
    summary: {
      ko: "완성도를 앞당기기보다 작업의 리듬을 지키는 태도가 왜 중요한지 다시 확인하게 만든 책.",
      en: "A reminder that keeping a creative rhythm often matters more than forcing premature polish.",
    },
  },
  {
    id: "makers-schedule",
    publishedOn: "2026-03-04",
    type: "article",
    href: "https://paulgraham.com/makersschedule.html",
    source: {
      ko: "Paul Graham",
      en: "Paul Graham",
    },
    title: {
      ko: "Maker's Schedule, Manager's Schedule",
      en: "Maker's Schedule, Manager's Schedule",
    },
    summary: {
      ko: "집중이 필요한 제작 시간과 운영 시간이 어떻게 다르게 흘러야 하는지 명확하게 짚어주는 오래된 글.",
      en: "An old but sharp essay about why maker time and coordination time need very different shapes.",
    },
  },
  {
    id: "perfect-days",
    publishedOn: "2026-01-27",
    type: "film",
    href: "https://www.imdb.com/title/tt27503384/",
    source: {
      ko: "Wim Wenders · Perfect Days",
      en: "Wim Wenders · Perfect Days",
    },
    title: {
      ko: "Perfect Days",
      en: "Perfect Days",
    },
    summary: {
      ko: "반복되는 일상 안에서도 화면의 밀도와 여백이 얼마나 조용하게 감정을 만들 수 있는지 보여준 영화.",
      en: "A film that shows how repetition, framing, and quiet gaps can carry emotion without excess.",
    },
  },
  {
    id: "mark-rothko",
    publishedOn: "2025-11-09",
    type: "exhibition",
    href: "https://www.fondationlouisvuitton.fr/en/events/mark-rothko",
    source: {
      ko: "Fondation Louis Vuitton",
      en: "Fondation Louis Vuitton",
    },
    title: {
      ko: "Mark Rothko",
      en: "Mark Rothko",
    },
    summary: {
      ko: "큰 색면이 어떻게 서늘한 긴장과 몰입을 동시에 만드는지 다시 생각하게 한 전시 기록.",
      en: "An exhibition record that keeps pulling me back to how scale and restraint can create deep tension.",
    },
  },
  {
    id: "tyranny-of-structurelessness",
    publishedOn: "2025-11-02",
    type: "article",
    href: "https://www.jofreeman.com/joreen/tyranny.htm",
    source: {
      ko: "Jo Freeman",
      en: "Jo Freeman",
    },
    title: {
      ko: "The Tyranny of Structurelessness",
      en: "The Tyranny of Structurelessness",
    },
    summary: {
      ko: "보이지 않는 규칙이야말로 가장 강한 구조가 될 수 있다는 사실을 팀 운영 관점에서 다시 보게 만든 에세이.",
      en: "A foundational essay on how invisible rules become the strongest structure in collaborative work.",
    },
  },
  {
    id: "yosigo-miles-to-go",
    publishedOn: "2025-06-06",
    type: "exhibition",
    href: "https://groundseesaw.cafe24.com/product/detail.html?product_no=1313&cate_no=48&display_group=1",
    source: {
      ko: "그라운드시소 · 요시고",
      en: "GROUNDSEESAW · YOSIGO",
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
