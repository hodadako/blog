import { getGuitarSongSummaries } from "@/features/guitar/server/catalog";

export const dynamic = "force-static";

export default function sitemap() {
  const base = "https://guitar.hodako.dev";
  return [
    { url: base },
    { url: base + "/songs" },
    ...getGuitarSongSummaries().map((song) => ({
      url: base + "/songs/" + song.slug,
      ...(song.updated || song.added ? { lastModified: song.updated ?? song.added } : {}),
    })),
  ];
}
