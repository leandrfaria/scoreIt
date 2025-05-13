export const addFavouriteMovie = async (token: string, userId: number, movieId: number): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:8080/member/favorites/${userId}/${movieId}/movie`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error(`Erro ao favoritar filme: ${response.status}`);
      }
  
      return true;
    } catch (error) {
      console.error("❌ Erro ao adicionar filme aos favoritos:", error);
      return false;
    }
  };

  
  