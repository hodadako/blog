import { promises as fs } from "node:fs";
import { POST_ICON_FILENAME, resolvePostIconFilePath } from "@/lib/content";

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

  const icon = await fs.readFile(iconPath);

  return new Response(icon, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": "image/png",
    },
  });
}
