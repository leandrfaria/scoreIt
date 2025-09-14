import { apiFetch, clearToken } from "@/lib/api";
import { emitReviewChanged } from "@/lib/events";
import { invalidateAverage, MediaType } from "./average";

export interface ReviewPayload {
  mediaId: string | number;
  mediaType: "movie" | "series" | "album";
  memberId: number;
  score: number;
  watchDate: string;
  memberReview: string;
  spoiler: boolean;
}

type PostOpts = { signal?: AbortSignal };

const toApiMediaType = (t: ReviewPayload["mediaType"]): MediaType =>
  t === "movie" ? "MOVIE" : t === "album" ? "ALBUM" : "SERIE";

export const postReview = async (
  payload: ReviewPayload,
  opts: PostOpts = {}
): Promise<boolean> => {
  try {
    if (!payload?.mediaId || !payload?.mediaType) return false;

    await apiFetch("/review/register", {
      method: "POST",
      auth: true,
      signal: opts.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // 🔄 invalida backoff e notifica listeners p/ atualização imediata
    const apiType = toApiMediaType(payload.mediaType);
    invalidateAverage(apiType, payload.mediaId);
    if (apiType === "SERIE") invalidateAverage("SERIES", payload.mediaId); // 👈 plural também

    emitReviewChanged({ mediaType: apiType, mediaId: payload.mediaId });
    if (apiType === "SERIE") emitReviewChanged({ mediaType: "SERIES", mediaId: payload.mediaId }); // 👈 plural também

    return true;
  } catch (error: any) {
    const status = error?.status ?? error?.code;
    if (status === 401 || status === 403 || String(error?.message || "").startsWith("NO_TOKEN")) {
      clearToken();
      console.warn("🔒 Sessão expirada ou inválida. Limpando token.");
    } else {
      console.error("❌ Erro ao enviar avaliação:", error);
    }
    return false;
  }
};
