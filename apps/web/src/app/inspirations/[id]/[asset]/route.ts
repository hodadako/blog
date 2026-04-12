import {promises as fs} from "node:fs";
import {INSPIRATION_IMAGE_FILENAME, resolveInspirationImageFilePath} from "@/lib/inspirations";

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

  const image = await fs.readFile(imagePath);

  return new Response(image, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/png",
    },
  });
}
