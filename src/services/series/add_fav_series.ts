import { apiFetch } from "@/lib/api";

export const addFavouriteSeries = async (
_token: string, userId: number, seriesId: number, tmdbLanguage: string): Promise<boolean> => {
  if (!userId || !seriesId) return false;

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