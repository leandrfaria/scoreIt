import { fetchMovieById } from "@/services/movie/fetch_movie_by_id";
import { fetchSerieById } from "@/services/series/fetch_series_by_id";
import { fetchAlbumById } from "@/services/album/fetch_album_by_id"; 
import { Movie } from "@/types/Movie";
import { AddToCustomListRequest, CustomList } from "@/types/CustomList";
import { Series } from "@/types/Series";
import { Album } from "@/types/Album"; 

export type MediaType = (Movie | Series | Album) & { 
  internalId: number;
  posterUrl?: string;
  imageUrl?: string;
};

export const fetchListContent = async (
  memberId: number,
  listName: string
): Promise<MediaType[]> => {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Token não encontrado");

  try {
    const res = await fetch(
      `http://localhost:8080/customList/getContent/${memberId}/${listName}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Erro ao buscar conteúdo: ${errorText}`);
    }

    const listItems: CustomList[] = await res.json();

    const validItems = listItems.filter(item => {
      if (!item.mediaId || item.mediaId === "null") {
        return false;
      }
      
      // Verificação para séries (IDs devem ser numéricos)
      if (item.mediaType === "series" && isNaN(Number(item.mediaId))) {
        console.warn("ID inválido para série:", item.mediaId);
        return false;
      }
      
      // Verificação para filmes (não devem ter IDs de álbum)
      if (item.mediaType === "movie" && /^[a-zA-Z0-9]{22}$/.test(item.mediaId)) {
        console.warn("Possível ID de álbum marcado como filme:", item.mediaId);
        return false;
      }
      
      return true;
    });

    const promises = validItems.map(async (item) => {
      console.log("Processando item:", item);

      try {
        switch (item.mediaType.toLowerCase()) {
          case "movie":
            const movie = await fetchMovieById(item.mediaId);
            return movie ? { ...movie, internalId: item.id } : null;
            
          case "series":
            const serie = await fetchSerieById(item.mediaId);
            return serie ? { ...serie, internalId: item.id } : null;
            
          case "album":
            const album = await fetchAlbumById(item.mediaId);
            return album ? { ...album, internalId: item.id } : null;
            
          default:
            console.warn(`Tipo de mídia desconhecido: ${item.mediaType}`, item);
            return null;
        }
      } catch (error) {
        console.error(`Erro ao processar item ${item.id}:`, error);
        return null;
      }
    });

    const mediaItems = await Promise.all(promises);
    return mediaItems.filter(Boolean) as MediaType[];

  } catch (error) {
    console.error("Erro ao buscar conteúdo da lista:", error);
    return [];
  }
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

export const deleteCustomList = async (listId: number): Promise<void> => {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Token não encontrado");

  try {
    const response = await fetch(`http://localhost:8080/customList/delete/${listId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Erro ao deletar lista");
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      const data = await response.json();
      return data;
    }
    
    return;
  } catch (error) {
    console.error("Erro ao deletar lista:", error);
    throw error;
  }
};


export const fetchMemberLists = async (token: string, memberId: number): Promise<CustomList[]> => {
  const res = await fetch(`http://localhost:8080/customList/getList/${memberId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("Response lista:" , res);
  if (!res.ok) throw new Error("Erro ao buscar listas");
  return await res.json();
};

export const updateCustomList = async (
  token: string,
  data: {
    id: number;
    listName: string;
    list_description: string;
  }
): Promise<void> => {
  try {
    console.log("🧪 Dados enviados para atualização:", data);

    const res = await fetch(`http://localhost:8080/customList/update`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: data.id,
        listName: data.listName,
        list_description: data.list_description
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }
    
    console.log("✅ Atualização bem-sucedida");
    
  } catch (error) {
    console.error("Erro:", error);
    throw error;
  }
};