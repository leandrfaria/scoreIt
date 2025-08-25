import { Series } from "@/types/Series";
import { apiFetch } from "@/lib/api";
import { mapNextIntlToTMDB } from "@/i18n/localeMapping";

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
    ? (item as any).genres.map((g: any) => String(g.name ?? g)) // pega o nome se existir
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
  memberId: string,
  locale: string
): Promise<Series[]> => {
  if (!memberId) return [];

  try {
    const tmdbLocale = mapNextIntlToTMDB(locale);
    const fallbackLocale = locale.startsWith("pt") ? "en-US" : "pt-BR";

    // Busca no idioma solicitado
    const data: any = await apiFetch(`/series/favorites/${memberId}?language=${tmdbLocale}`, { auth: true });
    let results = asArray(data);

    // Se resultados estiverem incompletos, busca fallback
    if (results.length === 0 || hasIncompleteTranslations(results)) {
      console.log("Tentando fallback para:", fallbackLocale);
      const fallbackData: any = await apiFetch(`/series/favorites/${memberId}?language=${fallbackLocale}`, { auth: true });
      const fallbackResults = asArray(fallbackData);

      // Mescla os resultados
      results = mergeResults(results, fallbackResults);
    }

    return results.map(toSeries).filter((s) => s.id !== 0);
  } catch (error) {
    console.error("❌ Erro ao buscar séries favoritas:", error);
    return [];
  }
};

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
