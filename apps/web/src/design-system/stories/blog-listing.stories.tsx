import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PostCard } from "@/components/post-card";
import { post } from "./fixtures";
const meta = {
  title: "Patterns/Blog Listing",
  parameters: {
    docs: {
      description: {
        component:
          "Blog List remains the homepage. These are production PostCards with data fixtures, not a second card implementation. The current list uses flat dividers and mobile image hiding.",
      },
    },
  },
} satisfies Meta;
export default meta;
export const Listing: StoryObj = {
  render: () => (
    <main className="page-main blog-index-page">
      <h1 className="sr-only">Blog</h1>
      <PostCard
        locale="ko"
        post={{
          ...post,
          iconUrl: "/images/profile-photo.jpg",
        }}
      />
      <PostCard
        locale="ko"
        post={{
          ...post,
          slug: "notes",
          title: "기록을 이어가는 방법",
          description: "작은 경험을 글로 남깁니다.",
          tags: [],
        }}
      />
    </main>
  ),
};
export const Mobile: StoryObj = {
  ...Listing,
  globals: {
    viewport: {
      value: "mobile",
      isRotated: false,
    },
  },
};
