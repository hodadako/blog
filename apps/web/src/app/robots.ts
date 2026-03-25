import { env } from "@/lib/env";

export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/ko/admin", "/en/admin"] },
    ],
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
