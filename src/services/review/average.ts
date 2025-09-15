import { apiFetch } from "@/lib/api";

export type MediaType = "MOVIE" | "SERIE" | "SERIES" | "ALBUM";
type Opts = { signal?: AbortSignal };

const cache = new Map<string, number | null>();
const keyOf = (type: MediaType, id: string | number) => `${type}:${id}`;

const failureUntil = new Map<string, number>();
const SOFT_BACKOFF_MS = 3 * 60 * 1000;  // 3 min (404)
const HARD_BACKOFF_MS = 10 * 60 * 1000; // 10 min (5xx)

const unifiedSeriesKey = (id: string | number) => `SERIES_GROUP:${id}`;

function parseAverage(raw: any): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;

  if (typeof raw === "object") {
    const n1 = (raw as any)?.average;
    if (typeof n1 === "number") return Number.isFinite(n1) ? n1 : null;
    if (typeof n1 === "string") {
      const n = Number.parseFloat(n1.replace(",", ".").trim());
      return Number.isFinite(n) ? n : null;
    }
  }

  if (typeof raw === "string") {
    const n = Number.parseFloat(raw.replace(",", ".").trim());
    return Number.isFinite(n) ? n : null;
  }

  return null;
}

export function invalidateAverage(type: MediaType, id: string | number) {
  cache.delete(keyOf(type, id));

  if (type === "SERIE" || type === "SERIES") {
    cache.delete(keyOf("SERIE", id));
    cache.delete(keyOf("SERIES", id));
  }
}

export async function fetchAverageRating(
  mediaType: MediaType,
  mediaId: string | number,
  opts: Opts = {}
): Promise<number | null> {
  if (mediaId === undefined || mediaId === null) return null;

  const idStr = encodeURIComponent(String(mediaId));

  if (mediaType === "SERIE" || mediaType === "SERIES") {
    const until = failureUntil.get(unifiedSeriesKey(mediaId));
    if (until && Date.now() < until) return null;
  } else {
    const until = failureUntil.get(keyOf(mediaType, mediaId));
    if (until && Date.now() < until) return null;
  }

  const requestedKey = keyOf(mediaType, mediaId);
  if (cache.has(requestedKey)) return cache.get(requestedKey)!;

  // ordem de tentativa
  const typesToTry: MediaType[] =
    mediaType === "SERIE" || mediaType === "SERIES"
      ? ["SERIES", "SERIE"]
      : [mediaType];

  let lastStatus: number | undefined;

  for (const mt of typesToTry) {
    const path = `/review/average/${mt}/${idStr}`;

    // 1) tenta com auth
    try {
      const raw = await apiFetch(path, { auth: true, signal: opts.signal });
      const avg = parseAverage(raw);

      // cacheia a chave concreta usada
      cache.set(keyOf(mt, mediaId), avg);

      // se for série, preenche a outra chave também (SERIE/SERIES) p/ evitar 2 reqs
      if (mt === "SERIES" || mt === "SERIE") {
        const other = mt === "SERIES" ? "SERIE" : "SERIES";
        cache.set(keyOf(other as MediaType, mediaId), avg);
      }

      return avg;
    } catch (err: any) {
      const status = err?.status;
      lastStatus = status;

      if (status === 401 || status === 403) {
        try {
          const raw = await apiFetch(path, { auth: false, signal: opts.signal });
          const avg = parseAverage(raw);

          cache.set(keyOf(mt, mediaId), avg);
          if (mt === "SERIES" || mt === "SERIE") {
            const other = mt === "SERIES" ? "SERIE" : "SERIES";
            cache.set(keyOf(other as MediaType, mediaId), avg);
          }

          return avg;
        } catch (e2: any) {
          lastStatus = e2?.status ?? lastStatus;
          // segue para tentar o próximo tipo (se houver)
        }
      }
    }
  }

  if (lastStatus !== undefined) {
    if (mediaType === "SERIE" || mediaType === "SERIES") {
      const k = unifiedSeriesKey(mediaId);
      if (lastStatus >= 500) failureUntil.set(k, Date.now() + HARD_BACKOFF_MS);
      else if (lastStatus === 404) failureUntil.set(k, Date.now() + SOFT_BACKOFF_MS);
    } else {
      const k = keyOf(mediaType, mediaId);
      if (lastStatus >= 500) failureUntil.set(k, Date.now() + HARD_BACKOFF_MS);
      else if (lastStatus === 404) failureUntil.set(k, Date.now() + SOFT_BACKOFF_MS);
    }
  }

  return null;
}
