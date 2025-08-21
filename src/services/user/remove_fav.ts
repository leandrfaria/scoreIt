import { apiFetch } from "@/lib/api";

export const removeFavouriteMedia = async (
  userId: number,
  mediaId: string | number,
  mediaType: "movie" | "series" | "album"
): Promise<boolean> => {
  if (!userId || !mediaId || !mediaType) return false;

  try {
    await apiFetch(`/member/favoritesDelete/${userId}/${mediaId}/${mediaType}`, {
      method: "DELETE",
      auth: true,
    });
    return true;
  } catch (error) {
    console.error("❌ Erro ao remover mídia dos favoritos:", error);
    return false;
  }
};
