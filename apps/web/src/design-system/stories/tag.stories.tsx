import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tag } from "@/components/ui";
const meta = {
  title: "Components/Content/Tag",
  component: Tag,
  args: { children: "#Guitar" },
  parameters: {
    docs: {
      description: {
        component:
          "Read-only metadata label, used by Blog cards/articles and quiz categories. This is the existing badge treatment; do not turn it into an unlabelled action or add a competing Badge implementation.",
      },
    },
  },
} satisfies Meta<typeof Tag>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
