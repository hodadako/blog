import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EmptyState, Tag } from "@/components/ui";
import { PostCard } from "@/components/post-card";
import { post } from "./fixtures";
const meta = {
  title: "Components/Content/PostCard",
  component: PostCard,
  args: {
    locale: "ko",
    post,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Production flat divider card with a single navigable surface. Tags are read-only labels, not buttons. Keep mobile image rules and article metadata. Do not add card shadows, floating hover or duplicate Badge styles.",
      },
    },
  },
} satisfies Meta<typeof PostCard>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const WithImage: StoryObj<typeof meta> = {
  args: {
    post: {
      ...post,
      iconUrl: "/images/profile-photo.jpg",
    },
  },
};
export const Mobile: StoryObj<typeof meta> = {
  ...WithImage,
  globals: {
    viewport: {
      value: "mobile",
      isRotated: false,
    },
  },
};
export const TagsAndEmptyStates: StoryObj<typeof meta> = {
  render: () => (
    <div className="catalog-stack">
      <div className="tag-list">
        <Tag>#Spring</Tag>
        <Tag>#Guitar</Tag>
      </div>
      <EmptyState>검색 결과가 없습니다.</EmptyState>
      <EmptyState appearance="panel" role="status">
        아직 댓글이 없습니다.
      </EmptyState>
    </div>
  ),
};
