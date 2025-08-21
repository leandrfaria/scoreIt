export interface Series {
  id: number;
  name: string;
  posterUrl: string | null;
  backdropUrl: string;
  vote_average: number;
  release_date: string | null;
  overview: string;
  genres: string[];
}
