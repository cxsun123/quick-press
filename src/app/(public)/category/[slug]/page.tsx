import { PublicLayout } from '@/components/blog/public-layout';
import { getPublishedPostsPaginated } from '@/server/actions/post.actions';
import { getCategories } from '@/server/actions/taxonomy.actions';
import { PostCard } from '@/components/blog/post-card';
import { Pagination } from '@/components/blog/pagination';
import { Sidebar } from '@/components/blog/sidebar';
import { TwoColumnLayout } from '@/components/blog/two-column-layout';

export default async function CategoryPage(props: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}) {
  const { slug: rawSlug } = await props.params;
  const slug = decodeURIComponent(rawSlug);
  const searchParams = await props.searchParams;
  const page = Math.max(1, parseInt(searchParams?.page || '1', 10) || 1);

  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);

  const { posts, total, totalPages } = await getPublishedPostsPaginated(page, 10, {
    categorySlug: slug,
  });

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-6">
          分类：{category?.name || slug}
        </h1>

        <TwoColumnLayout sidebar={<Sidebar />}>
          {posts.length === 0 ? (
            <p className="text-lg text-[var(--muted-foreground)]">该分类下暂无文章</p>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath={`/category/${slug}`}
          />
        </TwoColumnLayout>
      </div>
    </PublicLayout>
  );
}
