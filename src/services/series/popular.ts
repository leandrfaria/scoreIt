import { Series } from "@/types/Series";
import { apiFetch } from "@/lib/api";

type Json = Record<string, unknown>;

function isRecord(v: unknown): v is Json {
  return typeof v === "object" && v !== null;
}
function asArray(v: unknown): Json[] {
  if (Array.isArray(v)) return v as Json[];
  if (isRecord(v) && Array.isArray((v as any).results)) return (v as any).results as Json[];
  if (isRecord(v) && isRecord((v as any).data) && Array.isArray((v as any).data.results)) {
    return (v as any).data.results as Json[];
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
    genres: Array.isArray((item as any).genres)
      ? ((item as any).genres as unknown[]).map((g) => String(g))
      : (item as any).genre
      ? [String((item as any).genre)]
      : [],
  };
}

export const fetchPopularSeries = async (): Promise<Series[]> => {
  // ano aleatório entre 2022–2025 (mantendo seu comportamento)
  const randomYear = Math.floor(Math.random() * (2025 - 2022 + 1)) + 2022;

  try {
    const data = await apiFetch(`/series/year/${randomYear}/page/1`, { auth: true });
    const results = asArray(data);
    return results.map(toSeries);
  } catch (error) {
    console.error("Erro ao buscar séries populares:", error);
    return [];
  }
};
