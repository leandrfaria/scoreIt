import { Series } from "@/types/Series";
import { apiFetch } from "@/lib/api";
import { fetchGenres, cachedGenres, getGenreName } from "@/services/movie/movies_list";
import { mapNextIntlToTMDB, isTMDBLocale } from "@/i18n/localeMapping";

export const fetchFavouriteSeries = async (
  _token: string,
  memberId: string,
  locale: string
): Promise<Series[]> => {
  if (!memberId) return [];

  try {
    // Mapeia o locale para TMDb
    const tmdbLocale = isTMDBLocale(locale) ? locale : mapNextIntlToTMDB(locale);
    const cacheKey = tmdbLocale;

    // 🔹 1️⃣ Carrega cache de gêneros no idioma correto
    if (!cachedGenres[cacheKey] || Object.keys(cachedGenres[cacheKey]).length === 0) {
      await fetchGenres(tmdbLocale); // isso garante que cachedGenres[cacheKey] está preenchido
    }

    // 🔹 2️⃣ Busca séries favoritas do backend
    const data: any = await apiFetch(`/series/favorites/${memberId}?language=${encodeURIComponent(tmdbLocale)}`, { auth: true });
    let results = Array.isArray(data) ? data : [];

    // 🔹 Fallback se traduções incompletas
    if (results.length === 0 || hasIncompleteTranslations(results)) {
      const fallbackLocale = tmdbLocale.startsWith("pt") ? "en-US" : "pt-BR";
      const fallbackData: any = await apiFetch(`/series/favorites/${memberId}?language=${encodeURIComponent(fallbackLocale)}`, { auth: true });
      const fallbackResults = Array.isArray(fallbackData) ? fallbackData : [];
      results = mergeResults(results, fallbackResults);
    }

    // 🔹 3️⃣ Mapeia as séries usando o cache de gêneros do idioma correto
    return results.map((item) => mapSeriesGenres(item, cacheKey)).filter((s) => s.id !== 0);
  } catch (error) {
    console.error("❌ Erro ao buscar séries favoritas:", error);
    return [];
  }
};

// Mapeia uma série e converte os gêneros usando cache
function mapSeriesGenres(item: any, cacheKey: string): Series {
  const id = Number(item.id ?? 0);
  const name = String(item.name ?? item.title ?? "").trim() || "Desconhecido";
  const posterPath = String(item.posterUrl ?? item.poster_path ?? "").trim();
  const backdropPath = String(item.backdropUrl ?? item.backdrop_path ?? "").trim();
  const vote_average = Number(item.vote_average ?? 0);
  const release_date = (item.first_air_date ?? item.release_date) ?? null;
  const overview = String(item.overview ?? "Sem descrição disponível.").trim();

  // Usa genre_ids + cache para nomes traduzidos
  const genreIds: number[] = Array.isArray(item.genre_ids) ? item.genre_ids : [];
  const genres = genreIds.length > 0
    ? genreIds.map((id) => getGenreName(cacheKey, id) || "Desconhecido")
    : Array.isArray(item.genres)
      ? item.genres.map((g: any) => String(g.name ?? g))
      : item.genre
        ? [String(item.genre)]
        : [];

  return {
    id,
    name,
    posterUrl: posterPath ? `https://image.tmdb.org/t/p/w300${posterPath}` : "/fallback.jpg",
    backdropUrl: backdropPath ? `https://image.tmdb.org/t/p/original${backdropPath}` : "/fallback.jpg",
    vote_average,
    release_date,
    overview,
    genres
  };
}


// 🔹 Verifica traduções incompletas
function hasIncompleteTranslations(results: any[]): boolean {
  const incompleteCount = results.filter(
    (series) => !series.name || series.name === "" || !series.overview || series.overview === ""
  ).length;
  return incompleteCount > results.length / 2;
}

// 🔹 Mescla resultados
function mergeResults(primary: any[], fallback: any[]): any[] {
  const merged = [...primary];
  fallback.forEach((fbSeries) => {
    const existingIndex = merged.findIndex((s) => s.id === fbSeries.id);
    if (existingIndex === -1) {
      merged.push(fbSeries);
    } else {
      const existing = merged[existingIndex];
      if (!existing.name || !existing.overview) {
        merged[existingIndex] = {
          ...existing,
          name: existing.name || fbSeries.name,
          overview: existing.overview || fbSeries.overview,
        };
      }
    }
  });
  return merged;
}
