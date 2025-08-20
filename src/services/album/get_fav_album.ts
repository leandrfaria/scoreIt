import { apiFetch } from "@/lib/api";
import { Album } from "@/types/Album";

type Json = Record<string, unknown>;

function pickString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

export async function fetchFavouriteAlbuns(memberId: string): Promise<Album[]> {
  try {
    const raw = await apiFetch(`/spotify/api/favorites/${memberId}`, { auth: true });

    if (!Array.isArray(raw)) return [];

    return raw
      .map((item: unknown) => {
        if (typeof item !== "object" || item === null) return null;
        const obj = item as Json;

        const images = (obj.images as unknown[]) || [];
        const imageUrl =
          Array.isArray(images) && typeof images[0] === "object" && images[0] !== null
            ? pickString((images[0] as Json).url, "/fallback.jpg")
            : "/fallback.jpg";

        const artists = (obj.artists as unknown[]) || [];
        const artist =
          Array.isArray(artists) && typeof artists[0] === "object" && artists[0] !== null
            ? pickString((artists[0] as Json).name, "Desconhecido")
            : "Desconhecido";

        const id = pickString(obj.id);
        const name = pickString(obj.name);
        if (!id || !name) return null;

        return {
          id,
          name,
          artist,
          release_date: pickString(obj.release_date),
          total_tracks: typeof obj.total_tracks === "number" ? (obj.total_tracks as number) : 0,
          imageUrl,
        } as Album;
      })
      .filter((a): a is Album => a !== null);
  } catch (err) {
    console.error("Erro ao buscar álbuns favoritos:", err);
    return [];
  }
}
