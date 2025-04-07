import { Movie } from '@/types/Movie';

export const fetchMovies = async (): Promise<Movie[]> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.error('Token não encontrado. Faça login primeiro.');
    return [];
  }

  try {
    const response = await fetch('http://localhost:8080/movie/get/page/1', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar filmes: ${response.status}`);
    }

    const text = await response.text();

    if (!text) {
      throw new Error('Resposta da API vazia');
    }

    const data = JSON.parse(text);
    const results = data.results || [];

    const transformed: Movie[] = results.map((movie: any) => ({
      id: movie.id,
      title: movie.title,
      posterUrl: `https://image.tmdb.org/t/p/w300${movie.poster_path}`,      // para exibir nos cards
      backdropUrl: `https://image.tmdb.org/t/p/original${movie.backdrop_path}`, // ✅ melhor qualidade para o modal
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      overview: movie.overview,
      genre: movie.genre || 'Desconhecido',
    }));

    return transformed;
  } catch (error) {
    console.error('Erro ao buscar filmes:', error);
    return [];
  }
};
