import type { IframeHTMLAttributes } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

type TrustedIframeProps = Pick<IframeHTMLAttributes<HTMLIFrameElement>, "allow" | "allowFullScreen" | "loading" | "referrerPolicy" | "src" | "title">;

type MarkdownSegment =
  | { type: "markdown"; content: string }
  | { type: "iframe"; props: TrustedIframeProps };

const IFRAME_PATTERN = /<iframe\b([\s\S]*?)>\s*<\/iframe>/gi;
const IFRAME_ATTRIBUTE_PATTERN = /([a-zA-Z][\w:-]*)(?:=(['"])(.*?)\2)?/g;
const TRUSTED_YOUTUBE_HOSTNAMES = new Set([
  "youtube.com",
  "www.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

function getLoadingBehavior(value: string | undefined): TrustedIframeProps["loading"] {
  return value === "eager" ? value : "lazy";
}

function getReferrerPolicy(value: string | undefined): TrustedIframeProps["referrerPolicy"] {
  switch (value) {
    case "no-referrer":
    case "no-referrer-when-downgrade":
    case "origin":
    case "origin-when-cross-origin":
    case "same-origin":
    case "strict-origin":
    case "strict-origin-when-cross-origin":
    case "unsafe-url":
      return value;
    default:
      return undefined;
  }
}

function isTrustedYouTubeEmbed(src: string): boolean {
  try {
    const url = new URL(src);
    return TRUSTED_YOUTUBE_HOSTNAMES.has(url.hostname) && url.pathname.startsWith("/embed/");
  } catch {
    return false;
  }
}

function parseTrustedIframe(attributes: string): TrustedIframeProps | null {
  const values = new Map<string, string>();
  let allowFullScreen = false;

  for (const match of attributes.matchAll(IFRAME_ATTRIBUTE_PATTERN)) {
    const attributeName = match[1]?.toLowerCase();
    const attributeValue = match[3];

    if (!attributeName) {
      continue;
    }

    if (attributeName === "allowfullscreen") {
      allowFullScreen = true;
      continue;
    }

    if (attributeValue) {
      values.set(attributeName, attributeValue);
    }
  }

  const src = values.get("src");

  if (!src || !isTrustedYouTubeEmbed(src)) {
    return null;
  }

  return {
    allow: values.get("allow"),
    allowFullScreen,
    loading: getLoadingBehavior(values.get("loading")),
    referrerPolicy: getReferrerPolicy(values.get("referrerpolicy")),
    src,
    title: values.get("title") ?? "Embedded YouTube video",
  };
}

function getMarkdownSegments(content: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(IFRAME_PATTERN)) {
    const iframeMarkup = match[0];
    const iframeAttributes = match[1];
    const startIndex = match.index ?? 0;
    const precedingMarkdown = content.slice(lastIndex, startIndex);

    if (precedingMarkdown.trim()) {
      segments.push({ type: "markdown", content: precedingMarkdown });
    }

    if (iframeMarkup) {
      const iframeProps = parseTrustedIframe(iframeAttributes ?? "");

      if (iframeProps) {
        segments.push({ type: "iframe", props: iframeProps });
      } else {
        segments.push({ type: "markdown", content: iframeMarkup });
      }
    }

    lastIndex = startIndex + iframeMarkup.length;
  }

  const remainingMarkdown = content.slice(lastIndex);

  if (remainingMarkdown.trim() || segments.length === 0) {
    segments.push({ type: "markdown", content: remainingMarkdown });
  }

  return segments;
}

export function MarkdownArticle({ content }: { content: string }) {
  const segments = getMarkdownSegments(content);

  return (
    <div className="detail-content markdown-body">
      {segments.map((segment, index) =>
        segment.type === "iframe" ? (
          <div className="detail-content__embed" key={`iframe-${index}`}>
            <iframe
              allow={segment.props.allow}
              allowFullScreen={segment.props.allowFullScreen}
              loading={segment.props.loading}
              referrerPolicy={segment.props.referrerPolicy}
              src={segment.props.src}
              title={segment.props.title}
            />
          </div>
        ) : (
          <ReactMarkdown key={`markdown-${index}`} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug, rehypeAutolinkHeadings]}>
            {segment.content}
          </ReactMarkdown>
        ),
      )}
    </div>
  );
}
