import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FontToggle } from "@/components/font-toggle";
const meta = {
  title: "Foundations/Typography",
  parameters: {
    docs: {
      description: {
        component:
          "Production globals.css loads the original Gyeonggi fonts and Pretendard. Keep the Blog Korean Title alias, wordmark, font toggle and 44rem reading width. Font weights and responsive title sizing come from production CSS.",
      },
    },
  },
} satisfies Meta;
export default meta;
export const Specimen: StoryObj = {
  render: () => (
    <div className="catalog-stack catalog-measure">
      <strong className="brand-lockup__title">호다코</strong>
      <h1 className="article-title">생각을 기록하는 공간</h1>
      <p className="article-summary">
        타이포그래피가 콘텐츠의 흐름을 만듭니다.
      </p>
      <p>
        본문과 UI는 기존 서체를 공유합니다. English text and 한국어를 함께
        확인하세요.
      </p>
      <small className="meta-row">2026-10-25 · 5분</small>
      <FontToggle locale="ko" />
    </div>
  ),
};
