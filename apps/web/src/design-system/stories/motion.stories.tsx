import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui";
const meta = {
  title: "Foundations/Motion",
  parameters: {
    docs: {
      description: {
        component:
          "Hover and active use color transitions with --motion-ui. No hover scale. Respect prefers-reduced-motion. Starry/Snowy and Shooting Stars stay in the production scene and are validated through page regression tests; they are not recreated here.",
      },
    },
  },
} satisfies Meta;
export default meta;
export const Controls: StoryObj = {
  render: () => (
    <div className="catalog-stack">
      <code>transition: color/background/border var(--motion-ui)</code>
      <div className="catalog-row">
        <Button>Hover / Focus</Button>
        <Button variant="outline">Press and hold</Button>
        <Button disabled>Disabled</Button>
      </div>
      <p>
        Tab to inspect the two-pixel focus ring. Enable reduced motion in your
        browser to compare.
      </p>
    </div>
  ),
};
