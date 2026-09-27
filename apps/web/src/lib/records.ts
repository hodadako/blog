import {existsSync} from "node:fs";
import path from "node:path";
import type {AppLocale, RecordType} from "@/lib/site";

export const RECORD_IMAGE_FILENAME = "icon.png";

export const RECORD_TYPES: ReadonlyArray<RecordType> = ["book", "article", "film", "exhibition", "anime", "album", "conference"];

export function isRecordType(value: string): value is RecordType {
  return RECORD_TYPES.includes(value as RecordType);
}

interface RecordEntry {
  id: string;
  publishedOn: string;
  type: RecordType;
  href: string;
  source: Record<AppLocale, string>;
  title: Record<AppLocale, string>;
  summary: Record<AppLocale, string>;
}

export interface RecordItem {
  id: string;
  type: RecordType;
  publishedOn: string;
  href: string;
  source: string;
  title: string;
  summary: string;
  imageUrl?: string;
}

const RECORD_ENTRIES: ReadonlyArray<RecordEntry> = [
  {
    id: "the-book-for",
    publishedOn: "2026-06-26",
    type: "album",
    href: "https://namu.wiki/w/THE%20BOOK%20for%2C",
    source: {
      ko: "요아소비",
      en: "YOASOBI",
    },
    title: {
      ko: "THE BOOK for,",
      en: "THE BOOK for,",
    },
    summary: {
      ko: "‘읽는 CD’ 콘셉트의 THE BOOK 시리즈를 마무리하며, 지금까지 마주한 이야기와 앞으로 이어질 서사를 12곡에 담은 EP.",
      en: "A 12-track EP that closes the read-along THE BOOK series while carrying YOASOBI’s stories forward.",
    },
  },
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
    href: "https://natsuton.com/",
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

function resolveRecordsContentDirectory(): string {
  const candidates = [
    path.resolve(process.cwd(), "content/records"),
    path.resolve(process.cwd(), "../../content/records"),
  ];

  const existing = candidates.find((candidate) => existsSync(candidate));
  return existing ?? candidates[0];
}

const recordsContentDirectory = resolveRecordsContentDirectory();

export function buildRecordImageUrl(id: string): string {
  return `/records/${encodeURIComponent(id)}/${RECORD_IMAGE_FILENAME}`;
}

export function resolveRecordImageFilePath(id: string): string | null {
  if (path.basename(id) !== id) {
    return null;
  }

  const imagePath = path.join(recordsContentDirectory, id, RECORD_IMAGE_FILENAME);
  return existsSync(imagePath) ? imagePath : null;
}

export function getRecordsCollection(locale: AppLocale, type?: RecordType): Array<RecordItem> {
  const entries = type
    ? RECORD_ENTRIES.filter((entry) => entry.type === type)
    : RECORD_ENTRIES;

  return [...entries]
    .sort((left, right) => right.publishedOn.localeCompare(left.publishedOn))
    .map((entry) => ({
      id: entry.id,
      type: entry.type,
      publishedOn: entry.publishedOn,
      href: entry.href,
      source: entry.source[locale],
      title: entry.title[locale],
      summary: entry.summary[locale],
      imageUrl: resolveRecordImageFilePath(entry.id)
        ? buildRecordImageUrl(entry.id)
        : undefined,
    }));
}
