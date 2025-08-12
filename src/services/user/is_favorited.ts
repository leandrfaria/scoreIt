export const isFavoritedMedia = async (userId: number, id: string | number): Promise<boolean> => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        console.error("Token não encontrado.");
        return false;
      } 
      
      const response = await fetch(`http://localhost:8080/member/is-favorited?memberId=${userId}&mediaId=${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error(`Erro ao verificar favorito: ${response.status}`);
      }
  
      const data = await response.json();
      return data.favorited; 
    } catch (error) {
      console.error("❌ Erro ao verificar se a obra está favoritada:", error);
      return false;
    }
  };
  