import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { SongReader } from "@/features/guitar/components/song-reader";
import styles from "@/app/guitar/guitar.module.css";
import { songDocument } from "./fixtures";
const meta = {
  title: "Patterns/Guitar Controls",
  component: SongReader,
  args: {
    title: "연주 연습",
    artist: "Hodako",
    keyName: "C",
    sourceCapo: 0,
    slug: "storybook-practice",
    document: songDocument,
    backHref: "/guitar/songs",
    readings: {
      segments: {},
      english: {},
    },
  },
  decorators: [
    (Story) => (
      <div className={styles.shell}>
        <main className={styles.main}>
          <Story />
        </main>
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Production SongReader includes transpose, capo, font size, autoscroll, lyrics, presets, chord controls and song navigation. Settings remain sticky on desktop and collapsible on mobile; the 16px scroll clearance is preserved. Score notation is not restyled as generic buttons.",
      },
    },
  },
} satisfies Meta<typeof SongReader>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Workspace: Story = {};
export const Dark: Story = { globals: { theme: "dark" } };
export const Mobile: Story = {
  globals: {
    viewport: {
      value: "mobile",
      isRotated: false,
    },
  },
};
export const AdjustAndInspect: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement),
      body = within(canvasElement.ownerDocument.body);
    const toggle = canvas.queryByRole("button", { name: "악보 설정 열기" });
    if (toggle) await userEvent.click(toggle);
    await userEvent.click(canvas.getByRole("button", { name: "한 음 높이기" }));
    await expect(
      canvas.getByRole("button", { name: "+1 · 조옮김 원복" }),
    ).toBeEnabled();
    const capo = canvas.getByRole("combobox", { name: "카포 위치" });
    await userEvent.click(capo);
    await userEvent.click(await body.findByRole("option", { name: "2프렛" }));
    await expect(capo).toHaveTextContent("2프렛");
    await userEvent.click(
      canvas.getByRole("button", { name: "곡 설정 초기화" }),
    );
    const chord = canvas.getAllByRole("button", { name: "C 운지법 보기" })[0];
    await userEvent.click(chord);
    await expect(canvas.getByRole("img", { name: "C 운지법" })).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect(
      canvas.queryByRole("button", { name: "운지법 닫기" }),
    ).not.toBeInTheDocument();
  },
};
