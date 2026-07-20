import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'untitled';
}

export async function ensureUniqueSlug(
  supabase: SupabaseClient,
  table: string,
  slug: string,
  excludeId?: string,
): Promise<string> {
  let candidate = slug;
  let counter = 1;

  while (true) {
    const query = supabase.from(table).select('id').eq('slug', candidate);
    const { data } = excludeId
      ? await query.neq('id', excludeId).maybeSingle()
      : await query.maybeSingle();
    if (!data) return candidate;
    candidate = `${slug}-${counter}`;
    counter++;
  }
}
