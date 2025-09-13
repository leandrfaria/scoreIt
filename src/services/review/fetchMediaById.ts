// services/review/fetchMediaById.ts
import { fetchMovieById } from "@/services/movie/fetch_movie_by_id";
import { fetchSerieById } from "@/services/series/fetch_series_by_id";
import { fetchAlbumById } from "@/services/album/fetch_album_by_id";
import { Movie } from "@/types/Movie";
import { Series } from "@/types/Series";
import { Album } from "@/types/Album";

type MediaType = "movie" | "series" | "album";  

export type UnifiedMedia = {
  id: number | string;
  title: string;
  posterUrl: string;
};

const FALLBACK_POSTER = "/fallback.jpg";

function pickString(...vals: Array<string | null | undefined>): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim() !== "") return v;
  }
  return FALLBACK_POSTER;
}

// Função para extrair o locale da URL
const getLocaleFromPath = (): string => {
  if (typeof window === 'undefined') return 'en';
  
  const path = window.location.pathname;
  const localeMatch = path.match(/^\/([a-z]{2})(?=\/|$)/);
  
  if (localeMatch && localeMatch[1]) {
    return localeMatch[1];
  }
  
  return 'en'; // default
};

export const fetchMediaById = async (
  id: string | number,
  mediaType: MediaType,
  locale?: string
): Promise<UnifiedMedia | null> => {
  if (id === undefined || id === null || String(id).trim() === "") return null;
  if (!mediaType) return null;

  // Se não foi passado um locale, tenta extrair da URL
  let effectiveLocale = locale || getLocaleFromPath();
  console.log("[fetchMediaById] Locale detectado:", effectiveLocale);

  try {
    switch (mediaType) {
      case "movie": {
        const movie: Movie | null = await fetchMovieById(String(id), effectiveLocale);
        if (!movie) return null;
        return {
          id: movie.id,
          title: movie.title,
          posterUrl: pickString(movie.posterUrl, movie.backdropUrl),
        };
      }
      case "series": {
        const serie: Series | null = await fetchSerieById(String(id), effectiveLocale);
        if (!serie) return null;
        return {
          id: serie.id,
          title: serie.name,
          posterUrl: pickString(serie.posterUrl, serie.backdropUrl),
        };
      }
      case "album": {
        const album: Album | null = await fetchAlbumById(String(id), effectiveLocale);
        if (!album) return null;
        return {
          id: album.id,
          title: album.name,
          posterUrl: pickString(album.imageUrl),
        };
      }
      default: {
        console.error(`❌ Tipo de mídia inválido: ${mediaType}`);
        return null;
      }
    }
  } catch (error) {
    console.error("❌ Erro ao buscar mídia unificada:", error);
    return null;
  }
};