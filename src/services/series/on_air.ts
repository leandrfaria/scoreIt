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

  const genres: string[] =
    Array.isArray((item as any).genres)
      ? ((item as any).genres as unknown[]).map((g) => String(g))
      : (item as any).genre
      ? [String((item as any).genre)]
      : [];

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
    genres,
  };
}

/**
 * Mantive a assinatura original (aceitando token) para não quebrar chamadas existentes,
 * mas internamente usamos `apiFetch` com `{ auth: true }`.
 */
export const fetchOnAirSeries = async (token: string, locale: string): Promise<Series[]> => {
  try {
    const tmdbLocale = locale; // ou use um map se precisar: mapNextIntlToTMDB(locale)
    const fallbackLocale = locale.startsWith("pt") ? "en-US" : "pt-BR";

    // Primeiro, tenta buscar no idioma solicitado
    const data: any = await apiFetch(`/series/now/1?language=${tmdbLocale}`, { auth: true });
    let results = asArray(data);

    // Se resultados estiverem incompletos, tenta fallback
    if (hasIncompleteTranslations(results)) {
      console.log("Tentando fallback para:", fallbackLocale);
      const fallbackData: any = await apiFetch(`/series/now/1?language=${fallbackLocale}`, { auth: true });
      const fallbackResults = asArray(fallbackData);

      results = mergeResults(results, fallbackResults);
    }

    return results.map(toSeries);
  } catch (error) {
    console.error("❌ Erro ao buscar séries no ar:", error);
    return [];
  }
};

// Verifica se a maioria das séries está com dados incompletos
function hasIncompleteTranslations(results: any[]): boolean {
  const incompleteCount = results.filter(s => !s.name || s.name === "" || !s.overview || s.overview === "").length;
  return incompleteCount > results.length / 2;
}

// Combina os resultados de primary + fallback
function mergeResults(primary: any[], fallback: any[]): any[] {
  const merged = [...primary];

  fallback.forEach(fb => {
    const idx = merged.findIndex(m => m.id === fb.id);
    if (idx === -1) {
      merged.push(fb);
    } else {
      const existing = merged[idx];
      merged[idx] = {
        ...existing,
        name: existing.name || fb.name,
        overview: existing.overview || fb.overview,
      };
    }
  });

  return merged;
}

