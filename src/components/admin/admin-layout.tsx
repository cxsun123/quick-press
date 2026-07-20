'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { getSiteConfig } from '@/server/actions/site-config.actions';
import { canManageUsers, type Role } from '@/server/auth/roles';
import { Sidebar } from '@/components/admin/sidebar';
import { Menu } from 'lucide-react';

interface NavItem {
  href: string;
  labelKey: keyof typeof navLabels;
  adminOnly?: boolean;
  exact?: boolean;
}

const navLabels = {
  dashboard: 'dashboard',
  posts: 'posts',
  pages: 'pages',
  tags: 'tags',
  comments: 'comments',
  themes: 'themes',
  media: 'media',
  users: 'users',
  settings: 'settings',
} as const;

const navItems: NavItem[] = [
  { href: '/admin', labelKey: 'dashboard', exact: true },
  { href: '/admin/posts', labelKey: 'posts' },
  { href: '/admin/pages', labelKey: 'pages' },
  { href: '/admin/tags', labelKey: 'tags' },
  { href: '/admin/comments', labelKey: 'comments' },
  { href: '/admin/themes', labelKey: 'themes' },
  { href: '/admin/media', labelKey: 'media' },
  { href: '/admin/users', labelKey: 'users', adminOnly: true },
  { href: '/admin/settings', labelKey: 'settings', adminOnly: true },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<Role | null>(null);
  const [siteTitle, setSiteTitle] = useState('i_blog');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isEditorRoute =
    (pathname.startsWith('/admin/posts/') || pathname.startsWith('/admin/pages/')) &&
    (pathname.endsWith('/new') || pathname.includes('/edit'));

  useEffect(() => {
    getSiteConfig('site_title').then((t) => { if (t) setSiteTitle(t); });
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      setRole(data?.role || 'subscriber');
    });
    // Initialize collapsed state from localStorage
    const stored = localStorage.getItem('sidebar_collapsed') === 'true';
    setCollapsed(stored);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Auto-collapse on editor routes; restore localStorage preference on leave
  useEffect(() => {
    if (isEditorRoute) {
      setCollapsed(true);
    } else {
      const stored = localStorage.getItem('sidebar_collapsed') === 'true';
      setCollapsed(stored);
    }
  }, [isEditorRoute]);

  const handleToggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  }, []);

  const t = useTranslations('admin');

  const filteredNavItems = navItems
    .filter((item) => !item.adminOnly || canManageUsers(role))
    .map((item) => ({ ...item, label: t(item.labelKey) }));

  return (
    <div className="min-h-screen flex bg-[var(--background-secondary)]">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={handleToggle}
        navItems={filteredNavItems}
        role={role}
        siteTitle={siteTitle}
      />
      <main className="flex-1 overflow-auto">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center h-12 px-4 border-b border-[var(--border)] bg-[var(--background)]">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
            title="打开菜单"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-2 text-sm font-medium text-[var(--foreground)]">{siteTitle}</span>
        </div>
        <div className={`p-6 ${isEditorRoute ? 'max-w-full' : 'max-w-5xl mx-auto'}`}>{children}</div>
      </main>
    </div>
  );
}
