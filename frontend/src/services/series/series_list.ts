import { Series } from '@/types/Series';

export const fetchSeriesByPage = async (page: number): Promise<Series[]> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.error('Token não encontrado. Faça login primeiro.');
    return [];
  }

  try {
    const response = await fetch(`http://localhost:8080/series/get/page/${page}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar séries: ${response.status}`);
    }

    const text = await response.text();

    if (!text) {
      throw new Error('Resposta da API vazia');
    }

    const data = JSON.parse(text);
    const results = data.results || [];

    const transformed: Series[] = results.map((serie: any) => ({
      id: serie.id,
      name: serie.name,
      posterUrl: `https://image.tmdb.org/t/p/w300${serie.poster_path}`,
      backdropUrl: `https://image.tmdb.org/t/p/original${serie.backdrop_path}`,
      vote_average: serie.vote_average,
      release_date: serie.release_date,
      overview: serie.overview,
    }));

    return transformed;
  } catch (error) {
    console.error('Erro ao buscar séries:', error);
    return [];
  }
};
