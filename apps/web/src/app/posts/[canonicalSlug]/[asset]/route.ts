import { promises as fs } from "node:fs";
import { POST_ICON_FILENAME, resolvePostIconFilePath } from "@/lib/content";

const postIconCache = new Map<string, Promise<Buffer>>();

function readCachedPostIcon(iconPath: string): Promise<Buffer> {
  const existing = postIconCache.get(iconPath);

  if (existing) {
    return existing;
  }

  const next = fs.readFile(iconPath).catch((error) => {
    postIconCache.delete(iconPath);
    throw error;
  });

  postIconCache.set(iconPath, next);
  return next;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ canonicalSlug: string; asset: string }> },
): Promise<Response> {
  const params = await context.params;

  if (params.asset !== POST_ICON_FILENAME) {
    return new Response(null, { status: 404 });
  }

  const iconPath = resolvePostIconFilePath(params.canonicalSlug);

  if (!iconPath) {
    return new Response(null, { status: 404 });
  }

  const icon = await readCachedPostIcon(iconPath);

  return new Response(new Uint8Array(icon), {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/png",
    },
  });
}
