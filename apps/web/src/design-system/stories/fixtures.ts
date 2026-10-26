import type { PostSummary } from "@/lib/types";
import { parseChordPro } from "@/features/guitar/chordpro/parser";
export const post: PostSummary = {
  title: "그래서 나는 Bean Validation을 그만두었다.",
  description: "비즈니스 규칙과 유효성 검증에 대한 고찰",
  publishedAt: "2026-05-21",
  readingTime: "11분",
  tags: ["Spring", "Bean Validation"],
  draft: false,
  locale: "ko",
  slug: "gave-up-bean-validation",
  canonicalSlug: "gave-up-bean-validation",
  availableLocales: ["ko"],
};
export const article =
  "## 읽기 흐름을 지키는 공통 UI\n\n문서와 제품은 같은 컴포넌트를 사용합니다. **명확한 위계**와 [링크의 의미](https://hodako.dev)를 유지합니다.\n\n- 기본 서체와 읽기 폭을 유지합니다.\n- 키보드로 모든 조작에 접근합니다.\n\n> 이 글은 Storybook 검증을 위한 짧은 예시입니다.";
export const songSource =
  "{title: 연주 연습}\n{artist: Hodako}\n{key: C}\n{capo: 0}\n\n{start_of_verse}\n[C]오늘도 [G]천천히\n[Am]코드를 [F]따라가요\n[N.C.]잠시 쉬고 [C]다시 시작해요\n{end_of_verse}";
export const songDocument = parseChordPro(songSource);
export const songs = [
  {
    slug: "practice",
    title: "연주 연습",
    artist: "Hodako",
    key: "C",
    tags: ["연습"],
    normalizedSearchText: "연주 연습 hodako",
  },
];
