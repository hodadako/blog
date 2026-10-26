import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { SongSearch } from "@/features/guitar/components/song-search";
import { songs } from "./fixtures";
const meta = {
  title: "Patterns/Guitar Song Navigation",
  component: SongSearch,
  args: {
    songs,
    emptyMessage: "아직 악보가 없습니다.",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Production song search, category selection, reset and whole-row links. Search is an input, category is a required selection, and a song row remains a link.",
      },
    },
  },
} satisfies Meta<typeof SongSearch>;
export default meta;
export const Search: StoryObj<typeof meta> = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole("searchbox"), "없는 곡");
    await expect(canvas.getByRole("status")).toHaveTextContent(
      "검색 결과가 없습니다.",
    );
    await userEvent.click(canvas.getByRole("button", { name: "검색 초기화" }));
    await expect(canvas.getByRole("link", { name: /연주 연습/ })).toBeVisible();
  },
};
export const Empty: StoryObj<typeof meta> = { args: { songs: [] } };
