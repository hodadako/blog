import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { UiLink } from "@/components/ui-link";
import { TextLink } from "@/components/ui";
import { SegmentedControl } from "@/components/segmented-control";
const meta = {
  title: "Components/Navigation/LinksAndSegments",
  parameters: {
    docs: {
      description: {
        component:
          "UiLink uses Next Link; TextLink is a native anchor for external/non-router consumers. Both preserve link semantics. SegmentedControl is required single selection with Radix roving focus. Records tab panels are documented separately. No current breadcrumb or pagination consumer exists.",
      },
    },
  },
} satisfies Meta;
export default meta;
export const Links: StoryObj = {
  render: () => (
    <nav aria-label="예시 탐색" className="catalog-row">
      <UiLink
        href="/ko/blog"
        appearance="button"
        variant="ghost"
        size="sm"
        aria-current="page"
      >
        Posts
      </UiLink>
      <UiLink href="/ko/records" appearance="button" variant="ghost" size="sm">
        Records
      </UiLink>
      <TextLink href="https://github.com/hodadako">GitHub</TextLink>
    </nav>
  ),
};
export const Segments: StoryObj = {
  render: function Segments() {
    const [value, setValue] = useState("all");
    return (
      <SegmentedControl
        aria-label="곡 카테고리"
        options={[
          {
            value: "all",
            label: "모든 곡",
          },
          {
            value: "practice",
            label: "연습",
          },
          {
            value: "unavailable",
            label: "준비 중",
            disabled: true,
          },
        ]}
        value={value}
        onValueChange={setValue}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight} ");
    await expect(canvas.getByRole("radio", { name: "연습" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  },
};
