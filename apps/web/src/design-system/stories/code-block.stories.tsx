import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CodeBlock } from "@/components/code-block";
const meta = {
  title: "Components/Content/CodeBlock",
  component: CodeBlock,
  args: {
    code: "const message = 'Hello, 호다코';",
    language: "typescript",
    locale: "ko",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Production Shiki renderer and copy Button. Clipboard requires a secure context and permission; highlighted markup has a plain-text fallback. Preserve both light/dark syntax themes and feedback.",
      },
    },
  },
} satisfies Meta<typeof CodeBlock>;
export default meta;
export const Highlighted: StoryObj<typeof meta> = {};
export const Dark: StoryObj<typeof meta> = { globals: { theme: "dark" } };
