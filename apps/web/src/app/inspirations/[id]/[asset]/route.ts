import {promises as fs} from "node:fs";
import {INSPIRATION_IMAGE_FILENAME, resolveInspirationImageFilePath} from "@/lib/inspirations";

const inspirationImageCache = new Map<string, Promise<Buffer>>();

function readCachedInspirationImage(imagePath: string): Promise<Buffer> {
  const existing = inspirationImageCache.get(imagePath);

  if (existing) {
    return existing;
  }

  const next = fs.readFile(imagePath).catch((error) => {
    inspirationImageCache.delete(imagePath);
    throw error;
  });

  inspirationImageCache.set(imagePath, next);
  return next;
}

export async function GET(
  _request: Request,
  context: {params: Promise<{id: string; asset: string}>},
): Promise<Response> {
  const params = await context.params;

  if (params.asset !== INSPIRATION_IMAGE_FILENAME) {
    return new Response(null, {status: 404});
  }

  const imagePath = resolveInspirationImageFilePath(params.id);

  if (!imagePath) {
    return new Response(null, {status: 404});
  }

  const image = await readCachedInspirationImage(imagePath);

  return new Response(new Uint8Array(image), {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/png",
    },
  });
}
