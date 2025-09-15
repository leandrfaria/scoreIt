// src/services/review/average.ts
import { apiFetch } from "@/lib/api";

export type MediaType = "MOVIE" | "SERIE" | "SERIES" | "ALBUM";

type Opts = { signal?: AbortSignal };

// cache simples por (tipo:id)
const cache = new Map<string, number | null>();
const keyOf = (type: MediaType, id: string | number) => `${type}:${id}`;

/** invalida um item do cache (chamado após postReview) */
export function invalidateAverage(type: MediaType, id: string | number) {
  cache.delete(keyOf(type, id));
}

function parseAverage(raw: any): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Busca a média no backend: /review/average/{TYPE}/{id}  */
export async function fetchAverageRating(
  mediaType: MediaType,
  mediaId: string | number,
  opts: Opts = {}
): Promise<number | null> {
  const k = keyOf(mediaType, mediaId);
  if (cache.has(k)) return cache.get(k)!;

  // tenta com auth; se der 401/403, tenta sem
  const path = `/review/average/${mediaType}/${encodeURIComponent(String(mediaId))}`;
  try {
    const raw = await apiFetch(path, { auth: true, signal: opts.signal });
    const avg = parseAverage(raw);
    cache.set(k, avg);
    return avg;
  } catch (err: any) {
    if (err?.status === 401 || err?.status === 403) {
      const raw = await apiFetch(path, { auth: false, signal: opts.signal });
      const avg = parseAverage(raw);
      cache.set(k, avg);
      return avg;
    }
    throw err;
  }
}
