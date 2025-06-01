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

export const getReviewsByMediaId = async (mediaId: string): Promise<ReviewFromApi[]> => {
  try {
    const token = localStorage.getItem("authToken");

    if (!token) {
      console.error("❌ Token JWT não encontrado.");
      return [];
    }

    const response = await fetch(`http://localhost:8080/review/getReviewByMediaId/${mediaId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("❌ Erro ao buscar avaliações:", response.status, await response.text());
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Erro ao buscar avaliações:", error);
    return [];
  }
};
