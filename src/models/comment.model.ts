export type CommentStatus = 'pending' | 'approved' | 'spam' | 'trash';

export interface Comment {
  id: string;
  post_id: string | null;
  page_id: string | null;
  author_id: string | null;
  author_name: string | null;
  author_email: string | null;
  parent_id: string | null;
  content: string;
  status: CommentStatus;
  created_at: string;
  updated_at: string;
}
