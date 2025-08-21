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
  if (!id || !name) {
    return {
      id: 0,
      name: "Desconhecido",
      posterUrl: "/fallback.jpg",
      backdropUrl: "/fallback.jpg",
      vote_average: 0,
      release_date: null,
      overview: "Sem descrição disponível.",
      genres: [],
    };
  }

  const posterPath = String(item.posterUrl ?? item.poster_path ?? "").trim();
  const backdropPath = String(item.backdropUrl ?? item.backdrop_path ?? "").trim();
  const vote_average = Number(item.vote_average ?? 0);
  const release_date =
    (item.first_air_date as string) ?? (item.release_date as string) ?? null;
  const overview = String(item.overview ?? "").trim();

  const genres: string[] = Array.isArray((item as any).genres)
    ? (item as any).genres.map((g: unknown) => String(g))
    : (item as any).genre
    ? [String((item as any).genre)]
    : [];

  return {
    id,
    name,
    posterUrl: posterPath ? `https://image.tmdb.org/t/p/w300${posterPath}` : "/fallback.jpg",
    backdropUrl: backdropPath
      ? `https://image.tmdb.org/t/p/original${backdropPath}`
      : "/fallback.jpg",
    vote_average,
    release_date,
    overview: overview || "Sem descrição disponível.",
    genres,
  };
}

/**
 * Busca as séries favoritas do usuário.
 */
export const fetchFavouriteSeries = async (
  _token: string,
  memberId: string
): Promise<Series[]> => {
  if (!memberId) return [];

  try {
    const data = await apiFetch(`/series/favorites/${memberId}`, { auth: true });
    const results = asArray(data);
    return results.map(toSeries).filter((s) => s.id !== 0);
  } catch (error) {
    console.error("❌ Erro ao buscar séries favoritas:", error);
    return [];
  }
};
