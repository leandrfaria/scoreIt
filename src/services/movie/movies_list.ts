// services/movie/movies_list.ts
import { apiFetch } from "@/lib/api";
import { Movie } from "@/types/Movie";

declare global {
  interface Window {
    __TMDB_GENRES__?: Record<string, Record<string, string>>;
  }
}

const mapLocaleToTMDBLanguage = (locale: string) => {
  if (!locale) return "pt-BR";
  const l = String(locale).toLowerCase();
  if (l.startsWith("pt")) return "pt-BR";
  if (l.startsWith("en")) return "en-US";
  return "pt-BR";
};

// Cache global para evitar múltiplas instâncias
if (typeof window !== "undefined" && !window.__TMDB_GENRES__) {
  window.__TMDB_GENRES__ = {};
}
export const cachedGenres = (typeof window !== "undefined" ? window.__TMDB_GENRES__! : {}) as Record<
  string,
  Record<string, string>
>;

export const fetchGenres = async (locale: string = "pt") => {
  const language = mapLocaleToTMDBLanguage(locale);
  const cacheKey = String(language);

  if (cachedGenres[cacheKey] && Object.keys(cachedGenres[cacheKey]).length > 0) {
    return Object.entries(cachedGenres[cacheKey]).map(([id, name]) => ({ 
      id: parseInt(id), 
      name 
    }));
  }

  try {
    const response = await apiFetch(`/movie/search/genres?language=${language}`, { auth: true });
    
    // O backend retorna uma string JSON, então precisamos parsear
    let data;
    if (typeof response === 'string') {
      try {
        data = JSON.parse(response);
      } catch (parseError) {
        data = {};
      }
    } else {
      data = response;
    }
    
    const genres = data?.genres || [];

    const genreMap: Record<string, string> = {};
    genres.forEach((g: any) => {
      if (g && g.id != null && g.name != null) {
        genreMap[String(g.id)] = g.name;
      }
    });

    cachedGenres[cacheKey] = genreMap;
    
    return genres.map((g: any) => ({ id: g.id, name: g.name }));
  } catch (err) {
    return [];
  }
};

export const getGenreName = (cacheKey: string, id: number | string) => {
  const map = cachedGenres[cacheKey] || {};
  return map[String(id)] ?? null;
};

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

    // Garante que temos os gêneros antes de buscar filmes
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
      // Tenta obter gêneros de várias fontes possíveis
      let genreNames = "Desconhecido";
      let genreIds: number[] = [];
      
      // 1. Primeiro tenta usar movie.genres (array de objetos)
      if (movie.genres && Array.isArray(movie.genres) && movie.genres.length > 0) {
        genreNames = movie.genres.map((g: any) => g.name).join(", ");
        genreIds = movie.genres.map((g: any) => g.id);
      } 
      // 2. Se não, tenta usar movie.genre_ids + cache
      else if (movie.genre_ids && Array.isArray(movie.genre_ids)) {
        genreIds = movie.genre_ids;
        const names = genreIds.map((id) => {
          const name = getGenreName(cacheKey, id);
          return name || "Desconhecido";
        });
        genreNames = names.join(", ");
      }
      // 3. Se ainda não, verifica se há um campo de gênero direto
      else if (movie.genre) {
        genreNames = movie.genre;
      }


      return {
        id: movie.id,
        title: movie.title,
        posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : null,
        backdropUrl: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
        vote_average: movie.vote_average,
        release_date: movie.release_date,
        overview: movie.overview,
        genre: genreNames,
        genre_ids: genreIds,
        genres: movie.genres || genreIds.map(id => ({ id, name: getGenreName(cacheKey, id) || "Desconhecido" }))
      };
    });
  } catch (err) {
    return [];
  }
};