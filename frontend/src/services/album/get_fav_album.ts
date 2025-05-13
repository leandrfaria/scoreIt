import { Album } from "@/types/Album";

export const fetchFavouriteAlbuns = async (id: string): Promise<Album[]> => {
  try {
    const token = localStorage.getItem("authToken");

    if (!token) {
      console.error("Token não encontrado.");
      return [];
    }

    const res = await fetch(`http://localhost:8080/spotify/api/favorites/${id}`, {
        headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Erro ao buscar álbuns: ${res.status}`);
    }

    const raw = await res.json();

    return raw.map((item: any) => ({
      id: item.id,
      name: item.name,  
      release_date: item.release_date,
      imageUrl: item.images?.[0]?.url || "",
      artistName: item.artists?.[0]?.name || "Desconhecido",
    }));
  } catch (err) {
    console.error("Erro ao buscar álbuns:", err);
    return [];
  }
};
