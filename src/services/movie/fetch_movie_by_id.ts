// services/movie/fetch_movie_by_id.ts
import { apiFetch } from "@/lib/api";
import { Movie } from "@/types/Movie";
import { mapNextIntlToTMDB, isTMDBLocale } from "@/i18n/localeMapping";

export const fetchMovieById = async (id: string, locale?: any): Promise<Movie | null> => {
  if (!id) {
    console.error("fetchMovieById: id vazio");
    return null;
  }

  let localeParam = "en-US"; // Padrão para TMDB
  
  // Se locale for um objeto (pode acontecer em alguns casos), extrair a string
  let localeString = locale;
  if (locale && typeof locale === 'object') {
    if (locale.locale) localeString = locale.locale;
    else if (locale.language) localeString = locale.language;
    else localeString = String(locale);
  }
  
  // Se for uma string válida, mapear para o formato TMDB
  if (typeof localeString === "string" && localeString.trim() !== "") {
    localeParam = isTMDBLocale(localeString) ? localeString : mapNextIntlToTMDB(localeString);
  }

  const encodedId = encodeURIComponent(id);
  const encodedLocale = encodeURIComponent(localeParam);
  const url = `/movie/${encodedId}/details?language=${encodedLocale}`;

  try {
    console.debug("[fetchMovieById] requesting:", url);
    const data: any = await apiFetch(url, { auth: true });

    if (!data) {
      console.warn("[fetchMovieById] resposta vazia (null/undefined)", url);
      return null;
    }

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
  } catch (error: any) {
    console.error("[fetchMovieById] erro ao buscar filme:", { url, message: error?.message ?? error, error });
    return null;
  }
};
