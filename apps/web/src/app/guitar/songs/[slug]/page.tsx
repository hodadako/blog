import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGuitarSong, loadGuitarCatalog } from "@/features/guitar/server/catalog";
import { SongReader } from "@/features/guitar/components/song-reader";

export const dynamicParams = false;

export function generateStaticParams(): Array<{ slug: string }> {
  return loadGuitarCatalog().map(({ slug }) => ({ slug }));
}

interface GuitarSongPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: GuitarSongPageProps): Promise<Metadata> {
  const { slug } = await params;
  const song = getGuitarSong(slug);
  if (!song) return { robots: { index: false, follow: false } };
  return {
    title: `${song.title} — ${song.artist}`,
    description: `${song.artist}의 ${song.title} 코드 악보입니다.`,
    alternates: { canonical: `https://guitar.hodako.dev/songs/${song.slug}` },
    openGraph: {
      title: `${song.title} — ${song.artist}`,
      description: `${song.artist}의 ${song.title} 코드 악보입니다.`,
      url: `https://guitar.hodako.dev/songs/${song.slug}`,
      type: "article",
    },
  };
}

export default async function GuitarSongPage({ params }: GuitarSongPageProps) {
  const { slug } = await params;
  const song = getGuitarSong(slug);
  if (!song) notFound();

  return <SongReader artist={song.artist} document={song.document} keyName={song.key} slug={song.slug} sourceCapo={song.document.metadata.capo} title={song.title} />;
}
