// types/Series.ts (trecho relevante)
export interface Series {
  id: number;
  name: string;
  posterUrl: string | null;
  backdropUrl: string;
  vote_average: number;
  release_date: string | null;
  overview: string;
  genres: string[];
  genre?: string;
  genre_ids?: number[];
  genresObj?: { id?: number; name: string }[];
}
