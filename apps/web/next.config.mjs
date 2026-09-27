import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  async redirects() {
    return [
      {source: "/:locale(ko|en)/inspirations", destination: "/:locale/records", permanent: true},
      {source: "/:locale(ko|en)/inspirations/:type", destination: "/:locale/records/:type", permanent: true},
      {source: "/inspirations", destination: "/records", permanent: true},
      {source: "/inspirations/:id/:asset", destination: "/records/:id/:asset", permanent: true},
    ];
  },
};

export default nextConfig;
