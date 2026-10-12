import styles from "../guitar.module.css";
import { getGuitarSongSummaries } from "@/features/guitar/server/catalog";
import { SongSearch } from "@/features/guitar/components/song-search";

export const metadata = {
  title: "곡 목록",
  description: "등록된 기타 코드 악보를 검색합니다.",
  alternates: { canonical: "https://guitar.hodako.dev/songs" },
  openGraph: { title: "Hodako Guitar 곡 목록", url: "https://guitar.hodako.dev/songs" },
};

export default function GuitarSongsPage() {
  const songs = getGuitarSongSummaries();

  return (
    <section className={styles.index}>
      <h1 className="page-title">Songs</h1>
      <SongSearch emptyMessage="아직 등록된 곡이 없습니다." songs={songs} />
    </section>
  );
}
