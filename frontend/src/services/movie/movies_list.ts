import { Movie } from '@/types/Movie';

export const fetchGenres = async (): Promise<{ id: number; name: string }[]> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.error('Token não encontrado. Faça login primeiro.');
    return [];
  }

  try {
    const response = await fetch(`http://localhost:8080/movie/search/genres`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar gêneros: ${response.status}`);
    }

    const data = await response.json();
    return data.genres || [];
  } catch (error) {
    console.error('Erro ao buscar gêneros:', error);
    return [];
  }
};

export const fetchMoviesByPage = async (
  page: number,
  year?: number,
  genreID?: number,
  title?: string
): Promise<Movie[]> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.error('Token não encontrado. Faça login primeiro.');
    return [];
  }

  try {
    // Montando a URL com todos os filtros
    const params = new URLSearchParams();
    params.append('page', page.toString());
    if (title) params.append('title', title);
    if (year) params.append('year', year.toString());
    if (genreID) params.append('genre', genreID.toString());

    const url = `http://localhost:8080/movie/search?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar filmes: ${response.status}`);
    }

    const data = await response.json();
    const results = data.results || [];

    return results.map((movie: any) => ({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : null,
      backdropUrl: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      overview: movie.overview,
      genre: movie.genre || 'Desconhecido',
    }));
  } catch (error) {
    console.error('Erro ao buscar filmes:', error);
    return [];
  }
};


