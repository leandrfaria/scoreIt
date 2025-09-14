// src/services/review/average.ts
import { apiBase, getToken } from "@/lib/api";

export type MediaType = "MOVIE" | "SERIE" | "SERIES" | "ALBUM";

// backoff para reduzir spam de 404/500
const failureUntil = new Map<string, number>();
const normalizeType = (t: MediaType) => (t === "SERIES" ? "SERIE" : t);
const keyFor = (mediaType: MediaType, id: string | number) => `${normalizeType(mediaType)}:${id}`;
const SOFT_BACKOFF_MS = 3 * 60 * 1000;  // 3 min (404)
const HARD_BACKOFF_MS = 10 * 60 * 1000; // 10 min (5xx)

export function invalidateAverage(mediaType: MediaType, mediaId: string | number) {
  failureUntil.delete(keyFor(mediaType, mediaId));
}

/** Busca a média do ScoreIt com fallback SERIE/SERIES.
 * - Evita request se não houver token
 * - Backoff para 404/5xx
 * - Nunca lança; retorna null em falha
 */
export async function fetchAverageRating(
  mediaType: MediaType,
  mediaId: string | number,
  opts?: { signal?: AbortSignal }
): Promise<number | null> {
  if (mediaId === undefined || mediaId === null) return null;

  const token = typeof window !== "undefined" ? getToken() : null;
  if (!token) return null;

  const id = encodeURIComponent(String(mediaId));
  const k = keyFor(mediaType, mediaId);

  const until = failureUntil.get(k);
  if (until && Date.now() < until) return null;

  const typesToTry: MediaType[] =
    mediaType === "SERIE" || mediaType === "SERIES" ? ["SERIES", "SERIE"] : [mediaType];

  let lastStatus: number | undefined;

  try {
    const headers = new Headers();
    headers.set("Accept", "text/plain, application/json");
    headers.set("Authorization", `Bearer ${token}`);

    for (const mt of typesToTry) {
      const url = `${apiBase}/review/average/${mt}/${id}`;
      const res = await fetch(url, {
        method: "GET",
        headers,
        cache: "no-store",
        signal: opts?.signal,
      });

      if (res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const data = await res.json();
          if (typeof data === "number") return data;
          if (data && typeof data.average === "number") return data.average;
          if (typeof data === "string") {
            const n = Number.parseFloat(data.replace(",", ".").trim());
            return Number.isFinite(n) ? n : null;
          }
          return null;
        } else {
          // texto simples (ex.: "0.0")
          const text = (await res.text()).trim();
          if (!text) return null;
          const num = Number.parseFloat(text.replace(",", "."));
          return Number.isFinite(num) ? num : null;
        }
      }

      // não ok → guarda status e tenta próximo tipo
      lastStatus = res.status;
      // se 401/403 não faz sentido tentar o outro
      if (res.status === 401 || res.status === 403) break;
    }

    // ambos falharam → aplica backoff
    if (lastStatus !== undefined) {
      if (lastStatus >= 500) {
        failureUntil.set(k, Date.now() + HARD_BACKOFF_MS);
      } else if (lastStatus === 404) {
        failureUntil.set(k, Date.now() + SOFT_BACKOFF_MS);
      }
    }
    return null;
  } catch (e: any) {
    if (e?.name === "AbortError") return null;
    return null;
  }
}
