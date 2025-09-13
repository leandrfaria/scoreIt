// src/services/movie/popular.ts
import { apiFetch } from "@/lib/api";
import { Movie } from "@/types/Movie";

type Json = Record<string, unknown>;
const FALLBACK_IMG = "/fallback.jpg";

function isRecord(v: unknown): v is Json {
  return typeof v === "object" && v !== null;
}

function extractResults(payload: unknown): Json[] {
  if (Array.isArray(payload)) return payload as Json[];
  if (isRecord(payload) && Array.isArray((payload as Json).results)) {
    return (payload as { results: unknown[] }).results as Json[];
  }
  if (
    isRecord(payload) &&
    isRecord((payload as Json).data) &&
    Array.isArray(((payload as Json).data as Json).results)
  ) {
    return (((payload as Json).data as { results: unknown[] }).results) as Json[];
  }
  return [];
}

export const fetchMovies = async (locale: string): Promise<Movie[]> => {
  try {
    // Adicione o parâmetro de idioma à URL
    const data: unknown = await apiFetch(`/movie/get/page/1?language=${locale}`, { auth: true });
    const results = extractResults(data);

    const transformed: Movie[] = results.map((m): Movie => {
      const id = typeof m.id === "number" ? m.id : Number(m.id ?? 0);
      const title = typeof m.title === "string" ? m.title : "";
      const poster_path = typeof m.poster_path === "string" ? m.poster_path : null;
      const posterUrlApi = typeof m.posterUrl === "string" ? m.posterUrl : null;
      const backdrop_path = typeof m.backdrop_path === "string" ? m.backdrop_path : null;
      const backdropUrlApi = typeof m.backdropUrl === "string" ? m.backdropUrl : null;
      const vote_average = typeof m.vote_average === "number" ? m.vote_average : 0;
      const release_date = typeof m.release_date === "string" ? m.release_date : "";
      const overview = typeof m.overview === "string" ? m.overview : "";
      const genre = typeof m.genre === "string" ? m.genre : "Desconhecido";

      const posterUrl =
        poster_path
          ? `https://image.tmdb.org/t/p/w300${poster_path}`
          : posterUrlApi ?? FALLBACK_IMG;

      const backdropUrl =
        backdrop_path
          ? `https://image.tmdb.org/t/p/original${backdrop_path}`
          : backdropUrlApi ?? FALLBACK_IMG;

      return {
        id,
        title,
        posterUrl,     // 🔒 sempre string
        backdropUrl,   // 🔒 sempre string
        vote_average,
        release_date,
        overview,
        genre,
      };
    });

    return transformed;
  } catch (error) {
    console.error("Erro ao buscar filmes:", error);
    return [];
  }
};