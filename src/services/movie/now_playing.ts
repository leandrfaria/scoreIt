import { apiFetch } from "@/lib/api";
import { Movie } from "@/types/Movie";

export const fetchNowPlayingMovies = async (): Promise<Movie[]> => {
  try {
    const data: any = await apiFetch(`/movie/now/1`, { auth: true });
    const results = data.results || data.data?.results || data || [];

    if (!Array.isArray(results)) {
      console.warn("⚠️ 'results' não é um array:", results);
      return [];
    }

    const transformed: Movie[] = results.map((movie: any) => ({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path
        ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
        : movie.posterUrl ?? "/fallback.jpg",
      backdropUrl: movie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : movie.backdropUrl ?? "/fallback.jpg",
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      overview: movie.overview || "Sem descrição disponível.",
      genre: movie.genre || "Desconhecido",
    }));

    return transformed;
  } catch (error) {
    console.error("❌ Erro ao buscar filmes em cartaz:", error);
    return [];
  }
};
