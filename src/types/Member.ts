export interface Member {
  id: number;
  name: string;
  birthDate: string;
  email: string;
  handle: string;     
  gender: string;
  bio: string;
  profileImageUrl: string;
  role?: string;
  enabled: boolean;
}
