import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { IconButton } from "@/components/ui";
const meta = {
  title: "Components/Actions/IconButton",
  component: IconButton,
  args: {
    "aria-label": "한 음 높이기",
    children: "＋",
    variant: "ghost",
    onClick: fn(),
  },
  parameters: {
    docs: {
      description: {
        component:
          "Always supply an accessible name. Icon-only controls retain the shared 44px target and Button variants. Guitar chord notation is a separate domain control.",
      },
    },
  },
} satisfies Meta<typeof IconButton>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Disabled: StoryObj<typeof meta> = { args: { disabled: true } };
