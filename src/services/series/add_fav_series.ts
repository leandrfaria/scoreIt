import { apiFetch } from "@/lib/api";

/**
 * Mantida a assinatura original; internamente usamos `apiFetch` com `{ auth: true }`.
 */
export const addFavouriteSeries = async (
  _token: string,
  userId: number,
  seriesId: number
): Promise<boolean> => {
  try {
    await apiFetch(`/member/favorites/${userId}/${seriesId}/series`, {
      method: "POST",
      auth: true,
    });
    return true;
  } catch (error) {
    console.error("❌ Erro ao adicionar série aos favoritos:", error);
    return false;
  }
};
