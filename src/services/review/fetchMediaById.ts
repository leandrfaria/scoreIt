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

export const fetchMediaById = async (
  id: string | number,
  mediaType: MediaType
): Promise<UnifiedMedia | null> => {
  if (id === undefined || id === null || String(id).trim() === "") return null;
  if (!mediaType) return null;

  try {
    switch (mediaType) {
      case "movie": {
        const movie: Movie | null = await fetchMovieById(String(id));
        if (!movie) return null;
        return {
          id: movie.id,
          title: movie.title,
          posterUrl: pickString(movie.posterUrl, movie.backdropUrl),
        };
      }
      case "series": {
        const serie: Series | null = await fetchSerieById(String(id));
        if (!serie) return null;
        return {
          id: serie.id,
          title: serie.name,
          posterUrl: pickString(serie.posterUrl, serie.backdropUrl),
        };
      }
      case "album": {
        const album: Album | null = await fetchAlbumById(String(id));
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
