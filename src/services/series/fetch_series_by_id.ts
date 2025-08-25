import { Series } from "@/types/Series";
import { apiFetch } from "@/lib/api";

export const fetchSerieById = async (id: string, locale: string | undefined): Promise<Series | null> => {
  try {
    const data = await apiFetch(`/series/${id}/details`, { auth: true, cache: "no-store" });

    const posterPath = String((data as any).posterUrl ?? (data as any).poster_path ?? "").trim();
    const backdropPath = String((data as any).backdropUrl ?? (data as any).backdrop_path ?? "").trim();

    const genres: string[] =
      Array.isArray((data as any).genres)
        ? ((data as any).genres as unknown[]).map((g) =>
            typeof g === "string" ? g : String((g as any).name ?? g)
          )
        : (data as any).genre
        ? [String((data as any).genre)]
        : [];

    const serie: Series = {
      id: Number((data as any).id ?? 0),
      name: String((data as any).name ?? (data as any).title ?? "").trim(),
      overview: String((data as any).overview ?? "").trim(),
      release_date:
        ((data as any).first_air_date as string) ??
        ((data as any).release_date as string) ??
        null,
      posterUrl: posterPath ? posterPath.startsWith("http") ? posterPath : `https://image.tmdb.org/t/p/w300${posterPath}` : null,
      backdropUrl: backdropPath
        ? backdropPath.startsWith("http")
          ? backdropPath
          : `https://image.tmdb.org/t/p/original${backdropPath}`
        : "/fallback.jpg",
      vote_average: Number((data as any).vote_average ?? 0),
      genres,
    };

    if (!serie.id || !serie.name) return null;
    return serie;
  } catch (error) {
    console.error("Erro ao buscar detalhes da série:", error);
    return null;
  }
};
