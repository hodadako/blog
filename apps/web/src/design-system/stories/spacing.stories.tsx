import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TokenRows } from "./foundation-examples";
const meta = {
  title: "Foundations/Spacing",
  component: TokenRows,
  parameters: {
    docs: {
      description: {
        component:
          "Use existing spacing roles. Article reading measure is 44rem; viewport breakpoints remain in production CSS, not a second Storybook layout system.",
      },
    },
  },
} satisfies Meta<typeof TokenRows>;
export default meta;
export const Scale: StoryObj<typeof meta> = {
  args: {
    kind: "spacing",
    names: Array.from({ length: 8 }, (_, i) => `--space-${i + 1}`),
  },
};
