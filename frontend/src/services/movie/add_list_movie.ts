import { CustomList } from "@/types/CustomList";
import { Movie } from "@/types/Movie";

export const fetchListContent = async (
  memberId: number,
  listName: string
): Promise<Movie[]> => {
  const token = localStorage.getItem("authToken");
  if (!token) throw new Error("Token não encontrado");

  console.log(`Fetching list: memberId=${memberId}, listName=${listName}`);

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
      // ... código de erro existente
      throw new Error("Erro ao buscar conteúdo");
    }

    const data = await res.json();
    console.log("📦 Dados da lista:", data);

    // Adicione AQUI a lógica de transformação
    const results = data.results || data.data?.results || data || [];

    if (!Array.isArray(results)) {
      console.warn("⚠️ 'results' não é um array:", results);
      return []; // Retorna array vazio
    }

    const transformed: Movie[] = results.map((movie: any) => ({
      id: movie.externalId || movie.tmdb_id || movie.id,
      internalId: movie.id,
      title: movie.title,
      posterUrl: movie.posterPath 
        ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` 
        : "",
      backdropUrl: movie.backdropUrl || "",
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      overview: movie.overview || "Sem descrição disponível.",
      genre: movie.genre || "Desconhecido",
    }));

    return transformed; // 👈 RETORNO ESSENCIAL

  } catch (error) {
    console.error("Erro na requisição:", error);
    throw error;
  }
};


export const addContentToList = async (
  token: string,
  data: CustomList
): Promise<void> => {
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
      throw new Error("Erro ao adicionar conteúdo");
    }
  } catch (error) {
    console.error("Erro ao adicionar conteúdo à lista:", error);
    throw error;
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

// Função para deletar a lista
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

    // Verifica se a resposta tem conteúdo antes de tentar parsear
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
    
    // Aceita qualquer resposta de sucesso (JSON ou texto)
    console.log("✅ Atualização bem-sucedida");
    
  } catch (error) {
    console.error("❌ Erro:", error);
    throw error;
  }
};





