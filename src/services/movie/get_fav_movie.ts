import { Movie } from "@/types/Movie";

export const fetchFavouriteMovies = async (token: string, id: string): Promise<Movie[]> => {
  try {
    const response = await fetch(`http://localhost:8080/movie/favorites/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar filmes favoritos: ${response.status}`);
    }

    const text = await response.text();

    if (!text) {
      throw new Error("Resposta da API vazia");
    }

    const data = JSON.parse(text);

    const results = data.results || data.data?.results || data || [];

    if (!Array.isArray(results)) {
      console.warn("⚠️ 'results' não é um array:", results);
      return [];
    }

    const transformed: Movie[] = results.map((movie: any) => ({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path
        ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
        : "/fallback.jpg",
      backdropUrl: movie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : "/fallback.jpg",
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      overview: movie.overview || "Sem descrição disponível.",
      genre: movie.genre || "Desconhecido",
    }));

    return transformed;
  } catch (error) {
    console.error("❌ Erro ao buscar filmes favoritos:", error);
    return [];
  }
};
