// src/services/review/average.ts
import { apiBase, getToken } from "@/lib/api";

export type MediaType = "MOVIE" | "SERIE" | "ALBUM";

// backoff para reduzir spam de 404/500 no console e na API
const failureUntil = new Map<string, number>();
const keyFor = (mediaType: MediaType, id: string | number) => `${mediaType}:${id}`;
const SOFT_BACKOFF_MS = 3 * 60 * 1000;  // 3 min para 404 (sem recurso ainda)
const HARD_BACKOFF_MS = 10 * 60 * 1000; // 10 min para 5xx

export function invalidateAverage(mediaType: MediaType, mediaId: string | number) {
  failureUntil.delete(keyFor(mediaType, mediaId));
}

/**
 * Busca a média do ScoreIt.
 * - Não faz request se não houver token.
 * - Backoff em 404/500 para diminuir ruído.
 * - Nunca lança: retorna null em qualquer falha.
 */
export async function fetchAverageRating(
  mediaType: MediaType,
  mediaId: string | number,
  opts?: { signal?: AbortSignal }
): Promise<number | null> {
  if (mediaId === undefined || mediaId === null) return null;

  const token = typeof window !== "undefined" ? getToken() : null;
  if (!token) {
    // sem token: evita request e ruído
    return null;
  }

  const id = encodeURIComponent(String(mediaId));
  const url = `${apiBase}/review/average/${mediaType}/${id}`;
  const k = keyFor(mediaType, mediaId);

  // respeita backoff
  const until = failureUntil.get(k);
  if (until && Date.now() < until) return null;

  try {
    const headers = new Headers();
    headers.set("Accept", "text/plain, application/json");
    headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(url, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: opts?.signal,
    });

    if (!res.ok) {
      if (res.status >= 500) {
        failureUntil.set(k, Date.now() + HARD_BACKOFF_MS);
      } else if (res.status === 404) {
        failureUntil.set(k, Date.now() + SOFT_BACKOFF_MS);
      }
      return null;
    }

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
    }

    const text = (await res.text()).trim();
    if (!text) return null;
    const num = Number.parseFloat(text.replace(",", "."));
    return Number.isFinite(num) ? num : null;
  } catch (e: any) {
    if (e?.name === "AbortError") return null;
    return null;
  }
}
