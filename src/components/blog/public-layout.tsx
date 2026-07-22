import Link from 'next/link';
import { getPages } from '@/server/actions/page.actions';
import { getSiteConfig } from '@/server/actions/site-config.actions';
import { getTranslations } from 'next-intl/server';
import { LocaleSwitcher } from '@/components/locale-switcher';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export async function PublicLayout({ children }: PublicLayoutProps) {
  const [allPages, siteTitle, t] = await Promise.all([
    getPages(),
    getSiteConfig('site_title'),
    getTranslations('nav'),
  ]);
  const pages = allPages.filter(p => p.status === 'published');
  const title = siteTitle || 'quick-press';

  const navLinkClass = 'relative text-sm font-medium text-[var(--foreground)] transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-[var(--primary)] after:transition-all after:duration-200 hover:after:w-full';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] font-extrabold text-sm">
              {title.charAt(0)}
            </span>
            <span className="font-bold text-lg tracking-tight text-[var(--foreground)]">
              {title}
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-6">
              <Link href="/" className={navLinkClass}>
                {t('home')}
              </Link>
              {pages.map((page) => (
                <Link
                  key={page.id}
                  href={`/pages/${page.slug}`}
                  className={navLinkClass}
                >
                  {page.title}
                </Link>
              ))}
            </nav>
            <div className="pl-4 border-l border-[var(--border)]">
              <LocaleSwitcher />
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 bg-[var(--background-secondary)]">{children}</main>
    </div>
  );
}
