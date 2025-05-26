interface ReviewPayload {
  mediaId: string | number;
  mediaType: "movie" | "series" | "album";
  memberId: number;
  score: number;
  watchDate: string;
  memberReview: string;
  spoiler: boolean;
}

export const postReview = async (payload: ReviewPayload): Promise<boolean> => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("❌ Token JWT não encontrado.");
      return false;
    }

    const response = await fetch("http://localhost:8080/review/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("❌ Erro ao enviar avaliação:", response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Erro ao enviar avaliação:", error);
    return false;
  }
};
