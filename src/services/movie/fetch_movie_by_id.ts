import { apiFetch } from "@/lib/api";
import { Movie } from "@/types/Movie";

export const fetchMovieById = async (id: string): Promise<Movie | null> => {
  try {
    const data: any = await apiFetch(`/movie/${id}/details`, { auth: true });

    const poster = data.posterUrl ?? data.poster_path ?? null;
    const backdrop = data.backdropUrl ?? data.backdrop_path ?? null;

    const genresFromArray =
      Array.isArray(data.genres)
        ? data.genres.map((g: any) => (typeof g === "string" ? g : g?.name)).filter(Boolean)
        : [];

    return {
      id: data.id,
      title: data.title,
      overview: data.overview,
      release_date: data.release_date,
      posterUrl: poster,
      backdropUrl: backdrop,
      vote_average: data.vote_average,
      genre: genresFromArray[0] || "Desconhecido",
      genres: genresFromArray,
      runtime: data.runtime,
      language: data.original_language ?? data.language,
      certification: data.certification,
      status: data.status,
      budget: data.budget,
      revenue: data.revenue,
      cast: data.cast || [],
      directors: data.directors || [],
      recommendations: data.recommendations || [],
      similar: data.similar || [],
    };
  } catch (error) {
    console.error("Erro ao buscar filme:", error);
    return null;
  }
};
