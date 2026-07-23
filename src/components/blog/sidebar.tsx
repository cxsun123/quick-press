import { getCategoriesTree, getTagsWithCount } from '@/server/actions/taxonomy.actions';
import { getRecentPosts, getMonthlyArchives } from '@/server/actions/post.actions';
import { FilterableSidebar } from './filterable-sidebar';

export async function Sidebar() {
  const [categories, tags, recentPosts, archives] = await Promise.all([
    getCategoriesTree(),
    getTagsWithCount(),
    getRecentPosts(5),
    getMonthlyArchives(),
  ]);

  return (
    <FilterableSidebar
      categories={categories}
      tags={tags}
      recentPosts={recentPosts}
      archives={archives}
    />
  );
}
