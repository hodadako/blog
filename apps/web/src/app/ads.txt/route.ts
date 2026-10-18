import { getAdsTxt } from "@/lib/ads";

export function GET(): Response {
  const text = getAdsTxt();
  return new Response(text ?? "", {
    status: text ? 200 : 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
