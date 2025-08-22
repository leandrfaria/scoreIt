import { apiFetch } from "@/lib/api";

type DeleteOpts = { signal?: AbortSignal };

export const deleteReview = async (
  reviewId: number | string,
  opts: DeleteOpts = {}
): Promise<boolean> => {
  const idStr = String(reviewId ?? "").trim();
  if (!idStr) return false;

  try {
    await apiFetch(`/review/delete/${idStr}`, {
      method: "DELETE",
      auth: true,
      signal: opts.signal,
    });
    return true;
  } catch (error) {
    console.error("❌ Erro ao deletar avaliação:", error);
    return false;
  }
};
