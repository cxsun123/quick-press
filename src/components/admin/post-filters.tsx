'use client';

import { useTranslations } from 'next-intl';

const PER_PAGE_OPTIONS = [20, 50, 100];

export function PostFilters({
  visibility,
  perPage,
  baseParams,
}: {
  visibility: string;
  perPage: number;
  baseParams: Record<string, string | undefined>;
}) {
  const t = useTranslations('admin');
  const tc = useTranslations('common');

  const buildUrl = (base: string, params: Record<string, string | undefined>) => {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v && v !== 'all') usp.set(k, v);
    });
    const qs = usp.toString();
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <div className="flex items-center gap-3">
      <select
        value={visibility || ''}
        onChange={(e) => {
          const val = e.target.value;
          const url = buildUrl('/admin/posts', { ...baseParams, visibility: val || undefined, page: undefined });
          window.location.href = url;
        }}
        className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)]"
      >
        <option value="">{t('allVisibility')}</option>
        <option value="public">{tc('public')}</option>
        <option value="private">{tc('private')}</option>
        <option value="password">{t('passwordProtected')}</option>
      </select>
      <select
        value={perPage}
        onChange={(e) => {
          const url = buildUrl('/admin/posts', { ...baseParams, perPage: e.target.value, page: undefined });
          window.location.href = url;
        }}
        className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)]"
      >
        {PER_PAGE_OPTIONS.map((n) => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
    </div>
  );
}
