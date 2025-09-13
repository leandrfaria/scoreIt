// services/series/fetch_series_by_id.ts
import { apiFetch } from "@/lib/api";
import { Series } from "@/types/Series";
import { mapNextIntlToTMDB, isTMDBLocale } from "@/i18n/localeMapping";

export const fetchSerieById = async (id: string, locale?: any): Promise<Series | null> => {
  if (!id) {
    console.error("fetchSerieById: id vazio");
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
  const url = `/series/${encodedId}/details?language=${encodedLocale}`;

  try {
    console.debug("[fetchSerieById] requesting:", url);
    const data: any = await apiFetch(url, { auth: true });

    if (!data) {
      console.warn("[fetchSerieById] resposta vazia (null/undefined)", url);
      return null;
    }

    const posterPath = data.posterUrl ?? data.poster_path ?? null;
    const backdropPath = data.backdropUrl ?? data.backdrop_path ?? null;

    const genresFromArray = Array.isArray(data.genres)
      ? data.genres.map((g: any) => (typeof g === "string" ? g : g?.name)).filter(Boolean)
      : [];

    const serie: Series = {
      id: Number(data.id ?? 0),
      name: String(data.name ?? data.title ?? "").trim(),
      overview: String(data.overview ?? "").trim(),
      release_date: data.first_air_date ?? data.release_date ?? null,
      posterUrl: posterPath
        ? posterPath.startsWith("http")
          ? posterPath
          : `https://image.tmdb.org/t/p/w300${posterPath}`
        : null,
      backdropUrl: backdropPath
        ? backdropPath.startsWith("http")
          ? backdropPath
          : `https://image.tmdb.org/t/p/original${backdropPath}`
        : "/fallback.jpg",
      vote_average: Number(data.vote_average ?? 0),
      genres: genresFromArray,
    };

    if (!serie.id || !serie.name) {
      console.warn("[fetchSerieById] dados incompletos", data);
      return null;
    }

    return serie;
  } catch (error: any) {
    console.error("[fetchSerieById] erro ao buscar série:", { url, message: error?.message ?? error, error });
    return null;
  }
};