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
  posterUrl: string; // precisa ser sempre string
};

export const fetchMediaById = async (
  id: string,
  mediaType: MediaType
): Promise<UnifiedMedia | null> => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    console.error("❌ Token JWT não encontrado.");
    return null;
  }
  if (!id || !mediaType) return null;

  switch (mediaType) {
    case "movie": {
      const movie: Movie | null = await fetchMovieById(id);
      if (!movie) return null;
      return {
        id: movie.id,
        title: movie.title,
        // 👇 evita o erro de tipo: se poster vier null, usa o backdrop (string)
        posterUrl: movie.posterUrl ?? movie.backdropUrl,
      };
    }
    case "series": {
      const serie: Series | null = await fetchSerieById(id);
      if (!serie) return null;
      return {
        id: serie.id,
        title: serie.name,
        posterUrl: serie.posterUrl ?? serie.backdropUrl, // <- garante string
      };
    }

    case "album": {
      const album: Album | null = await fetchAlbumById(id);
      if (!album) return null;
      return {
        id: album.id,
        title: album.name,
        posterUrl: album.imageUrl, // já retorna string ("" se faltar)
      };
    }
    default:
      console.error(`❌ Tipo de mídia inválido: ${mediaType}`);
      return null;
  }
};
