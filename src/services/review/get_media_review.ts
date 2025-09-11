import { apiFetch } from "@/lib/api";

export interface ReviewFromApi {
  id: number;
  mediaId: string;
  mediaType: "movie" | "series" | "album";
  memberId: number;
  score: number;
  memberReview: string;
  watchDate: string;
  spoiler: boolean;
  reviewDate: string;
}

type GetOpts = { signal?: AbortSignal };

type Json = Record<string, unknown>;
const isRecord = (v: unknown): v is Json => typeof v === "object" && v !== null;

const toNumber = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

const toBool = (v: unknown): boolean =>
  v === true || v === "true" || v === 1 || v === "1";

const normStr = (v: unknown): string =>
  (typeof v === "string" ? v : v != null ? String(v) : "");

function normalizeReview(r: unknown): ReviewFromApi | null {
  if (!isRecord(r)) return null;

  const id = toNumber(r.id);
  const memberId = toNumber(r.memberId);
  const score = toNumber(r.score);

  const mediaType = normStr(r.mediaType) as ReviewFromApi["mediaType"];
  const allowedTypes: Array<ReviewFromApi["mediaType"]> = ["movie", "series", "album"];

  if (!Number.isFinite(id)) return null;
  if (!allowedTypes.includes(mediaType)) return null;

  const mediaId = normStr(r.mediaId);
  if (!mediaId) return null;

  return {
    id,
    mediaId,
    mediaType,
    memberId: Number.isFinite(memberId) ? memberId : -1,
    score: Number.isFinite(score) ? score : 0,
    memberReview: normStr(r.memberReview),
    watchDate: normStr(r.watchDate),
    spoiler: toBool(r.spoiler),
    reviewDate: normStr(r.reviewDate),
  };
}

export const getReviewsByMediaId = async (
  mediaId: string,
  opts: GetOpts = {}
): Promise<ReviewFromApi[]> => {
  const idStr = String(mediaId ?? "").trim();
  if (!idStr) return [];

  try {
    const payload = await apiFetch(`/review/getReviewByMediaId/${idStr}`, {
      method: "GET",
      auth: true,
      signal: opts.signal,
    });

    const arr = Array.isArray(payload)
      ? payload
      : isRecord(payload) && Array.isArray((payload as Json).results)
      ? ((payload as { results: unknown[] }).results)
      : [];

    const normalized = arr
      .map(normalizeReview)
      .filter((r): r is ReviewFromApi => r !== null);

    return normalized;
  } catch (error: any) {
    // Suprime aborts silenciosamente
    const msg = String(error?.message || "").toLowerCase();
    if (error?.name === "AbortError" || msg.includes("abort")) {
      return [];
    }
    console.error("❌ Erro ao buscar avaliações:", error);
    return [];
  }
};
