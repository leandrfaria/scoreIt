export type ApiComment = {
id: number;
content: string;
authorId: number | null;
authorName: string | null;
createdAt: string;
replies: ApiComment[];
};