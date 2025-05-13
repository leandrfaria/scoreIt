import { Series } from '@/types/Series';

export const fetchPopularSeries = async (): Promise<Series[]> => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    console.error('Token não encontrado. Faça login primeiro.');
    return [];
  }

  // 👇 Gera ano aleatório entre 2022 e 2025
  const randomYear = Math.floor(Math.random() * (2025 - 2022 + 1)) + 2022;

  try {
    const response = await fetch(`http://localhost:8080/series/year/${randomYear}/page/1`, {
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

    const transformed: Series[] = results.map((series: any) => ({
      id: series.id,
      name: series.name,
      posterUrl: `https://image.tmdb.org/t/p/w300${series.poster_path}`,
      backdropUrl: `https://image.tmdb.org/t/p/original${series.backdrop_path}`,
      vote_average: series.vote_average,
      release_date: series.release_date,
      overview: series.overview?.trim() ? series.overview : undefined, 
    }));

    return transformed;
  } catch (error) {
    console.error('Erro ao buscar séries:', error);
    return [];
  }
};
