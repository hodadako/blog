"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import type { GuitarSongSummary } from "../server/catalog";
import { guitarHref } from "@/lib/guitar-links";

interface SongSearchProps {
  songs: GuitarSongSummary[];
  emptyMessage: string;
  initialLimit?: number;
}

export function SongSearch({ songs, emptyMessage, initialLimit }: SongSearchProps) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const needle = query.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase("ko-KR");
    const matches = needle ? songs.filter((song) => song.normalizedSearchText.includes(needle)) : songs;
    return !needle && initialLimit !== undefined ? matches.slice(0, initialLimit) : matches;
  }, [initialLimit, query, songs]);

  function preventSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
  }

  return (
    <>
      <form onSubmit={preventSubmit} role="search">
        <label htmlFor="guitar-song-query">곡 검색</label>
        <input id="guitar-song-query" onChange={(event) => setQuery(event.target.value)} type="search" value={query} />
        <button type="submit">검색</button>
      </form>
      {results.length === 0 ? <p>{songs.length === 0 ? emptyMessage : "검색 결과가 없습니다."}</p> : (
        <ul>{results.map((song) => (
          <li key={song.slug}>
            <Link href={guitarHref(("/songs/" + song.slug) as Parameters<typeof guitarHref>[0])}>{song.title}</Link>
            <span> · {song.artist}</span>
          </li>
        ))}</ul>
      )}
    </>
  );
}
