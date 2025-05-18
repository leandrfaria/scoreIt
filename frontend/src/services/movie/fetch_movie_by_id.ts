import { Movie } from "@/types/Movie";

export const fetchMovieById = async (id: string): Promise<Movie | null> => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    console.error("Token não encontrado. Faça login primeiro.");
    return null;
  }

  try {
    const response = await fetch(`http://localhost:8080/movie/id/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar filme: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      title: data.title,
      overview: data.overview,
      release_date: data.release_date,
      posterUrl: data.posterUrl,
      backdropUrl: data.backdropUrl,
      vote_average: data.vote_average,
      genre: data.genre || "Desconhecido",
    };
  } catch (error) {
    console.error("Erro ao buscar filme:", error);
    return null;
  }
};
