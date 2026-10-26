import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArticleReading } from "@/components/article-reading";
import { MarkdownArticle } from "@/lib/markdown";
import { post, article } from "./fixtures";
const meta = {
  title: "Patterns/Article",
  component: ArticleReading,
  args: {
    post,
    children: <MarkdownArticle content={article} locale="ko" />,
  },
  decorators: [
    (Story) => (
      <main className="page-main blog-post-page">
        <Story />
      </main>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "The production ArticleReading layout and Markdown renderer, extracted from the server route without changing markup. Server loading, translations and comments stay in the route. The reading measure is still 44rem; the opaque reading surface and typography remain unchanged.",
      },
    },
  },
} satisfies Meta<typeof ArticleReading>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Reading: Story = {};
export const LongTitle: Story = {
  args: {
    post: {
      ...post,
      title:
        "기존 웹사이트의 정체성을 유지하며 공통 컴포넌트를 하나의 코드 기반 디자인 시스템으로 정리하는 방법",
    },
  },
};
export const Dark: Story = { globals: { theme: "dark" } };
export const Mobile: Story = {
  globals: {
    viewport: {
      value: "mobile",
      isRotated: false,
    },
  },
};
