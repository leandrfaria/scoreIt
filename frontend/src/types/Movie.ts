export interface Movie {
    id: number;
    title: string;
    posterUrl: string;
    backdropUrl: string;
    vote_average: number;
    release_date: string;
    overview?: string;
    genre?: string;
  }
  