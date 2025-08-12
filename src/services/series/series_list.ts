import { Series } from '@/types/Series';

export const fetchGenres = async (): Promise<{ id: number; name: string }[]> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.error('Token não encontrado. Faça login primeiro.');
    return [];
  }

  try {
    const response = await fetch(`http://localhost:8080/series/search/genres`, {
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

export const fetchSeriesByPage = async (
  page: number,
  year?: number,
  genreID?: number,
  title?: string
): Promise<Series[]> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.error('Token não encontrado. Faça login primeiro.');
    return [];
  }

  try {
    // Montando a URL com filtros
    const params = new URLSearchParams();
    params.append('page', page.toString());
    if (title) params.append('title', title);
    if (year) params.append('year', year.toString());
    if (genreID) params.append('genre', genreID.toString());

    const url = `http://localhost:8080/series/search?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar séries: ${response.status}`);
    }

    const data = await response.json();
    const results = data.results || [];

    return results.map((serie: any) => ({
      id: serie.id,
      name: serie.name,
      posterUrl: serie.poster_path ? `https://image.tmdb.org/t/p/w300${serie.poster_path}` : null,
      backdropUrl: serie.backdrop_path ? `https://image.tmdb.org/t/p/original${serie.backdrop_path}` : null,
      vote_average: serie.vote_average,
      release_date: serie.release_date,
      overview: serie.overview,
      genre: serie.genre || 'Desconhecido',
    }));
  } catch (error) {
    console.error('Erro ao buscar séries:', error);
    return [];
  }
};
