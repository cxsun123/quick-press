export type PostStatus = 'draft' | 'published' | 'scheduled';
export type PostVisibility = 'public' | 'private' | 'password';

export interface Post {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  summary: string | null;
  keywords: string[] | null;
  visibility: PostVisibility;
  share_token: string | null;
  cover_image_url: string | null;
  status: PostStatus;
  is_pinned: boolean;
  meta: Record<string, unknown>;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface PostWithRelations extends Post {
  post_tags: { tags: Tag }[];
  post_categories: { categories: Category }[];
}

export interface PostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  summary: string | null;
  keywords: string[] | null;
  cover_image_url: string | null;
  published_at: string | null;
  is_pinned: boolean;
  post_tags: { tags: { id: string; name: string; slug: string; color: string } }[];
  post_categories: { categories: { id: string; name: string; slug: string } }[];
}

export interface PostFilter {
  categorySlug?: string;
  tagSlug?: string;
  tagSlugs?: string[];
  month?: string;
  query?: string;
  visibility?: PostVisibility;
}

export interface PaginatedPosts {
  posts: PostListItem[];
  total: number;
  totalPages: number;
  currentPage: number;
}
