import { Artist } from "@/types/Artist"

export const fetchTopArtists = async (): Promise<Artist[]> => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("Token não encontrado.");
      return [];
    }

    const response = await fetch("http://localhost:8080/music/top-artists?page=1&limit=10", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar top artistas: ${response.status}`);
    }

    const data: Artist[] = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao buscar top artistas:", error);
    return [];
  }
};