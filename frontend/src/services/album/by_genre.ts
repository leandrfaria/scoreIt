import { Album } from "@/types/Album";

const BASE_URL = "http://localhost:8080";

const getAuthToken = (): string | null => {
  return localStorage.getItem("authToken");
};

// Função genérica para fazer fetch com token de autorização
const fetchWithAuth = async (url: string): Promise<any> => {
  const token = getAuthToken();

  if (!token) {
    console.error("Token não encontrado.");
    return null;
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Erro na requisição: ${res.status}`);
  }

  return res.json();
};

/**
 * 🎧 Busca álbuns por gênero
 */
export const fetchAlbumsByGenre = async (
  genre: string = "rap",
  page = 1,
  limit = 20
): Promise<Album[]> => {
  try {
    const data = await fetchWithAuth(`${BASE_URL}/lastfm/albums-by-genre/${genre}?page=${page}&limit=${limit}`);

    if (!Array.isArray(data)) {
      console.error("Resposta inesperada na busca por gênero:", data);
      return [];
    }

  return data.map((item: any) => ({
    id: item.id,
    name: item.name,
    release_date: item.release_date || "", // tenta usar a data, senão deixa vazio
    imageUrl: item.imageUrl,
    artistName: item.artistName || "Desconhecido",
  }));

  } catch (err) {
    console.error("Erro ao buscar álbuns por gênero:", err);
    return [];
  }
};

export const fetchAlbumsByName = async (query: string, limit = 20): Promise<Album[]> => {
  try {
    const data = await fetchWithAuth(
      `${BASE_URL}/spotify/api/searchAlbum?query=${encodeURIComponent(query)}&limit=${limit}`
    );

    const items = data?.albums?.items || [];

    const filtered = items.filter((item: any) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );

    return filtered.map((item: any) => ({
      id: item.id,
      name: item.name,
      release_date: item.release_date || "",
      imageUrl: item.images && item.images.length > 0 ? item.images[0].url : "",
      artistName: item.artists && item.artists.length > 0 ? item.artists[0].name : "Desconhecido",
    }));
  } catch (err) {
    console.error("Erro ao buscar álbuns por nome:", err);
    return [];
  }
};

