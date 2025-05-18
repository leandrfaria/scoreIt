import { Series } from "@/types/Series";

export const fetchSerieById = async (id: string): Promise<Series | null> => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    console.error("Token não encontrado. Faça login primeiro.");
    return null;
  }

  try {
    const response = await fetch(`http://localhost:8080/series/get/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar série: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      name: data.name,
      overview: data.overview,
      release_date: data.first_air_date,
      posterUrl: data.posterUrl,
      backdropUrl: data.backdropUrl,
      vote_average: data.vote_average,
    };
  } catch (error) {
    console.error("Erro ao buscar série:", error);
    return null;
  }
};
