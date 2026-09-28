import {promises as fs} from "node:fs";
import {RECORD_IMAGE_FILENAME, resolveRecordImageFilePath} from "@/lib/records";

const recordImageCache = new Map<string, Promise<Buffer>>();

function readCachedRecordImage(imagePath: string, version: string): Promise<Buffer> {
  const cacheKey = `${imagePath}:${version}`;
  const existing = recordImageCache.get(cacheKey);

  if (existing) {
    return existing;
  }

  const next = fs.readFile(imagePath).catch((error) => {
    recordImageCache.delete(cacheKey);
    throw error;
  });

  recordImageCache.set(cacheKey, next);
  return next;
}

export async function GET(
  _request: Request,
  context: {params: Promise<{id: string; asset: string}>},
): Promise<Response> {
  const params = await context.params;

  if (params.asset !== RECORD_IMAGE_FILENAME) {
    return new Response(null, {status: 404});
  }

  const imagePath = resolveRecordImageFilePath(params.id);

  if (!imagePath) {
    return new Response(null, {status: 404});
  }

  const version = new URL(_request.url).searchParams.get("v") ?? "unversioned";
  const image = await readCachedRecordImage(imagePath, version);

  return new Response(new Uint8Array(image), {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/png",
    },
  });
}
