import { apiFetch } from "@/lib/api";
import { Album } from "@/types/Album";

type Json = Record<string, unknown>;

function pickString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

export async function fetchAlbumById(id: string): Promise<Album | null> {
  try {
    const data = await apiFetch(`/spotify/api/album/${id}`, { auth: true });
    if (typeof data !== "object" || data === null) return null;
    const obj = data as Json;

    const images = (obj.images as unknown[]) || [];
    const imageUrl =
      Array.isArray(images) &&
      typeof images[0] === "object" &&
      images[0] !== null &&
      typeof (images[0] as Json).url === "string"
        ? ((images[0] as Json).url as string)
        : "/fallback.jpg";

    const artists = (obj.artists as unknown[]) || [];
    const artist =
      Array.isArray(artists) &&
      typeof artists[0] === "object" &&
      artists[0] !== null &&
      typeof (artists[0] as Json).name === "string"
        ? ((artists[0] as Json).name as string)
        : "Desconhecido";

    const album: Album = {
      id: pickString(obj.id),
      name: pickString(obj.name),
      artist,
      release_date: pickString(obj.release_date),
      total_tracks: typeof obj.total_tracks === "number" ? (obj.total_tracks as number) : 0,
      imageUrl,
    };

    // Garante campos obrigatórios
    if (!album.id || !album.name) return null;

    return album;
  } catch (error) {
    console.error("Erro ao buscar álbum:", error);
    return null;
  }
}
