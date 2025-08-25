import { Series } from "@/types/Series";
import { apiFetch } from "@/lib/api";

type Json = Record<string, unknown>;

function isRecord(v: unknown): v is Json {
  return typeof v === "object" && v !== null;
}

function asArray(v: unknown): Json[] {
  if (Array.isArray(v)) return v as Json[];
  if (isRecord(v) && Array.isArray((v as Json).results)) return (v as { results: unknown[] }).results as Json[];
  if (isRecord(v) && isRecord((v as Json).data) && Array.isArray(((v as Json).data as Json).results)) {
    return (((v as Json).data as { results: unknown[] }).results) as Json[];
  }
  return [];
}

function toSeries(item: Json): Series {
  const id = Number(item.id ?? 0);
  const name = String(item.name ?? item.title ?? "").trim();
  const posterPath = String(item.posterUrl ?? item.poster_path ?? "").trim();
  const backdropPath = String(item.backdropUrl ?? item.backdrop_path ?? "").trim();
  const vote_average = Number(item.vote_average ?? 0);
  const release_date =
    (item.first_air_date as string) ??
    (item.release_date as string) ??
    null;
  const overview = String(item.overview ?? "").trim();

  // alguns backends retornam um único "genre" (string) ou "genres" (array de strings)
  const genres: string[] =
    Array.isArray((item as any).genres)
      ? ((item as any).genres as unknown[]).map((g) => String(g))
      : (item as any).genre
        ? [String((item as any).genre)]
        : [];

  return {
    id,
    name,
    posterUrl: posterPath ? `https://image.tmdb.org/t/p/w300${posterPath}` : null,
    backdropUrl: backdropPath
      ? `https://image.tmdb.org/t/p/original${backdropPath}`
      : "/fallback.jpg",
    vote_average,
    release_date,
    overview,
    genres,
  };
}

export const fetchGenres = async (
  opts: { signal?: AbortSignal; locale?: string } = {}
): Promise<{ id: number; name: string }[]> => {
  try {
    const url = `/series/search/genres${opts.locale ? `?language=${opts.locale}` : ""}`;
    const data = await apiFetch(url, { auth: true, signal: opts.signal });
    if (!data) return [];
    if (isRecord(data) && Array.isArray((data as any).genres)) {
      return ((data as any).genres as any[]).map((g) => ({
        id: Number(g.id ?? 0),
        name: String(g.name ?? "").trim(),
      }));
    }
    return [];
  } catch (err) {
    console.error("Erro ao buscar gêneros:", err);
    return [];
  }
};

export const fetchSeriesByPage = async (
  page: number,
  year?: number,
  genreID?: number,
  title?: string,
  opts: { signal?: AbortSignal; locale?: string } = {}
): Promise<Series[]> => {
  try {
    const params = new URLSearchParams();
    params.set("page", String(page > 0 ? page : 1));
    if (title) params.set("title", title);
    if (year) params.set("year", String(year));
    if (genreID) params.set("genre", String(genreID));

    if (opts.locale) params.set("language", opts.locale); // <-- adiciona idioma

    const data = await apiFetch(`/series/search?${params.toString()}`, {
      auth: true,
      signal: opts.signal,
    });

    const results = asArray(data);
    return results.map(toSeries);
  } catch (err) {
    console.error("Erro ao buscar séries:", err);
    return [];
  }
};
