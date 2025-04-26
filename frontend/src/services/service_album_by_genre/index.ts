import { Album } from "@/types/Album";

export const fetchAlbumsByGenre = async (genre: string = "rap", page = 1, limit = 20): Promise<Album[]> => {
  try {
    const token = localStorage.getItem("authToken");

    if (!token) {
      console.error("Token não encontrado.");
      return [];
    }

    const res = await fetch(`http://localhost:8080/lastfm/album/${genre}?page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Erro ao buscar álbuns: ${res.status}`);
    }

    const raw = await res.json();

    return raw.map((item: any, index: number) => ({
      id: item.artist?.mbid || `album-${genre}-${page}-${index}`,
      name: item.name,
      release_date: "",
      imageUrl: item.image?.[3]?.["#text"] || "",
      artistName: item.artist?.name || "Desconhecido",
    }));
  } catch (err) {
    console.error("Erro ao buscar álbuns:", err);
    return [];
  }
};
