// src/services/album/fixed_ids.ts
import { apiFetch } from "@/lib/api";
import type { Album } from "@/types/Album";

type Json = Record<string, any>;

const PATH_SET_A =
  "/spotify/api/albums?ids=0U0Qv2jYtsgGxFDpQJKAxQ,1El3k8dU3sKyoGUeuyrolH,1KFWgQTw3EMTQebaaepVBI,2lIZef4lzdvZkiiCzvPKj7,03guxdOi12XJbnvxvxbpwG,7aJuG4TFXa2hmE4z1yxc3n,6dVIqQ8qmQ5GBnJ9shOYGE,1Mo92916G2mmG7ajpmSVrc,6PFPjumGRpZnBzqnDci6qJ,4yP0hdKOZPNshxUOjY0cZj,4PIVdqvL1Rc7T7Vfsr8n8Q,7o4UsmV37Sg5It2Eb7vHzu,5T5NM01392dvvd4EhGrCnj,79dL7FLiJFOO0EoehUHQBv,3cQO7jp5S9qLBoIVtbkSM1,621cXqrTSSJi1WqDMSLmbL,35UJLpClj5EDrhpNIi4DFg,2nLOHgzXzwFEpl62zAgCEC,0bUTHlWbkSQysoM3VsWldT,4tUxQkrduOE8sfgwJ5BI2F";

const PATH_SET_B =
  "/spotify/api/albums?ids=7fJJK56U9fHixgO0HQkhtI,1Td1oiZTQFYR7N1QX00uhr,4Gfnly5CzMJQqkUFfoHaP3,5QfFvOMOJ0CrIDmu33RmSJ,0gsiszk6JWYwAyGvaTTud4,2dIGnmEIy1WZIcZCFSj6i8,2ODvWsOgouMbaA5xf0RkJe,6tG8sCK4htJOLjlWwb7gZB,2r2r78NE05YjyHyVbVgqFn,41GuZcammIkupMPKH2OJ6I,18NOKLkZETa4sWwLMIm0UZ,32lGAqeVkdJxEj2iv2Q01B,60UzB8mOCMpc7xkuJE6Bwc,5zi7WsKlIiUXv09tbGLKsE,0U28P0QVB1QRxpqp5IHOlH,1jzv3jwZbt8lYfEtMjiD1R,2nkto6YNI4rUYTLqEwWJ3o,5LbHbwejgZXRZAgzVAjkhj,02w1xMzzdF2OJxTeh1basm,0gsiszk6JWYwAyGvaTTud4"; // ⚠️ este id aparece 2x

function mapAlbum(obj: Json): Album | null {
  if (!obj || typeof obj !== "object") return null;

  const images = Array.isArray(obj.images) ? obj.images : [];
  const imageUrl =
    images?.[0]?.url || images?.[1]?.url || images?.[2]?.url || "/fallback.jpg";

  const artists = Array.isArray(obj.artists) ? obj.artists : [];
  const artist = artists?.[0]?.name || "Desconhecido";

  const id = String(obj.id || "");
  const name = String(obj.name || "");
  if (!id || !name) return null;

  return {
    id,
    name,
    artist,
    release_date: String(obj.release_date || ""),
    total_tracks: Number.isFinite(obj.total_tracks) ? obj.total_tracks : 0,
    imageUrl,
  };
}

function uniqueById(list: Album[]): Album[] {
  const map = new Map<string, Album>();
  for (const a of list) {
    if (!map.has(a.id)) map.set(a.id, a);
  }
  return Array.from(map.values());
}

/** Alterna entre os dois conjuntos, remove duplicados e limita a 20 */
export async function fetchFixedAlbums(signal?: AbortSignal): Promise<Album[]> {
  const pickB = Math.random() >= 0.5;
  const path = pickB ? PATH_SET_B : PATH_SET_A;

  const raw = await apiFetch(path, { auth: true, signal });

  if (!Array.isArray(raw)) return [];

  const mapped = raw
    .map((item) => mapAlbum(item as Json))
    .filter((a): a is Album => Boolean(a));

  const deduped = uniqueById(mapped);
  return deduped.slice(0, 20);
}
