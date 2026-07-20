'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/admin-layout';
import { getDashboardStats } from '@/server/actions/stats.actions';

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getDashboardStats().then(setStats);
  }, []);

  const cards = [
    { label: '全部文章', value: stats?.totalPosts ?? '--', color: 'bg-blue-500' },
    { label: '已发布', value: stats?.publishedPosts ?? '--', color: 'bg-green-500' },
    { label: '评论总数', value: stats?.totalComments ?? '--', color: 'bg-purple-500' },
    { label: '待审核评论', value: stats?.pendingComments ?? '--', color: 'bg-yellow-500' },
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">仪表盘</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-5">
            <div className={`w-3 h-3 rounded-full ${card.color} mb-3`} />
            <div className="text-3xl font-bold text-[var(--foreground)]">{card.value}</div>
            <div className="text-sm text-[var(--muted-foreground)] mt-1">{card.label}</div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
