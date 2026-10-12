"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_FONT_SIZE,
  DEFAULT_SCROLL_SPEED,
  readGuitarPreferences,
  readSongPreferences,
  writeGuitarPreferences,
  writeSongPreferences,
  type GuitarPreferences,
  type SongPreferences,
} from "./storage";

export function useGuitarPreferences(slug: string, sourceCapo: number) {
  const [globalPreferences, setGlobalPreferences] = useState<GuitarPreferences>({ fontSize: DEFAULT_FONT_SIZE, scrollSpeed: DEFAULT_SCROLL_SPEED });
  const [songPreferences, setSongPreferences] = useState<SongPreferences>({ transpose: 0, capo: sourceCapo });
  const [loadedIdentity, setLoadedIdentity] = useState("");
  const identity = `${slug}:${sourceCapo}`;
  const ready = loadedIdentity === identity;

  useEffect(() => {
    setGlobalPreferences(readGuitarPreferences());
    setSongPreferences(readSongPreferences(slug, sourceCapo));
    setLoadedIdentity(identity);
  }, [identity, slug, sourceCapo]);

  useEffect(() => {
    if (!ready) return;
    writeGuitarPreferences(globalPreferences);
  }, [globalPreferences, ready]);

  useEffect(() => {
    if (!ready) return;
    writeSongPreferences(slug, songPreferences);
  }, [ready, slug, songPreferences]);

  const setFontSize = useCallback((fontSize: number) => {
    setGlobalPreferences((current) => ({ ...current, fontSize: Math.min(28, Math.max(14, fontSize)) }));
  }, []);
  const setScrollSpeed = useCallback((scrollSpeed: number) => {
    setGlobalPreferences((current) => ({ ...current, scrollSpeed: Math.min(10, Math.max(1, scrollSpeed)) }));
  }, []);
  const setTranspose = useCallback((transpose: number) => {
    setSongPreferences((current) => ({ ...current, transpose: Math.min(12, Math.max(-12, transpose)) }));
  }, []);
  const setCapo = useCallback((capo: number) => {
    setSongPreferences((current) => ({ ...current, capo: Math.min(12, Math.max(0, capo)) }));
  }, []);
  const resetSong = useCallback(() => {
    setSongPreferences({ transpose: 0, capo: sourceCapo });
  }, [sourceCapo]);

  return {
    ...globalPreferences,
    ...songPreferences,
    ready,
    setFontSize,
    setScrollSpeed,
    setTranspose,
    setCapo,
    resetSong,
  };
}
