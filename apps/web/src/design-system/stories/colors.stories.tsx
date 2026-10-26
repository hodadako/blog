import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TokenRows } from "./foundation-examples";
const meta = {
  title: "Foundations/Colors",
  component: TokenRows,
  parameters: {
    docs: {
      description: {
        component:
          "tokens.css is the only palette source. Semantic roles respond to the Light/Dark toolbar; do not paste hex values into components. Inspect supporting colors separately from the five core primitives.",
      },
    },
  },
} satisfies Meta<typeof TokenRows>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Semantic: Story = {
  args: {
    names: [
      "--color-bg",
      "--color-surface",
      "--color-surface-muted",
      "--color-text",
      "--color-text-muted",
      "--color-accent",
      "--color-border-strong",
      "--color-danger",
    ],
  },
};
export const Palette: Story = {
  args: {
    names: [
      "--primitive-ink",
      "--primitive-navy",
      "--primitive-blue",
      "--primitive-cyan",
      "--primitive-paper",
    ],
  },
};
