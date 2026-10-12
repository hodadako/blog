import path from "node:path";

const configuredGuitarHosts = (process.env.GUITAR_HOSTS || "guitar.hodako.dev,guitar.localhost")
  .split(",")
  .map((host) => host.trim().toLowerCase().replace(/:\d+$/, ""))
  .filter(Boolean)
  .map((host) => host.replace(/\./g, "\\."));
const guitarHosts = configuredGuitarHosts.length
  ? configuredGuitarHosts
  : ["guitar\\.hodako\\.dev", "guitar\\.localhost"];
const guitarHostPattern = `^(${guitarHosts.join("|")})(?::\\d+)?$`;
const nonGuitarHost = `^(?!(${guitarHosts.join("|")})(?::\\d+)?$).+$`;
const blogHostOnly = [{ type: "host", value: nonGuitarHost }];
const guitarHostOnly = [{ type: "host", value: guitarHostPattern }];

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  async redirects() {
    return [
      {source: "/:locale(ko|en)/inspirations", destination: "/:locale/records", permanent: true, has: blogHostOnly},
      {source: "/:locale(ko|en)/inspirations/:type", destination: "/:locale/records/:type", permanent: true, has: blogHostOnly},
      {source: "/inspirations", destination: "/records", permanent: true, has: blogHostOnly},
      {source: "/inspirations/:id/:asset", destination: "/records/:id/:asset", permanent: true, has: blogHostOnly},
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/guitar", has: guitarHostOnly },
        { source: "/songs", destination: "/guitar/songs", has: guitarHostOnly },
        { source: "/songs/:slug", destination: "/guitar/songs/:slug", has: guitarHostOnly },
        { source: "/sitemap.xml", destination: "/guitar/sitemap.xml", has: guitarHostOnly },
        { source: "/robots.txt", destination: "/guitar/robots.txt", has: guitarHostOnly },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
