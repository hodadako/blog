import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkdownArticle } from "./markdown";

describe("embedded YouTube source links", () => {
  it.each(["90", "0"])("preserves the embedded start time %s in the direct video link", (start) => {
    const html = renderToStaticMarkup(createElement(MarkdownArticle, {
      content: `<iframe src="https://www.youtube.com/embed/abc123?start=${start}" title="Video"></iframe>`,
    }));
    expect(html).toContain(`href="https://www.youtube.com/watch?v=abc123&amp;t=${start}"`);
  });

  it.each(["-1", "invalid", ""])("omits an invalid start time %s", (start) => {
    const html = renderToStaticMarkup(createElement(MarkdownArticle, {
      content: `<iframe src="https://www.youtube.com/embed/abc123?start=${start}" title="Video"></iframe>`,
    }));
    expect(html).toContain('href="https://www.youtube.com/watch?v=abc123"');
  });

  it("keeps a direct video link when the embedded player is unavailable", () => {
    const html = renderToStaticMarkup(createElement(MarkdownArticle, {
      locale: "ko",
      content: '<iframe src="https://www.youtube-nocookie.com/embed/abc123" title="영상"></iframe>',
    }));
    expect(html).toContain('href="https://www.youtube.com/watch?v=abc123"');
    expect(html).toContain("YouTube에서 영상 열기");
  });

  it("links a videoseries embed to its original playlist", () => {
    const html = renderToStaticMarkup(createElement(MarkdownArticle, {
      locale: "en",
      content: '<iframe src="https://www.youtube.com/embed/videoseries?list=PL-example" title="Playlist"></iframe>',
    }));
    expect(html).toContain('href="https://www.youtube.com/playlist?list=PL-example"');
    expect(html).not.toContain("watch?v=videoseries");
    expect(html).toContain("Watch on YouTube");
  });
});
