import { apiFetch } from "@/lib/api";

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

export const postReview = async (
  payload: ReviewPayload,
  opts: PostOpts = {}
): Promise<boolean> => {
  try {
    // validação leve
    if (!payload?.mediaId || !payload?.mediaType) return false;

    await apiFetch("/review/register", {
      method: "POST",
      auth: true,
      signal: opts.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (error) {
    console.error("❌ Erro ao enviar avaliação:", error);
    return false;
  }
};
