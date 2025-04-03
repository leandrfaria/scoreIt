export interface Movie {
    id: number;
    title: string;
    posterUrl: string;
    vote_average: number;
    release_date: string;
  }
  
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
      return data.results || [];
    } catch (error) {
      console.error('Erro ao buscar filmes:', error);
      return [];
    }
  };
  