// src/services/recommendations/recommendations.ts
import { apiFetch } from "@/lib/api";
import { Movie } from "@/types/Movie";
import { Series } from "@/types/Series";
import { fetchGenres, getGenreName, cachedGenres } from "@/services/movie/movies_list";

/** Normaliza um item de filme garantindo que os gêneros existam */
async function normalizeMovie(item: any, locale: string = "pt-BR"): Promise<Movie> {
  const poster = item.posterUrl ?? item.poster_path ?? null;
  const backdrop = item.backdropUrl ?? item.backdrop_path ?? null;
  const cacheKey = String(locale);

  // Garante que o cache de gêneros está populado
  if (!cachedGenres[cacheKey] || Object.keys(cachedGenres[cacheKey]).length === 0) {
    await fetchGenres(locale);
  }

  let genreIds: number[] = Array.isArray(item.genre_ids) ? item.genre_ids : [];
  let genreNames: string[] = [];

  // 1. Se item.genres já existe, usa ele
  if (Array.isArray(item.genres) && item.genres.length > 0) {
    genreNames = item.genres.map((g: any) => g.name).filter(Boolean);
    genreIds = item.genres.map((g: any) => g.id);
  } 
  // 2. Senão usa genre_ids + cache
  else if (genreIds.length > 0) {
    genreNames = genreIds.map(id => getGenreName(cacheKey, id)).filter(Boolean);
  }

  return {
    id: Number(item.id),
    title: String(item.title ?? item.name ?? ""),
    overview: String(item.overview ?? ""),
    release_date: String(item.release_date ?? item.first_air_date ?? ""),
    posterUrl: poster ? `https://image.tmdb.org/t/p/w300${poster}` : null,
    backdropUrl: backdrop ? `https://image.tmdb.org/t/p/original${backdrop}` : "/fallback.jpg",
    vote_average: Number(item.vote_average ?? 0),
    genre: genreNames.length > 0 ? genreNames.join(", ") : "Desconhecido",
    genres: genreIds.map((id, i) => ({ id, name: genreNames[i] ?? "Desconhecido" })),
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

/** Normaliza séries (idem ao que já tinha) */
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

/** Busca recomendações de filmes, igual ao now_playing */
export async function fetchMovieRecommendations(memberId: number, locale?: string): Promise<Movie[]> {
  try {
    const language = locale ?? "pt-BR";

    const path = `/recommendations/${memberId}/MOVIE?lang=${language}`;
    const raw = await apiFetch(path, { auth: true });
    const data = typeof raw === "string" ? JSON.parse(raw || "[]") : raw;
    const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

    // Normaliza com cache de gêneros garantido
    const normalized: Movie[] = [];
    for (const item of list) {
      normalized.push(await normalizeMovie(item, language));
    }

    return normalized;
  } catch (e) {
    console.error("Erro ao buscar recomendações de filmes:", e);
    return [];
  }
}

/** Busca recomendações de séries, idioma dinâmico */
export async function fetchSeriesRecommendations(memberId: number, locale?: string): Promise<Series[]> {
  try {
    const language = locale ?? "pt-BR";

    const path = `/recommendations/${memberId}/SERIES?lang=${language}`;
    const raw = await apiFetch(path, { auth: true });
    const data = typeof raw === "string" ? JSON.parse(raw || "[]") : raw;
    const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

    return list.map(normalizeSeries);
  } catch (e) {
    console.error("Erro ao buscar recomendações de séries:", e);
    return [];
  }
}
