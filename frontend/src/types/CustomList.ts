export interface CustomList {
  id: number;
  memberId: number;
  mediaId: number;
  mediaType: 'movie' | 'album' | 'series';
  listName: string;
  list_description?: string; // opcional, se você tiver descrição
}
