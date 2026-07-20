'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getSiteConfig } from '@/server/actions/site-config.actions';
import { canManageUsers, type Role } from '@/server/auth/roles';
import { Sidebar } from '@/components/admin/sidebar';
import { Menu } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
  exact?: boolean;
}

const navItems: NavItem[] = [
  { href: '/admin', label: '仪表盘', exact: true },
  { href: '/admin/posts', label: '文章' },
  { href: '/admin/pages', label: '页面' },
  { href: '/admin/tags', label: '标签' },
  { href: '/admin/comments', label: '评论' },
  { href: '/admin/themes', label: '主题' },
  { href: '/admin/media', label: '媒体' },
  { href: '/admin/users', label: '用户', adminOnly: true },
  { href: '/admin/settings', label: '设置', adminOnly: true },
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

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || canManageUsers(role),
  );

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
