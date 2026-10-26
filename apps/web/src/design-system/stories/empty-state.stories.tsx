import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EmptyState } from "@/components/ui";
const meta = {
  title: "Components/Content/EmptyState",
  component: EmptyState,
  args: { children: "검색 결과가 없습니다." },
  parameters: {
    docs: {
      description: {
        component:
          "Use plain for inline empty lists and panel for existing boxed form/admin contexts. Dynamic results can use role=status. Avoid adding decorative cards or icons without a user need.",
      },
    },
  },
} satisfies Meta<typeof EmptyState>;
export default meta;
export const Plain: StoryObj<typeof meta> = {};
export const Panel: StoryObj<typeof meta> = {
  args: {
    appearance: "panel",
    role: "status",
  },
};
