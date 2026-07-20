'use client';

import { use, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { PostEditor } from '@/components/blog/post-editor';
import { getPost, getPostTags, getPostCategories } from '@/server/actions/post.actions';
import { decryptPassword } from '@/server/actions/crypto.actions';

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const post = await getPost(id);
      if (!post) return;
      const tags = await getPostTags(id);
      const categories = await getPostCategories(id);
      setInitialData({
        id: post.id,
        title: post.title,
        content: post.content,
        status: post.status,
        slug: post.slug || '',
        summary: post.summary || '',
        keywords: post.keywords || [],
        visibility: post.visibility || 'public',
        password: post.password_plaintext ? await decryptPassword(post.password_plaintext) : '',
        cover_image_url: post.cover_image_url || undefined,
        tag_ids: tags.map((t: any) => t.id),
        category_ids: categories.map((c: any) => c.id),
      });
    })();
  }, [id]);

  return (
    <AdminLayout>
      {initialData ? (
        <PostEditor initialData={initialData} />
      ) : (
        <div className="text-center py-12 text-[var(--muted-foreground)]">加载中...</div>
      )}
    </AdminLayout>
  );
}
