import type { StorageLike } from "./storage";

export interface CoverPreset {
  id: string;
  name: string;
  url: string;
  transpose: number;
  capo: number;
  soundingKey: string;
}

const key = (slug: string) => `guitar:covers:v1:${slug}`;

export function coverUrl(value: string): string {
  if (!value.trim()) return "";
  try {
    const url = new URL(value.trim());
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch { return ""; }
}

export function readCoverPresets(slug: string, storage?: StorageLike): CoverPreset[] {
  try {
    const value: unknown = JSON.parse((storage ?? window.localStorage).getItem(key(slug)) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is CoverPreset => {
      if (!item || typeof item !== "object") return false;
      const p = item as Record<string, unknown>;
      return typeof p.id === "string" && /^[\w-]{1,80}$/.test(p.id)
        && typeof p.name === "string" && p.name.trim().length > 0 && p.name.length <= 80
        && typeof p.url === "string" && p.url.length <= 1000 && (!p.url || coverUrl(p.url) === p.url)
        && typeof p.transpose === "number" && Number.isInteger(p.transpose) && Math.abs(p.transpose) <= 12
        && typeof p.capo === "number" && Number.isInteger(p.capo) && p.capo >= 0 && p.capo <= 12
        && typeof p.soundingKey === "string" && /^[A-G][#b]?m?$/.test(p.soundingKey);
    }).slice(0, 20);
  } catch { return []; }
}

export function writeCoverPresets(slug: string, presets: CoverPreset[]): boolean {
  try {
    window.localStorage.setItem(key(slug), JSON.stringify(presets.slice(0, 20)));
    return true;
  } catch { return false; }
}
