import { apiFetch } from "@/lib/api";

export const isFavoritedMedia = async (
  userId: number,
  mediaId: string | number
): Promise<boolean> => {
  if (!userId || !mediaId) return false;

  try {
    const data = await apiFetch(
      `/member/is-favorited?memberId=${userId}&mediaId=${mediaId}`,
      { auth: true }
    );

    return Boolean((data as any)?.favorited);
  } catch (error) {
    console.error("❌ Erro ao verificar se a mídia está favoritada:", error);
    return false;
  }
};
