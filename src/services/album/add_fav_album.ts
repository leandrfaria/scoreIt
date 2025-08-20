import { apiFetch } from "@/lib/api";

export async function addFavouriteAlbum(userId: number, albumId: string): Promise<boolean> {
  try {
    await apiFetch(`/member/favorites/${userId}/${albumId}/album`, {
      method: "POST",
      auth: true,
    });
    return true;
  } catch (error) {
    console.error("❌ Erro ao adicionar álbum aos favoritos:", error);
    return false;
  }
}
