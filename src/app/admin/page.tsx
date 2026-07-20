'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AdminLayout } from '@/components/admin/admin-layout';
import { getDashboardStats } from '@/server/actions/stats.actions';

export default function AdminPage() {
  const t = useTranslations('admin');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    getDashboardStats().then(setStats);
  }, []);

  const cards = [
    { label: t('totalPosts'), value: stats?.totalPosts ?? '--', color: 'bg-blue-500' },
    { label: t('publishedPosts'), value: stats?.publishedPosts ?? '--', color: 'bg-green-500' },
    { label: t('totalComments'), value: stats?.totalComments ?? '--', color: 'bg-purple-500' },
    { label: t('pendingComments'), value: stats?.pendingComments ?? '--', color: 'bg-yellow-500' },
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">{t('dashboard')}</h1>
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
