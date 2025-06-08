export interface CustomList {
  id: number;
  memberId: number;
  mediaId: string;
  mediaType: 'movie' | 'album' | 'series';
  listName: string;
  list_description?: string;
}

export interface AddToCustomListRequest {
  memberId: number;
  mediaId: string;
  mediaType: 'movie' | 'album' | 'series';
  listName: string;
  list_description?: string;
}