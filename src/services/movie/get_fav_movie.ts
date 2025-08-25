import { apiFetch } from "@/lib/api";
import { Movie } from "@/types/Movie";
import { mapNextIntlToTMDB, isTMDBLocale } from "@/i18n/localeMapping";

export const fetchFavouriteMovies = async (
  token: string, 
  memberId: string, 
  locale: string
): Promise<Movie[]> => {
  try {
    // Mapear o locale do next-intl para o formato TMDB
    const tmdbLocale = isTMDBLocale(locale) ? locale : mapNextIntlToTMDB(locale);
    
    const data: any = await apiFetch(`/movie/favorites/${memberId}?language=${encodeURIComponent(tmdbLocale)}`, {
      auth: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const results = Array.isArray(data) ? data : [];

    return results.map((movie: any) => ({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path
        ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
        : movie.posterUrl || null,
      backdropUrl: movie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : movie.backdropUrl || null,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      overview: movie.overview,
      genre: movie.genre || "Desconhecido",
    }));
  } catch (error) {
    console.error("Erro ao buscar filmes favoritos:", error);
    return [];
  }
};