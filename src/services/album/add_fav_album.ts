export const addFavouriteAlbum = async (userId: number, albumId: string): Promise<boolean> => {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        console.error("Token não encontrado.");
        return false;
      } 

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
  