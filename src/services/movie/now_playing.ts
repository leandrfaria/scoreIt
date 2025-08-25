// services/movie/now_playing.ts
import { apiFetch } from "@/lib/api";
import { Movie } from "@/types/Movie";
import { mapNextIntlToTMDB } from "@/i18n/localeMapping";

export const fetchNowPlayingMovies = async (locale: string): Promise<Movie[]> => {
  try {
    // Mapear o locale do next-intl para o formato TMDB
    const tmdbLocale = mapNextIntlToTMDB(locale);
    const fallbackLocale = locale.startsWith('pt') ? 'en-US' : 'pt-BR';
    
    // Primeiro, tenta buscar no idioma solicitado
    const data: any = await apiFetch(`/movie/now/1?language=${tmdbLocale}`, { auth: true });
    let results = data.results || data.data?.results || data || [];

    // Se não houver resultados ou se os resultados estiverem incompletos (muitos sem título/tradução),
    // tenta buscar no idioma de fallback
    if (results.length === 0 || hasIncompleteTranslations(results)) {
      console.log("Tentando fallback para:", fallbackLocale);
      const fallbackData: any = await apiFetch(`/movie/now/1?language=${fallbackLocale}`, { auth: true });
      const fallbackResults = fallbackData.results || fallbackData.data?.results || fallbackData || [];
      
      // Combina os resultados, priorizando o idioma solicitado quando disponível
      results = mergeResults(results, fallbackResults);
    }

    if (!Array.isArray(results)) {
      console.warn("⚠️ 'results' não é um array:", results);
      return [];
    }

    const transformed: Movie[] = results.map((movie: any) => ({
      id: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path
        ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
        : movie.posterUrl ?? "/fallback.jpg",
      backdropUrl: movie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : movie.backdropUrl ?? "/fallback.jpg",
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      overview: movie.overview || "Sem descrição disponível.",
      genre: movie.genre || "Desconhecido",
    }));

    return transformed;
  } catch (error) {
    console.error("❌ Erro ao buscar filmes em cartaz:", error);
    return [];
  }
};

// Função auxiliar para verificar se as traduções estão incompletas
function hasIncompleteTranslations(results: any[]): boolean {
  // Verifica se muitos filmes não têm título ou overview no idioma solicitado
  const incompleteCount = results.filter(movie => 
    !movie.title || movie.title === "" || !movie.overview || movie.overview === ""
  ).length;
  
  return incompleteCount > results.length / 2; // Se mais da metade estiver incompleta
}

// Função auxiliar para combinar resultados de diferentes idiomas
function mergeResults(primary: any[], fallback: any[]): any[] {
  const merged = [...primary];
  
  // Para cada filme no fallback, adiciona se não estiver no primary ou se o primary estiver incompleto
  fallback.forEach(fbMovie => {
    const existingIndex = merged.findIndex(m => m.id === fbMovie.id);
    
    if (existingIndex === -1) {
      // Filme não existe no primary, adiciona
      merged.push(fbMovie);
    } else {
      // Filme existe, mas verifica se precisa completar informações
      const existing = merged[existingIndex];
      if (!existing.title || !existing.overview) {
        // Usa informações do fallback se faltarem no primary
        merged[existingIndex] = {
          ...existing,
          title: existing.title || fbMovie.title,
          overview: existing.overview || fbMovie.overview
        };
      }
    }
  });
  
  return merged;
}