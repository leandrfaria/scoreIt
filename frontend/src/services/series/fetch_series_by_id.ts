import { Series } from "@/types/Series";

export const fetchSerieById = async (id: string): Promise<Series | null> => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    console.error("Token não encontrado. Faça login primeiro.");
    return null;
  }

  try {
    const response = await fetch(`http://localhost:8080/series/${id}/details`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar detalhes da série: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      name: data.name,
      overview: data.overview,
      release_date: data.release_date,
      posterUrl: data.posterUrl || data.poster_path,
      backdropUrl: data.backdropUrl || data.backdrop_path,
      vote_average: data.vote_average,
      genres: data.genres, // novo campo
    };
  } catch (error) {
    console.error("Erro ao buscar detalhes da série:", error);
    return null;
  }
};
