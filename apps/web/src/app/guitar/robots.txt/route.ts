export const dynamic = "force-static";

export function GET(): Response {
  return new Response([
    "User-agent: *",
    "Allow: /",
    "Disallow: /ko",
    "Disallow: /en",
    "Disallow: /guitar",
    "Disallow: /api",
    "Sitemap: https://guitar.hodako.dev/sitemap.xml",
    "",
  ].join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
