import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TokenRows } from "./foundation-examples";
const meta = {
  title: "Foundations/Radius",
  component: TokenRows,
  parameters: {
    docs: {
      description: {
        component:
          "Controls use --button-radius. Small radius is reserved for chord notation; pill is a token for existing labels, not a new button shape. Borders use --border-width; shadows are reserved for overlays.",
      },
    },
  },
} satisfies Meta<typeof TokenRows>;
export default meta;
export const Roles: StoryObj<typeof meta> = {
  args: {
    kind: "radius",
    names: ["--radius-sm", "--button-radius", "--radius-lg", "--radius-pill"],
  },
};
