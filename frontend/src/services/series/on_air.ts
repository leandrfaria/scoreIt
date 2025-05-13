
import { Series } from "@/types/Series";

export const fetchOnAirSeries = async (token: string): Promise<Series[]> => {
  try {
    const response = await fetch("http://localhost:8080/series/now/1", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar séries no ar: ${response.status}`);
    }

    const text = await response.text();

    if (!text) {
      throw new Error("Resposta da API vazia");
    }

    const data = JSON.parse(text);
    console.log("📦 DATA PARSED:", data);

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
      overview: serie.overview?.trim() ? serie.overview : undefined,
    }));

    return transformed;
  } catch (error) {
    console.error("❌ Erro ao buscar séries no ar:", error);
    return [];
  }
};
