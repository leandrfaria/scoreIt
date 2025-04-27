export const addFavouriteSeries = async (token: string, userId: number, seriesId: number): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:8080/member/favorites/${userId}/${seriesId}/series`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error(`Erro ao favoritar série: ${response.status}`);
      }
  
      return true;
    } catch (error) {
      console.error("❌ Erro ao adicionar série aos favoritos:", error);
      return false;
    }
  };
  