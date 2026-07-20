export type Role = 'admin' | 'editor' | 'author' | 'subscriber';

export interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  role: Role;
  social_links: Record<string, string>;
  created_at: string;
  updated_at: string;
}
