export const deleteReview = async (reviewId: number | string): Promise<boolean> => {
  try {
    const token = localStorage.getItem("authToken");

    if (!token) {
      console.error("❌ Token JWT não encontrado.");
      return false;
    }

    const url = `http://localhost:8080/review/delete/${reviewId}`;
    console.log("🧨 URL da requisição:", url);
    console.log("🔐 Token usado:", token);

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const text = await response.text();
    console.log("📦 Resposta da API:", text);

    if (!response.ok) {
      console.error("❌ Erro ao deletar avaliação:", response.status, text);
      return false;
    }

    console.log("✅ Avaliação deletada com sucesso!");
    return true;
  } catch (error) {
    console.error("❌ Erro inesperado ao deletar avaliação:", error);
    return false;
  }
};
