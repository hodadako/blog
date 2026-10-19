"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import type { GuitarSongSummary } from "../server/catalog";
import { guitarHref } from "@/lib/guitar-links";
import styles from "@/app/guitar/guitar.module.css";

interface SongSearchProps {
  songs: GuitarSongSummary[];
  emptyMessage: string;
}

export function SongSearch({ songs, emptyMessage }: SongSearchProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const categories = useMemo(() => [...new Set(songs.flatMap(song => song.tags ?? []))].sort(), [songs]);
  const results = useMemo(() => {
    const needle = query.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("ko-KR");
    return songs.filter(song => (!needle || song.normalizedSearchText.includes(needle)) && (!category || song.tags?.includes(category)));
  }, [query, songs, category]);

  function preventSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
  }

  return (
    <>
      <form className={styles.search} onSubmit={preventSubmit} role="search">
        <label className="sr-only" htmlFor="guitar-song-query">곡 검색</label>
        <input className={styles.searchInput} id="guitar-song-query" onChange={(event) => setQuery(event.target.value)} placeholder="Search songs…" type="search" value={query} />
        {query && <button aria-label="검색 초기화" className={styles.searchClear} onClick={() => setQuery("")} type="button">지우기</button>}
      </form>
      {categories.length > 0 && <div aria-label="곡 카테고리" className={styles.categoryFilters} role="group">
        {["", ...categories].map(tag => <button aria-pressed={category === tag} key={tag} onClick={() => setCategory(tag)} type="button">{tag || "모든 곡"}</button>)}
      </div>}
      {results.length === 0 ? <p className={styles.empty} role="status">{songs.length === 0 ? emptyMessage : "검색 결과가 없습니다."}</p> : (
        <ul className={styles.songList}>{results.map((song) => (
          <li key={song.slug}>
            <Link className={styles.songRow} href={guitarHref(("/songs/" + song.slug) as Parameters<typeof guitarHref>[0])}>
              <span className={styles.songInfo}><span className={styles.songTitle}>{song.title}</span><span className={styles.artist}>{song.artist}</span></span>
            </Link>
          </li>
        ))}</ul>
      )}
    </>
  );
}
