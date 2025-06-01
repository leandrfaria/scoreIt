export interface ReviewFromApi {
  id: number;
  mediaId: string;
  mediaType: "movie" | "series" | "album";
  memberId: number;
  score: number;
  memberReview: string;
  watchDate: string;
  spoiler: boolean;
  reviewDate: string;
}

export const getReviewsByMemberId = async (
  memberId: number,
  token: string
): Promise<ReviewFromApi[]> => {
  try {
    const response = await fetch(`http://localhost:8080/review/getReviewByMemberId/${memberId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("❌ Erro ao buscar avaliações do membro:", response.status, await response.text());
      return [];
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Erro ao buscar avaliações do membro:", error);
    return [];
  }
};
