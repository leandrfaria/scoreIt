// src/services/recommendations/recommendations.ts
import { apiFetch } from "@/lib/api";
import { Movie } from "@/types/Movie";
import { Series } from "@/types/Series";

/**
 * Normaliza um item vindo do backend para o tipo Movie do front.
 * Aceita campos no padrão TMDB (poster_path/backdrop_path/genre_ids/genres) ou já normalizados.
 */
function normalizeMovie(item: any): Movie {
  const poster = item.posterUrl ?? item.poster_path ?? null;
  const backdrop = item.backdropUrl ?? item.backdrop_path ?? null;

  // nomes de gêneros
  let genreNames = "Desconhecido";
  let genreIds: number[] = [];
  let genresArr: { id: number; name: string }[] = [];

  if (item.genres && Array.isArray(item.genres) && item.genres.length > 0) {
    // pode ser array de objetos {id, name} ou strings
    if (typeof item.genres[0] === "string") {
      genreNames = (item.genres as string[]).join(", ");
      genresArr = (item.genres as string[]).map((n) => ({ id: 0, name: n }));
    } else {
      genreNames = item.genres.map((g: any) => g?.name).filter(Boolean).join(", ") || "Desconhecido";
      genresArr = item.genres.map((g: any) => ({ id: Number(g?.id ?? 0), name: String(g?.name ?? "Desconhecido") }));
      genreIds = item.genres.map((g: any) => Number(g?.id ?? 0)).filter(Boolean);
    }
  } else if (item.genre_ids && Array.isArray(item.genre_ids)) {
    genreIds = item.genre_ids.map((id: any) => Number(id)).filter(Boolean);
    // quando só temos ids, deixo a string como "Desconhecido" e passo os ids em genre_ids
    genreNames = item.genre ?? "Desconhecido";
    genresArr = (item.genres ?? []).map((g: any) => ({ id: Number(g?.id ?? 0), name: String(g?.name ?? "Desconhecido") }));
  } else if (item.genre) {
    genreNames = String(item.genre);
  }

  return {
    id: Number(item.id),
    title: String(item.title ?? item.name ?? ""),
    overview: String(item.overview ?? ""),
    release_date: String(item.release_date ?? item.first_air_date ?? ""),
    posterUrl: poster ? `https://image.tmdb.org/t/p/w300${poster}` : null,
    backdropUrl: backdrop ? `https://image.tmdb.org/t/p/original${backdrop}` : "/fallback.jpg",
    vote_average: Number(item.vote_average ?? 0),
    genre: genreNames,
    genre_ids: genreIds.length ? genreIds : item.genre_ids,
    genres: genresArr.length ? genresArr : item.genres,
    runtime: item.runtime,
    language: item.language,
    certification: item.certification,
    status: item.status,
    budget: item.budget,
    revenue: item.revenue,
    cast: item.cast,
    directors: item.directors,
    recommendations: item.recommendations,
    similar: item.similar,
  };
}

/**
 * Normaliza um item vindo do backend para o tipo Series do front.
 */
function normalizeSeries(item: any): Series {
  const poster = item.posterUrl ?? item.poster_path ?? null;
  const backdrop = item.backdropUrl ?? item.backdrop_path ?? null;

  // gêneros
  let genresStrArr: string[] = [];
  let genreStr = "Desconhecido";
  let genreIds: number[] = [];
  let genresObj: { id?: number; name: string }[] = [];

  if (item.genres && Array.isArray(item.genres) && item.genres.length > 0) {
    if (typeof item.genres[0] === "string") {
      genresStrArr = item.genres as string[];
      genreStr = genresStrArr.join(", ");
      genresObj = genresStrArr.map((n) => ({ name: n }));
    } else {
      genresObj = item.genres.map((g: any) => ({ id: Number(g?.id ?? 0), name: String(g?.name ?? "Desconhecido") }));
      genreStr = genresObj.map((g) => g.name).join(", ") || "Desconhecido";
      genreIds = genresObj.map((g) => Number(g?.id ?? 0)).filter(Boolean);
      genresStrArr = genresObj.map((g) => g.name);
    }
  } else if (item.genre_ids && Array.isArray(item.genre_ids)) {
    genreIds = item.genre_ids.map((id: any) => Number(id)).filter(Boolean);
    genreStr = item.genre ?? "Desconhecido";
  } else if (item.genre) {
    genreStr = String(item.genre);
  }

  const s: Series = {
    id: Number(item.id),
    name: String(item.name ?? item.title ?? ""),
    posterUrl: poster ? `https://image.tmdb.org/t/p/w300${poster}` : null,
    backdropUrl: backdrop ? `https://image.tmdb.org/t/p/original${backdrop}` : "/fallback.jpg",
    vote_average: Number(item.vote_average ?? 0),
    release_date: String(item.first_air_date ?? item.release_date ?? ""),
    overview: String(item.overview ?? ""),
    genres: genresStrArr.length ? genresStrArr : (item.genres?.map((g: any) => g?.name)?.filter(Boolean) ?? []),
  };

  (s as any).genre = genreStr;
  (s as any).genre_ids = genreIds.length ? genreIds : item.genre_ids;
  (s as any).genresObj = genresObj.length ? genresObj : item.genres;

  return s;
}

/**
 * Busca recomendações de FILMES para um membro.
 * Se o usuário não tiver reviews, o backend retorna array/objeto vazio — tratamos e retornamos [].
 * Linguagem hardcoded PT-BR quando aplicável.
 */
export async function fetchMovieRecommendations(memberId: number): Promise<Movie[]> {
  try {
    // alguns backends aceitam language — se não aceitar, não quebra.
    const path = `/recommendations/${memberId}/MOVIE?language=pt-BR`;
    const raw = await apiFetch(path, { auth: true });

    // o backend pode devolver string JSON
    const data = typeof raw === "string" ? JSON.parse(raw || "[]") : raw;
    const list: any[] = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

    return list.map(normalizeMovie);
  } catch (e) {
    console.error("Erro ao buscar recomendações de filmes:", e);
    return [];
  }
}

/**
 * Busca recomendações de SÉRIES para um membro.
 * Se o usuário não tiver reviews, o backend retorna array/objeto vazio — tratamos e retornamos [].
 * Linguagem hardcoded PT-BR quando aplicável.
 */
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
