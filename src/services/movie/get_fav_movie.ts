import { apiFetch } from "@/lib/api";
import { Movie } from "@/types/Movie";

export const fetchFavouriteMovies = async (
  _token: string,
  userId: string
): Promise<Movie[]> => {
  if (!userId) return [];

  try {
    const data: any = await apiFetch(`/movie/favorites/${userId}`, { auth: true });
    const results = data.results || data.data?.results || data || [];

    if (!Array.isArray(results)) {
      console.warn("⚠️ 'results' não é um array:", results);
      return [];
    }

    return results.map((movie: any): Movie => ({
      id: Number(movie.id ?? 0),
      title: String(movie.title ?? "Desconhecido"),
      posterUrl: movie.poster_path
        ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
        : movie.posterUrl ?? "/fallback.jpg",
      backdropUrl: movie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : movie.backdropUrl ?? "/fallback.jpg",
      vote_average: Number(movie.vote_average ?? 0),
      release_date: movie.release_date ?? null,
      overview: movie.overview || "Sem descrição disponível.",
      genre: movie.genre || "Desconhecido",
    }));
  } catch (error) {
    console.error("❌ Erro ao buscar filmes favoritos:", error);
    return [];
  }
};
