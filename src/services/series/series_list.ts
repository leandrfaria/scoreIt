// services/series/series_list.ts
import { apiFetch } from "@/lib/api";
import { Series } from "@/types/Series";

declare global {
  interface Window {
    __TMDB_GENRES__?: Record<string, Record<string, string>>;
  }
}

const mapLocaleToTMDBLanguage = (locale?: string) => {
  if (!locale) return "pt-BR";
  const l = String(locale).toLowerCase();
  if (l.startsWith("pt")) return "pt-BR";
  if (l.startsWith("en")) return "en-US";
  return "pt-BR";
};

// Cache global (evita múltiplas requisições)
if (typeof window !== "undefined" && !window.__TMDB_GENRES__) {
  window.__TMDB_GENRES__ = {};
}
export const cachedGenres = (typeof window !== "undefined" ? window.__TMDB_GENRES__! : {}) as Record<
  string,
  Record<string, string>
>;

export const fetchGenres = async (locale: string = "pt") => {
  const language = mapLocaleToTMDBLanguage(locale);
  const cacheKey = String(language);

  if (cachedGenres[cacheKey] && Object.keys(cachedGenres[cacheKey]).length > 0) {
    return Object.entries(cachedGenres[cacheKey]).map(([id, name]) => ({ id: parseInt(id), name }));
  }

  try {
    const response = await apiFetch(`/series/search/genres?language=${language}`, { auth: true });

    // O backend pode retornar string JSON ou um objeto já parseado
    let data;
    if (typeof response === "string") {
      try {
        data = JSON.parse(response);
      } catch (e) {
        data = {};
      }
    } else {
      data = response;
    }

    const genres = data?.genres || [];
    const genreMap: Record<string, string> = {};
    genres.forEach((g: any) => {
      if (g && g.id != null && g.name != null) {
        genreMap[String(g.id)] = g.name;
      }
    });

    cachedGenres[cacheKey] = genreMap;
    return genres.map((g: any) => ({ id: g.id, name: g.name }));
  } catch (err) {
    console.error("Erro ao buscar gêneros de séries:", err);
    return [];
  }
};

export const getGenreName = (cacheKey: string, id: number | string) => {
  const map = cachedGenres[cacheKey] || {};
  return map[String(id)] ?? null;
};

export const fetchSeriesByPage = async (
  page: number,
  year?: number,
  genreID?: number,
  title?: string,
  opts: { signal?: AbortSignal; locale?: string } = {}
): Promise<Series[]> => {
  try {
    const language = mapLocaleToTMDBLanguage(opts.locale);
    const cacheKey = String(language);

    // garante cache de gêneros
    if (!cachedGenres[cacheKey] || Object.keys(cachedGenres[cacheKey]).length === 0) {
      await fetchGenres(opts.locale ?? "pt");
    }

    const params = new URLSearchParams();
    params.append("page", String(page > 0 ? page : 1));
    params.append("language", language);
    if (title) params.append("title", title);
    if (year) params.append("year", String(year));
    if (genreID) params.append("genre", String(genreID));

    const data: any = await apiFetch(`/series/search?${params.toString()}`, { auth: true, signal: opts.signal });

    // lidar com formato possível: { results: [...] } ou array direto
    const results = Array.isArray(data) ? data : data?.results ?? [];

    return results.map((item: any) => {
      // campos básicos
      const posterUrl = item.poster_path ?? item.posterUrl ?? null;
      const backdropUrl = item.backdrop_path ?? item.backdropUrl ?? null;

      // resoluções de gênero (como no movies_list)
      let genreNames = "Desconhecido";
      let genreIds: number[] = [];
      let genresObj: { id?: number; name: string }[] = [];

      // 1) item.genres como array de objetos {id, name}
      if (item.genres && Array.isArray(item.genres) && item.genres.length > 0) {
        genresObj = item.genres.map((g: any) => ({ id: g.id, name: g.name }));
        genreNames = genresObj.map((g) => g.name).join(", ");
        genreIds = genresObj.map((g) => Number(g.id ?? 0)).filter(Boolean);
      }
      // 2) item.genre_ids (array de ids) -> usa cache
      else if (item.genre_ids && Array.isArray(item.genre_ids)) {
        genreIds = item.genre_ids.map((id: any) => Number(id));
        const names = genreIds.map((id) => getGenreName(cacheKey, id) ?? "Desconhecido");
        genreNames = names.join(", ");
        genresObj = genreIds.map((id) => ({ id, name: getGenreName(cacheKey, id) ?? "Desconhecido" }));
      }
      // 3) item.genre (string)
      else if (item.genre) {
        genreNames = String(item.genre);
        // deixa genreIds vazio e genresObj como string-only
        genresObj = [{ name: genreNames }];
      }
      // 4) item.genres como array de strings (possível)
      else if (Array.isArray(item.genres) && item.genres.length > 0 && typeof item.genres[0] === "string") {
        genreNames = (item.genres as string[]).join(", ");
        genresObj = (item.genres as string[]).map((n) => ({ name: n }));
      }

      const series: Series = {
        id: Number(item.id ?? 0),
        name: String(item.name ?? item.title ?? "").trim(),
        posterUrl: posterUrl ? `https://image.tmdb.org/t/p/w300${posterUrl}` : null,
        backdropUrl: backdropUrl ? `https://image.tmdb.org/t/p/original${backdropUrl}` : "/fallback.jpg",
        vote_average: Number(item.vote_average ?? item.vote_average ?? 0),
        release_date: (item.first_air_date ?? item.release_date) ?? null,
        overview: String(item.overview ?? "").trim(),
        // Mantenho campo "genres" como lista de strings (compatível com sua implementação anterior),
        // mas também retorno propriedades adicionais (genre, genre_ids e genresObjects) via type assertion 'as any'
        genres: genresObj.map((g) => g.name),
      } as Series;

      // adicionar campos extras (opcionais) — se quiser usar, atualize types/Series.ts para incluí-los
      (series as any).genre = genreNames;
      (series as any).genre_ids = genreIds;
      (series as any).genresObj = genresObj; // nome diferente pra não conflitar caso precise manter strings

      return series;
    });
  } catch (err) {
    console.error("Erro ao buscar séries:", err);
    return [];
  }
};
