export interface CustomList {
  id: number;
  memberId: number;
  mediaId: string; // Alterado de number para string
  mediaType: 'movie' | 'album' | 'series';
  listName: string;
  list_description?: string;
}
