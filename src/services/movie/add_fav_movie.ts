// src/services/movie/add_fav_movie.ts
import { apiFetch } from "@/lib/api";

export const addFavouriteMovie = async (token: string, userId: number, movieId: number): Promise<boolean> => {
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
