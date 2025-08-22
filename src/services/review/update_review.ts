import { apiFetch } from "@/lib/api";

export interface UpdateReviewPayload {
  id: number;
  score: number;
  watchDate: string;
  memberReview: string;
  spoiler: boolean;
}

type PutOpts = { signal?: AbortSignal };

export const updateReview = async (
  payload: UpdateReviewPayload,
  opts: PutOpts = {}
): Promise<boolean> => {
  try {
    if (!payload?.id || !Number.isFinite(payload.id)) return false;

    await apiFetch("/review/update", {
      method: "PUT",
      auth: true,
      signal: opts.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (error) {
    console.error("❌ Erro ao atualizar avaliação:", error);
    return false;
  }
};
