'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard, FileText, File, Tag, MessageSquare,
  Palette, Image, Users, Settings, PanelLeftClose, PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/server/auth/roles';
import { LocaleSwitcher } from '@/components/locale-switcher';

interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
  exact?: boolean;
}

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  navItems: NavItem[];
  role: Role | null;
  siteTitle: string;
}

const iconMap: Record<string, LucideIcon> = {
  '/admin': LayoutDashboard,
  '/admin/posts': FileText,
  '/admin/pages': File,
  '/admin/tags': Tag,
  '/admin/comments': MessageSquare,
  '/admin/themes': Palette,
  '/admin/media': Image,
  '/admin/users': Users,
  '/admin/settings': Settings,
};

export function Sidebar({ collapsed, mobileOpen, onToggle, navItems, role, siteTitle }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations('admin');

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`
          bg-[var(--background)] border-r border-[var(--border)] flex flex-col
          transition-all duration-200 ease-in-out overflow-hidden z-50

          ${mobileOpen
            ? 'fixed inset-y-0 left-0 w-56'
            : 'hidden md:flex'}

          ${collapsed && !mobileOpen ? 'w-14' : 'w-56'}
        `}
      >
        <div className="h-14 flex items-center gap-2 px-3 border-b border-[var(--border)] shrink-0">
          {(!collapsed || mobileOpen) && (
            <Link href="/admin" className="font-bold text-[var(--foreground)] whitespace-nowrap text-sm">
              {siteTitle} Admin
            </Link>
          )}
          <button
            type="button"
            onClick={onToggle}
            className="ml-auto p-1.5 rounded-md hover:bg-[var(--accent)] text-[var(--foreground)] transition-colors shrink-0"
            title={collapsed ? t('expandMenu') : t('collapseMenu')}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = iconMap[item.href];
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/');
            const showTooltip = collapsed && !mobileOpen;
            return (
              <div key={item.href} className="relative group">
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors whitespace-nowrap ${
                    collapsed && !mobileOpen ? 'justify-center' : ''
                  } ${
                    active
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                      : 'text-[var(--foreground)] hover:bg-[var(--accent)]'
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0" />}
                  {(!collapsed || mobileOpen) && <span className="truncate">{item.label}</span>}
                </Link>
                {/* Collapsed tooltip */}
                {showTooltip && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded-md bg-[var(--foreground)] text-[var(--background)] text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none z-50 shadow-md">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[var(--border)] space-y-2 shrink-0">
          {role && (!collapsed || mobileOpen) && (
            <div className="text-xs text-[var(--muted-foreground)] px-1">
              {t(role === 'admin' ? 'roleAdmin' : role === 'editor' ? 'roleEditor' : role === 'author' ? 'roleAuthor' : 'roleSubscriber')}
            </div>
          )}
          <Link
            href="/"
            className={`block text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] ${
              collapsed && !mobileOpen ? 'text-center' : ''
            }`}
          >
            {collapsed && !mobileOpen ? '←' : '← ' + t('backToSite')}
          </Link>
          <form action="/api/logout" method="post" className={collapsed && !mobileOpen ? 'text-center' : ''}>
            <button
              type="submit"
              className="text-sm text-red-500 hover:text-red-600 transition-colors"
            >
               {collapsed && !mobileOpen ? '✕' : t('logout')}
            </button>
          </form>
          {(!collapsed || mobileOpen) && (
            <div className="pt-2">
              <LocaleSwitcher />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
