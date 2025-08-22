import { apiFetch } from "@/lib/api";
import type { ReviewFromApi } from "./get_media_review";

type GetOpts = { signal?: AbortSignal };

type Json = Record<string, unknown>;
const isRecord = (v: unknown): v is Json => typeof v === "object" && v !== null;

export const getReviewsByMemberId = async (
  memberId: number,
  opts: GetOpts = {}
): Promise<ReviewFromApi[]> => {
  if (!Number.isFinite(memberId)) return [];

  try {
    const payload = await apiFetch(`/review/getReviewByMemberId/${memberId}`, {
      method: "GET",
      auth: true,
      signal: opts.signal,
    });

    // Reuso da normalização do serviço anterior por tipo estrutural
    const arr = Array.isArray(payload) ? payload : isRecord(payload) && Array.isArray((payload as Json).results)
      ? ((payload as { results: unknown[] }).results)
      : [];

    // Importamos o tipo, mas replicamos a lógica mínima de normalização inline
    const toNumber = (v: unknown): number => {
      const n = Number(v);
      return Number.isFinite(n) ? n : NaN;
    };
    const toBool = (v: unknown): boolean => v === true || v === "true" || v === 1 || v === "1";
    const normStr = (v: unknown): string => (typeof v === "string" ? v : v != null ? String(v) : "");
    const allowedTypes: Array<ReviewFromApi["mediaType"]> = ["movie", "series", "album"];

    const normalized: ReviewFromApi[] = arr
      .map((r: unknown) => {
        if (!isRecord(r)) return null;

        const id = toNumber(r.id);
        const memId = toNumber(r.memberId);
        const score = toNumber(r.score);
        const mediaType = normStr(r.mediaType) as ReviewFromApi["mediaType"];
        const mediaId = normStr(r.mediaId);

        if (!Number.isFinite(id)) return null;
        if (!allowedTypes.includes(mediaType)) return null;
        if (!mediaId) return null;

        return {
          id,
          mediaId,
          mediaType,
          memberId: Number.isFinite(memId) ? memId : -1,
          score: Number.isFinite(score) ? score : 0,
          memberReview: normStr(r.memberReview),
          watchDate: normStr(r.watchDate),
          spoiler: toBool(r.spoiler),
          reviewDate: normStr(r.reviewDate),
        } as ReviewFromApi;
      })
      .filter((x): x is ReviewFromApi => x !== null);

    return normalized;
  } catch (error) {
    console.error("❌ Erro ao buscar avaliações do membro:", error);
    return [];
  }
};
