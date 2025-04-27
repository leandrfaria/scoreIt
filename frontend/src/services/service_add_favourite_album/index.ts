export const addFavouriteAlbum = async (token: string, userId: number, albumId: string | number): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:8080/member/favorites/${userId}/${albumId}/album`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error(`Erro ao favoritar álbum: ${response.status}`);
      }
  
      return true;
    } catch (error) {
      console.error("❌ Erro ao adicionar álbum aos favoritos:", error);
      return false;
    }
  };
  