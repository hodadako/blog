import type { IframeHTMLAttributes, ImgHTMLAttributes } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import {CodeBlock} from "@/components/code-block";

type TrustedIframeProps = Pick<IframeHTMLAttributes<HTMLIFrameElement>, "allow" | "allowFullScreen" | "loading" | "referrerPolicy" | "src" | "title">;
type TrustedImageProps = Pick<ImgHTMLAttributes<HTMLImageElement>, "alt" | "height" | "loading" | "referrerPolicy" | "src" | "title" | "width">;

type MarkdownSegment =
  | { type: "markdown"; content: string }
  | { type: "iframe"; props: TrustedIframeProps }
  | { type: "image"; props: TrustedImageProps };

const EMBED_PATTERN = /<iframe\b([\s\S]*?)>\s*<\/iframe>|<img\b([\s\S]*?)\/?>/gi;
const HTML_ATTRIBUTE_PATTERN = /([a-zA-Z][\w:-]*)(?:=(["'])(.*?)\2)?/g;
const TRUSTED_YOUTUBE_HOSTNAMES = new Set([
  "youtube.com",
  "www.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);
const PLAIN_TEXT_LANGUAGE = "text";

function getLoadingBehavior(value: string | undefined): "eager" | "lazy" {
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

function parseHtmlAttributes(attributes: string): Map<string, string> {
  const values = new Map<string, string>();

  for (const match of attributes.matchAll(HTML_ATTRIBUTE_PATTERN)) {
    const attributeName = match[1]?.toLowerCase();
    const attributeValue = match[3];

    if (!attributeName || !attributeValue) {
      continue;
    }

    values.set(attributeName, attributeValue);
  }

  return values;
}

function isTrustedYouTubeEmbed(src: string): boolean {
  try {
    const url = new URL(src);
    return TRUSTED_YOUTUBE_HOSTNAMES.has(url.hostname) && url.pathname.startsWith("/embed/");
  } catch {
    return false;
  }
}

function isTrustedImageSource(src: string): boolean {
  const trimmedSource = src.trim();

  if (!trimmedSource) {
    return false;
  }

  try {
    const url = new URL(trimmedSource);
    return url.protocol === "https:";
  } catch {
    const normalizedSource = trimmedSource.toLowerCase();

    if (
      normalizedSource.startsWith("javascript:") ||
      normalizedSource.startsWith("data:") ||
      normalizedSource.startsWith("vbscript:")
    ) {
      return false;
    }

    return true;
  }
}

function parseDimension(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return undefined;
  }

  return parsedValue;
}

function parseTrustedIframe(attributes: string): TrustedIframeProps | null {
  const values = parseHtmlAttributes(attributes);
  const allowFullScreen = /\ballowfullscreen\b/i.test(attributes);
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

function parseTrustedImage(attributes: string): TrustedImageProps | null {
  const values = parseHtmlAttributes(attributes);
  const src = values.get("src");

  if (!src || !isTrustedImageSource(src)) {
    return null;
  }

  return {
    alt: values.get("alt") ?? "",
    height: parseDimension(values.get("height")),
    loading: getLoadingBehavior(values.get("loading")),
    referrerPolicy: getReferrerPolicy(values.get("referrerpolicy")),
    src,
    title: values.get("title"),
    width: parseDimension(values.get("width")),
  };
}

function getMarkdownSegments(content: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(EMBED_PATTERN)) {
    const rawMarkup = match[0];
    const iframeAttributes = match[1];
    const imageAttributes = match[2];
    const startIndex = match.index ?? 0;
    const precedingMarkdown = content.slice(lastIndex, startIndex);

    if (precedingMarkdown.trim()) {
      segments.push({type: "markdown", content: precedingMarkdown});
    }

    if (iframeAttributes !== undefined) {
      const iframeProps = parseTrustedIframe(iframeAttributes);

      if (iframeProps) {
        segments.push({type: "iframe", props: iframeProps});
      } else {
        segments.push({type: "markdown", content: rawMarkup});
      }
    } else if (imageAttributes !== undefined) {
      const imageProps = parseTrustedImage(imageAttributes);

      if (imageProps) {
        segments.push({type: "image", props: imageProps});
      } else {
        segments.push({type: "markdown", content: rawMarkup});
      }
    }

    lastIndex = startIndex + rawMarkup.length;
  }

  const remainingMarkdown = content.slice(lastIndex);

  if (remainingMarkdown.trim() || segments.length === 0) {
    segments.push({type: "markdown", content: remainingMarkdown});
  }

  return segments;
}

function getCodeLanguage(className: string | undefined): string | null {
  const match = className?.match(/language-([\w-]+)/);
  return match?.[1] ?? null;
}

export function MarkdownArticle({content}: {content: string}) {
  const segments = getMarkdownSegments(content);

  return (
    <div className="detail-content markdown-body">
      {segments.map((segment, index) => {
        if (segment.type === "iframe") {
          return (
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
          );
        }

        if (segment.type === "image") {
          return (
            <img
              alt={segment.props.alt}
              height={segment.props.height}
              key={`image-${index}`}
              loading={segment.props.loading}
              referrerPolicy={segment.props.referrerPolicy}
              src={segment.props.src}
              title={segment.props.title}
              width={segment.props.width}
            />
          );
        }

        return (
          <ReactMarkdown
            components={{
              code(props) {
                const {children, className, ...restProps} = props;
                const code = String(children).replace(/\n$/, "");
                const isBlockCode = className !== undefined || code.includes("\n");

                if (!isBlockCode) {
                  return (
                    <code {...restProps} className={className}>
                      {children}
                    </code>
                  );
                }

                return <CodeBlock code={code} language={getCodeLanguage(className) ?? PLAIN_TEXT_LANGUAGE} />;
              },
              pre({children}) {
                return <>{children}</>;
              },
            }}
            key={`markdown-${index}`}
            rehypePlugins={[rehypeSlug, rehypeAutolinkHeadings]}
            remarkPlugins={[remarkGfm]}
          >
            {segment.content}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}
