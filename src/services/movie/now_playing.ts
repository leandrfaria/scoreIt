// services/movie/now_playing.ts
import { apiFetch } from "@/lib/api";
import { Movie } from "@/types/Movie";
import { mapNextIntlToTMDB } from "@/i18n/localeMapping";
import { fetchGenres, getGenreName, cachedGenres } from "./movies_list";

export const fetchNowPlayingMovies = async (locale: string): Promise<Movie[]> => {
  try {
    const tmdbLocale = mapNextIntlToTMDB(locale);
    const fallbackLocale = locale.startsWith("pt") ? "en-US" : "pt-BR";

    // Garantir que os gêneros estão no cache
    if (!cachedGenres[tmdbLocale] || Object.keys(cachedGenres[tmdbLocale]).length === 0) {
      await fetchGenres(tmdbLocale);
    }

    const data: any = await apiFetch(`/movie/now/1?language=${tmdbLocale}`, { auth: true });
    let results: any[] = data.results || data.data?.results || data || [];

    // Fallback se muitos filmes não têm título/overview
    if (results.length === 0 || hasIncompleteTranslations(results)) {
      const fallbackData: any = await apiFetch(`/movie/now/1?language=${fallbackLocale}`, { auth: true });
      const fallbackResults: any[] = fallbackData.results || fallbackData.data?.results || fallbackData || [];
      results = mergeResults(results, fallbackResults);
    }

    if (!Array.isArray(results)) return [];

    // Transformar cada filme, mapeando genre_ids para nomes
    const transformed: Movie[] = results.map((movie: any) => {
      const genreIds: number[] = Array.isArray(movie.genre_ids) ? movie.genre_ids : [];
      const genreNames = genreIds
        .map(id => getGenreName(tmdbLocale, id))
        .filter(Boolean);

      return {
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
        genre: genreNames.length > 0 ? genreNames.join(", ") : "Desconhecido",
      };
    });

    return transformed;
  } catch (error) {
    console.error("❌ Erro ao buscar filmes em cartaz:", error);
    return [];
  }
};

// --- helpers ---
function hasIncompleteTranslations(results: any[]): boolean {
  const incompleteCount = results.filter(
    movie => !movie.title || !movie.title.trim() || !movie.overview || !movie.overview.trim()
  ).length;
  return incompleteCount > results.length / 2;
}

function mergeResults(primary: any[], fallback: any[]): any[] {
  const merged = [...primary];
  fallback.forEach(fbMovie => {
    const index = merged.findIndex(m => m.id === fbMovie.id);
    if (index === -1) {
      merged.push(fbMovie);
    } else {
      const existing = merged[index];
      if (!existing.title || !existing.overview) {
        merged[index] = {
          ...existing,
          title: existing.title || fbMovie.title,
          overview: existing.overview || fbMovie.overview,
        };
      }
    }
  });
  return merged;
}
