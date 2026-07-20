'use client';

import { AdminLayout } from '@/components/admin/admin-layout';
import { PostEditor } from '@/components/blog/post-editor';

export default function NewPostPage() {
  return (
    <AdminLayout>
      <PostEditor />
    </AdminLayout>
  );
}
