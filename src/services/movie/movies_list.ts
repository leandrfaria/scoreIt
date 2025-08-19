import { apiFetch } from "@/lib/api";
import { Movie } from "@/types/Movie";

export const fetchGenres = async (): Promise<{ id: number; name: string }[]> => {
  try {
    const data: any = await apiFetch(`/movie/search/genres`, { auth: true });
    return data.genres || [];
  } catch (error) {
    console.error("Erro ao buscar gêneros:", error);
    return [];
  }
};

export const fetchMoviesByPage = async (
  page: number,
  year?: number,
  genreID?: number,
  title?: string
): Promise<Movie[]> => {
  try {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    if (title) params.append("title", title);
    if (year) params.append("year", year.toString());
    if (genreID) params.append("genre", genreID.toString());

    const data: any = await apiFetch(`/movie/search?${params.toString()}`, { auth: true });
    const results = data.results || [];

    return results.map((movie: any) => ({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path
        ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
        : movie.posterUrl ?? null,
      backdropUrl: movie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : movie.backdropUrl ?? null,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      overview: movie.overview,
      genre: movie.genre || "Desconhecido",
    }));
  } catch (error) {
    console.error("Erro ao buscar filmes:", error);
    return [];
  }
};
