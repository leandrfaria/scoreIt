export interface UpdateReviewPayload {
  id: number;
  score: number;
  watchDate: string;
  memberReview: string;
  spoiler: boolean;
}

export const updateReview = async (payload: UpdateReviewPayload): Promise<boolean> => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("❌ Token JWT não encontrado.");
      return false;
    }

    const response = await fetch("http://localhost:8080/review/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("❌ Erro ao atualizar avaliação:", response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Erro ao atualizar avaliação:", error);
    return false;
  }
};
