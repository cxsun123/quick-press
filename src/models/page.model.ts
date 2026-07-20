export type PageStatus = 'draft' | 'published';

export interface Page {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  parent_id: string | null;
  template: string;
  sort_order: number;
  status: PageStatus;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
