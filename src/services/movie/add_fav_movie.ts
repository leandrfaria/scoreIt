import { apiFetch } from "@/lib/api";

export const addFavouriteMovie = async (
  _token: string,
  userId: number,
  movieId: number
): Promise<boolean> => {
  if (!userId || !movieId) return false;

  try {
    await apiFetch(`/member/favorites/${userId}/${movieId}/movie`, {
      method: "POST",
      auth: true,
    });
    return true;
  } catch (error) {
    console.error("❌ Erro ao adicionar filme aos favoritos:", error);
    return false;
  }
};
