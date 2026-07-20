import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    summary: string | null;
    cover_image_url: string | null;
    published_at: string | null;
    is_pinned: boolean;
    post_categories: { categories: { id: string; name: string; slug: string } }[];
    post_tags: { tags: { id: string; name: string; slug: string; color: string } }[];
  };
}

export async function PostCard({ post }: PostCardProps) {
  const t = await getTranslations('postCard');
  const categories = post.post_categories
    ?.map((pc) => pc.categories)
    .filter(Boolean) || [];
  const postTags = post.post_tags
    ?.map((pt) => pt.tags)
    .filter(Boolean) || [];

  return (
    <article className="border border-[var(--border)] rounded-lg px-6 py-4 hover:shadow-md transition-shadow bg-[var(--background)]">
      <Link href={`/blog/${post.slug}`} className="block">
        <h2 className="text-3xl font-bold text-[var(--primary)] hover:opacity-80 transition-opacity">
          {post.is_pinned && (
            <span className="inline-block bg-[var(--primary)] text-[var(--primary-foreground)] text-xs px-2 py-0.5 rounded mr-2 align-middle">
              {t('pinned')}
            </span>
          )}
          {post.title}
        </h2>
      </Link>

      <div className="flex items-start gap-3 mt-2 mb-3">
        {post.cover_image_url && (
          <img
            src={post.cover_image_url}
            alt=""
            className="w-[130px] h-[130px] object-cover rounded-lg shrink-0"
          />
        )}
        <div className="flex-1 min-w-0 space-y-2">
          {(post.summary || post.excerpt) && (
            <p className="text-base text-[var(--muted-foreground)] italic leading-relaxed">
              {post.summary || post.excerpt}
            </p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {postTags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tag/${tag.slug}`}
                className="inline-block px-2 py-0.5 rounded-full text-xs font-medium border transition-opacity hover:opacity-80"
                style={{ borderColor: tag.color, color: tag.color }}
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {post.published_at && (
        <div className="flex justify-end mb-3">
          <time
            dateTime={post.published_at}
            className="text-sm text-[var(--muted-foreground)]"
          >
            {new Date(post.published_at).toLocaleDateString()}
          </time>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-80 transition-opacity"
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </article>
  );
}
