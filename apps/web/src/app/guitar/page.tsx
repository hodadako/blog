import Link from "next/link";
import styles from "./guitar.module.css";
import { guitarHref } from "@/lib/guitar-links";
import { getGuitarSongSummaries } from "@/features/guitar/server/catalog";
import { SongSearch } from "@/features/guitar/components/song-search";

export const metadata = {
  title: "Hodako Guitar",
  description: "코드와 가사를 검색하고 편하게 읽는 기타 악보",
  alternates: { canonical: "https://guitar.hodako.dev/" },
};

export default function GuitarHomePage() {
  const songs = getGuitarSongSummaries();
  return (
    <section className={styles.intro}>
      <p>Hodako Guitar</p>
      <h1>코드와 가사를 한곳에서</h1>
      <p>연주에 필요한 곡을 찾고 읽기 편한 코드 악보로 살펴보세요.</p>
      <SongSearch emptyMessage="등록된 곡이 없습니다." initialLimit={8} songs={songs} />
      <Link href={guitarHref("/songs")}>곡 목록 보기</Link>
    </section>
  );
}
