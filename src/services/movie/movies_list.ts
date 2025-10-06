// services/movie/movies_list.ts
import { apiFetch } from "@/lib/api";
import { Movie } from "@/types/Movie";

declare global {  
  interface Window {
    __TMDB_GENRES__?: Record<string, Record<string, string>>;
  }
}

// Mapeia locale do Next.js para o TMDB
const mapLocaleToTMDBLanguage = (locale: string) => {
  if (!locale) return "pt-BR";
  const l = String(locale).toLowerCase();
  if (l.startsWith("pt")) return "pt-BR";
  if (l.startsWith("en")) return "en-US";
  return "pt-BR";
};

// Cache global para evitar múltiplas requisições
if (typeof window !== "undefined" && !window.__TMDB_GENRES__) {
  window.__TMDB_GENRES__ = {};
}
export const cachedGenres = (typeof window !== "undefined" ? window.__TMDB_GENRES__! : {}) as Record<
  string,
  Record<string, string>
>;

// Busca os gêneros do backend e atualiza o cache
export const fetchGenres = async (locale: string = "pt") => {
  const language = mapLocaleToTMDBLanguage(locale);
  const cacheKey = String(language);

  if (cachedGenres[cacheKey] && Object.keys(cachedGenres[cacheKey]).length > 0) {
    return Object.entries(cachedGenres[cacheKey]).map(([id, name]) => ({ id: parseInt(id), name }));
  }

  try {
    const response = await apiFetch(`/movie/search/genres?language=${language}`, { auth: true });
    const data = typeof response === "string" ? JSON.parse(response || "{}") : response;
    const genres = data?.genres ?? [];

    const genreMap: Record<string, string> = {};
    genres.forEach((g: any) => {
      if (g?.id != null && g?.name != null) {
        genreMap[String(g.id)] = g.name;
      }
    });

    cachedGenres[cacheKey] = genreMap;

    return genres.map((g: any) => ({ id: g.id, name: g.name }));
  } catch {
    return [];
  }
};

// Retorna nome do gênero pelo ID usando cache
export const getGenreName = (cacheKey: string, id: number | string) => {
  const map = cachedGenres[cacheKey] || {};
  return map[String(id)] ?? null;
};

// Busca filmes paginados com normalização de gêneros
export const fetchMoviesByPage = async (
  page: number,
  year?: number,
  genreID?: number,
  title?: string,
  locale: string = "pt"
): Promise<Movie[]> => {
  try {
    const language = mapLocaleToTMDBLanguage(locale);
    const cacheKey = String(language);

    // Garante que temos os gêneros no idioma correto
    if (!cachedGenres[cacheKey] || Object.keys(cachedGenres[cacheKey]).length === 0) {
      await fetchGenres(locale);
    }

    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("language", language);
    if (title) params.append("title", title);
    if (year) params.append("year", String(year));
    if (genreID) params.append("genre", String(genreID));

    const data: any = await apiFetch(`/movie/search?${params.toString()}`, { auth: true });
    const results = data?.results ?? [];

    return results.map((movie: any) => {
      // Normaliza os gêneros
      let genreNames = "Desconhecido";
      let genreIds: number[] = [];

      if (Array.isArray(movie.genres) && movie.genres.length > 0) {
        // Usa sempre o campo 'genres' do backend se disponível
        genreNames = movie.genres.map((g: any) => g.name).filter(Boolean).join(", ");
        genreIds = movie.genres.map((g: any) => g.id).filter(Boolean);
      } else if (Array.isArray(movie.genre_ids) && movie.genre_ids.length > 0) {
        // Fallback: usa genre_ids + cache
        genreIds = movie.genre_ids;
        const names = genreIds
          .map((id) => getGenreName(cacheKey, id))
          .filter(Boolean);
        if (names.length > 0) genreNames = names.join(", ");
      } else if (movie.genre) {
        genreNames = String(movie.genre);
      }

      return {
        id: movie.id,
        title: movie.title,
        posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : null,
        backdropUrl: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : "/fallback.jpg",
        vote_average: movie.vote_average ?? 0,
        release_date: movie.release_date ?? "",
        overview: movie.overview ?? "",
        genre: genreNames,
        genre_ids: genreIds,
        genres:
          Array.isArray(movie.genres) && movie.genres.length > 0
            ? movie.genres.map((g: any) => ({ id: g.id, name: g.name }))
            : genreIds.map((id) => ({ id, name: getGenreName(cacheKey, id) || "Desconhecido" })),
      };
    });
  } catch (err) {
    console.error("Erro ao buscar filmes:", err);
    return [];
  }
};
