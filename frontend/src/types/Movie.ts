export interface Movie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  posterUrl: string | null;
  backdropUrl: string;
  vote_average: number;
  genre: string;
  genres?: string[];
  runtime?: number;
  language?: string;
  certification?: string;
  status?: string;
  budget?: number;
  revenue?: number;
  cast?: {
    name: string;
    character: string;
    profile_path: string;
    profileUrl: string;
  }[];
  directors?: {
    name: string;
    job: string;
  }[];
  recommendations?: Movie[];
  similar?: Movie[];
}
