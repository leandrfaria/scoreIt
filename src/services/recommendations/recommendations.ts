// src/services/recommendations/recommendations.ts
import { apiFetch } from "@/lib/api";
import { Movie } from "@/types/Movie";
import { Series } from "@/types/Series";
import { fetchGenres, getGenreName, cachedGenres } from "@/services/movie/movies_list";

function normalizeMovie(item: any, locale: string = "pt-BR"): Movie {
  const poster = item.posterUrl ?? item.poster_path ?? null;
  const backdrop = item.backdropUrl ?? item.backdrop_path ?? null;
  const cacheKey = String(locale);

  let genresArr: { id: number; name: string }[] = [];
  let genre = "Desconhecido";
  let genreIds: number[] = [];

  // 1. Se já temos movie.genres do backend
  if (item.genres && Array.isArray(item.genres) && item.genres.length > 0) {
    genresArr = item.genres.map((g: any) => ({
      id: Number(g.id ?? 0),
      name: String(g.name ?? "Desconhecido"),
    }));
    genreIds = genresArr.map(g => g.id);
    genre = genresArr.map(g => g.name).join(", ");
  } 
  // 2. Se não, tenta mapear genre_ids usando o cache
  else if (item.genre_ids && Array.isArray(item.genre_ids)) {
    genreIds = item.genre_ids.map((id: any) => Number(id));
    genresArr = genreIds.map(id => ({ id, name: getGenreName(cacheKey, id) ?? "Desconhecido" }));
    genre = genresArr.map(g => g.name).join(", ");
  } 
  // 3. Se ainda tiver só um campo genre
  else if (item.genre) {
    genre = String(item.genre);
    genresArr = [{ id: 0, name: genre }];
    genreIds = [];
  }

  return {
    id: Number(item.id),
    title: String(item.title ?? item.name ?? ""),
    overview: String(item.overview ?? ""),
    release_date: String(item.release_date ?? item.first_air_date ?? ""),
    posterUrl: poster ? `https://image.tmdb.org/t/p/w300${poster}` : null,
    backdropUrl: backdrop ? `https://image.tmdb.org/t/p/original${backdrop}` : "/fallback.jpg",
    vote_average: Number(item.vote_average ?? 0),
    genre,
    genres: genresArr,
    genre_ids: genreIds,
    runtime: item.runtime,
    language: item.language ?? item.original_language,
    certification: item.certification,
    status: item.status,
    budget: item.budget,
    revenue: item.revenue,
    cast: item.cast ?? [],
    directors: item.directors ?? [],
    recommendations: item.recommendations ?? [],
    similar: item.similar ?? [],
  };
}


/** Normaliza um item para Series */
function normalizeSeries(item: any): Series {
  const poster = item.posterUrl ?? item.poster_path ?? null;
  const backdrop = item.backdropUrl ?? item.backdrop_path ?? null;

  let genresArr: string[] = [];
  if (Array.isArray(item.genres)) {
    genresArr = item.genres.map((g: any) => (typeof g === "string" ? g : g?.name)).filter(Boolean);
  }
  const genre = genresArr[0] ?? "Desconhecido";

  return {
    id: Number(item.id),
    name: String(item.name ?? item.title ?? ""),
    posterUrl: poster ? `https://image.tmdb.org/t/p/w300${poster}` : null,
    backdropUrl: backdrop ? `https://image.tmdb.org/t/p/original${backdrop}` : "/fallback.jpg",
    vote_average: Number(item.vote_average ?? 0),
    release_date: String(item.first_air_date ?? item.release_date ?? ""),
    overview: String(item.overview ?? ""),
    genres: genresArr,
    genre,
  };
}

export async function fetchMovieRecommendations(memberId: number, locale?: string): Promise<Movie[]> {
  try {
    // 1. Mapear locale do Next.js para TMDB
    const language = locale ?? "pt-BR"; // ou use função mapNextIntlToTMDB(locale)
    const cacheKey = String(language);

    // 2. Garante que temos os gêneros no idioma certo
    if (!cachedGenres[cacheKey] || Object.keys(cachedGenres[cacheKey]).length === 0) {
      await fetchGenres(language);
    }

    // 3. Buscar recomendações com o mesmo idioma
    const path = `/recommendations/${memberId}/MOVIE?language=${language}`;
    const raw = await apiFetch(path, { auth: true });

    const data = typeof raw === "string" ? JSON.parse(raw || "[]") : raw;
    const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

    // 4. Normalizar passando o idioma
    return list.map(item => normalizeMovie(item, language));
  } catch (e) {
    console.error("Erro ao buscar recomendações de filmes:", e);
    return [];
  }
}


/** Busca recomendações de séries para um membro */
export async function fetchSeriesRecommendations(memberId: number): Promise<Series[]> {
  try {
    const path = `/recommendations/${memberId}/SERIES?language=pt-BR`;
    const raw = await apiFetch(path, { auth: true });

    const data = typeof raw === "string" ? JSON.parse(raw || "[]") : raw;
    const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

    return list.map(normalizeSeries);
  } catch (e) {
    console.error("Erro ao buscar recomendações de séries:", e);
    return [];
  }
}
