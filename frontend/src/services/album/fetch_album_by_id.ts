import { Album } from "@/types/Album";

export const fetchAlbumById = async (id: string): Promise<Album | null> => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    console.error("Token não encontrado. Faça login primeiro.");
    return null;
  }

  try {
    const response = await fetch(`http://localhost:8080/spotify/api/album/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar álbum: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      name: data.name,
      artist: data.artists?.[0]?.name || "Desconhecido",
      release_date: data.release_date,
      total_tracks: data.total_tracks,
      imageUrl: data.images?.[0]?.url || "",
    };
  } catch (error) {
    console.error("Erro ao buscar álbum:", error);
    return null;
  }
};
