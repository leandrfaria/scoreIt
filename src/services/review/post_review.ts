import { apiFetch, clearToken } from "@/lib/api";

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
    if (!payload?.mediaId || !payload?.mediaType) return false;

    await apiFetch("/review/register", {
      method: "POST",
      auth: true,
      signal: opts.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return true;
  } catch (error: any) {
    // Trata sessão expirada / sem token
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
