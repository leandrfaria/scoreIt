import { apiFetch } from "@/lib/api";
import { Movie } from "@/types/Movie";

const mapLocaleToTMDBLanguage = (locale: string) => {
  const mapping: { [key: string]: string } = {
    'pt': 'pt-BR',
    'en': 'en-US'
  };
  return mapping[locale] || 'pt-BR';
};

let cachedGenres: Record<number, string> = {};

export const fetchGenres = async (locale: string = "pt") => {
  const language = mapLocaleToTMDBLanguage(locale);
  try {
    const data: any = await apiFetch(`/movie/search/genres?language=${language}`, {
      auth: true
    });
    const genres = data.genres || [];
    cachedGenres = Object.fromEntries(genres.map((g: any) => [g.id, g.name]));
    return genres;
  } catch (error) {
    console.error("Erro ao buscar gêneros:", error);
    return [];
  }
};

export const fetchMoviesByPage = async (
  page: number,
  year?: number,
  genreID?: number,
  title?: string,
  locale: string = "pt"
): Promise<Movie[]> => {
  try {
    const language = mapLocaleToTMDBLanguage(locale);
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("language", language);

    if (title) params.append("title", title);
    if (year) params.append("year", year.toString());
    if (genreID) params.append("genre", genreID.toString());

    // garante que temos o mapa de gêneros
    if (Object.keys(cachedGenres).length === 0) {
      await fetchGenres(locale);
    }

    const data: any = await apiFetch(`/movie/search?${params.toString()}`, {
      auth: true
    });
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
      genre: (movie.genre_ids || [])
        .map((id: number) => cachedGenres[id] || "Desconhecido")
        .join(", ") || "Desconhecido"
    }));
  } catch (error) {
    console.error("Erro ao buscar filmes:", error);
    return [];
  }
};
