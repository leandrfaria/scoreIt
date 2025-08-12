import { Series } from "@/types/Series";

export const fetchFavouriteSeries = async (token: string, id: string): Promise<Series[]> => {
  try {
    const response = await fetch(`http://localhost:8080/series/favorites/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar series favoritas: ${response.status}`);
    }

    const text = await response.text();

    if (!text) {
      throw new Error("Resposta da API vazia");
    }

    const data = JSON.parse(text);

    const results = data.results || data.data?.results || data || [];

    if (!Array.isArray(results)) {
      console.warn("⚠️ 'results' não é um array:", results);
      return [];
    }

    const transformed: Series[] = results.map((serie: any) => ({
      id: serie.id,
      name: serie.name,
      posterUrl: serie.poster_path
        ? `https://image.tmdb.org/t/p/w300${serie.poster_path}`
        : "/fallback.jpg",
      backdropUrl: serie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${serie.backdrop_path}`
        : "/fallback.jpg",
      vote_average: serie.vote_average,
      release_date: serie.release_date,
      overview: serie.overview || "Sem descrição disponível.",
      genres: serie.genre ? [serie.genre] : ["Desconhecido"],
    }));

    return transformed;
  } catch (error) {
    console.error("❌ Erro ao buscar series favoritas:", error);
    return [];
  }
};
