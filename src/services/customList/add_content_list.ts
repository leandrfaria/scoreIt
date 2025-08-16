import { fetchMovieById } from "@/services/movie/fetch_movie_by_id";
import { fetchSerieById } from "@/services/series/fetch_series_by_id";
import { fetchAlbumById } from "@/services/album/fetch_album_by_id"; 
import { Movie } from "@/types/Movie";
import { AddToCustomListRequest, CustomList } from "@/types/CustomList";
import { Series } from "@/types/Series";
import { Album } from "@/types/Album"; 
import { apiRequest } from "../apiRequest/api";

export type MediaType = (Movie | Series | Album) & {
  internalId: number;
  posterUrl?: string | null;
  imageUrl?: string | null;
};


const fetchMap: Record<string, (id: string) => Promise<Movie | Series | Album | null>> = {
  movie: fetchMovieById,
  series: fetchSerieById,
  album: fetchAlbumById,
};

export const fetchListContent = async (memberId: number, listName: string): Promise<MediaType[]> => {
  const listItems = await apiRequest<CustomList[]>(`/customList/getContent/${memberId}/${listName}`);

  const validItems = listItems.filter(item => {
    if (!item.mediaId || item.mediaId === "null") return false;
    if (item.mediaType === "series" && isNaN(Number(item.mediaId))) return false;
    if (item.mediaType === "movie" && /^[a-zA-Z0-9]{22}$/.test(item.mediaId)) return false;
    return true;
  });

  const mediaItems = await Promise.all(
    validItems.map(async (item) => {
      try {
        const fetchFn = fetchMap[item.mediaType.toLowerCase()];
        if (!fetchFn) return null;

        const media = await fetchFn(item.mediaId);
        return media ? { ...media, internalId: item.id } : null;
      } catch {
        return null;
      }
    })
  );

  return mediaItems.filter(Boolean) as MediaType[];
};



export const addContentToList = async (
  token: string,
  data: AddToCustomListRequest
): Promise<"success" | "duplicate" | "error"> => {
  try {
    const res = await fetch(`http://localhost:8080/customList/addContent`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorText = await res.text();
      if (errorText.includes("already in your list")) {
        return "duplicate";
      }

      return "error";
    }

    return "success";
  } catch {
    return "error";
  }
};



export const removeContentFromList = async (
  token: string,
  data: CustomList
): Promise<void> => {
  try {
    const res = await fetch(`http://localhost:8080/customList/deleteContent`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Erro da API ao deletar:", errorText);
      throw new Error("Erro ao deletar conteúdo: " + errorText);
    }
  } catch (error) {
    console.error("Erro ao deletar conteúdo da lista:", error);
    throw error;
  }
};


export const fetchMemberLists = (token: string, memberId: number) => {
  return apiRequest<CustomList[]>(`/customList/getList/${memberId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  }, false);
};

export const deleteCustomList = (listId: number) => {
  return apiRequest<void>(`/customList/delete/${listId}`, { method: "DELETE" });
};

export const updateCustomList = (token: string, data: { id: number; listName: string; list_description: string; }) => {
  return apiRequest<void>(`/customList/update`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  }, false);
};