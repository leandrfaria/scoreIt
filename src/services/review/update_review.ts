import { apiFetch, clearToken } from "@/lib/api";

export interface ReviewUpdatePayload {
  id: number;
  score: number;
  watchDate: string; // "YYYY-MM-DD"
  memberReview: string;
  spoiler: boolean;
}

export const updateReview = async (payload: ReviewUpdatePayload): Promise<boolean> => {
  try {
    await apiFetch("/review/update", {
      method: "PUT",
      auth: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return true;
  } catch (error: any) {
    const status = error?.status ?? error?.code;
    if (status === 401 || status === 403 || String(error?.message || "").startsWith("NO_TOKEN")) {
      clearToken();
      console.warn("🔒 Sessão expirada ou inválida. Limpando token.");
    } else {
      console.error("❌ Erro ao atualizar avaliação:", error);
    }
    return false;
  }
};
