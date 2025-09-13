export type BadgeCode =
  | "MOVIE_FIRST" | "MOVIE_10" | "MOVIE_50" | "MOVIE_100"
  | "SERIES_FIRST" | "SERIES_10" | "SERIES_30" | "SERIES_50"
  | "ALBUM_FIRST" | "ALBUM_10" | "ALBUM_50" | "ALBUM_100";

export type BadgeResponse = {
  id: number;
  name: string;
  description?: string | null;
  code?: BadgeCode | string; 
};
