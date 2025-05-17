import { Movie } from '@/types/Movie';

// Não vou mais apagar essa função 😉
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
    let url = `http://localhost:8080/movie/get/page/${page}`;

    if (title) {
      url = `http://localhost:8080/movie/search/title/${title}?page=${page}`;
    } else if (year && genreID) {
      url = `http://localhost:8080/movie/search/year/${year}/genre/${genreID}?page=${page}`;
    } else if (year) {
      url = `http://localhost:8080/movie/search/year/${year}?page=${page}`;
    } else if (genreID) {
      url = `http://localhost:8080/movie/search/genre/${genreID}?page=${page}`;
    }

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
      posterUrl: `https://image.tmdb.org/t/p/w300${movie.poster_path}`,
      backdropUrl: `https://image.tmdb.org/t/p/original${movie.backdrop_path}`,
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
