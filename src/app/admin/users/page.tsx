'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { AdminLayout } from '@/components/admin/admin-layout';
import { listUsers, updateUserRole } from '@/server/actions/user.actions';

interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
}

const ROLES = ['admin', 'editor', 'author', 'subscriber'] as const;

export default function UsersPage() {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const [users, setUsers] = useState<UserProfile[]>([]);

  const load = useCallback(async () => { setUsers(await listUsers()); }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">{t('userManagement')}</h1>

      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.user_id}
            className="flex items-center justify-between px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--background)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-sm font-medium">
                {(user.display_name || '?')[0]}
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--foreground)]">
                  {user.display_name || tc('anonymous')}
                </div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            <select
              value={user.role}
              onChange={async (e) => {
                await updateUserRole(user.user_id, e.target.value);
                load();
              }}
              className="text-sm px-2 py-1 rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`role${r.charAt(0).toUpperCase() + r.slice(1)}`)}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
