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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--background)]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg text-[var(--foreground)]">
            {title}
          </Link>
          <div className="flex items-center gap-4 ml-auto">
            <nav className="flex items-center gap-4">
              <Link href="/" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                {t('home')}
              </Link>
              {pages.map((page) => (
                <Link
                  key={page.id}
                  href={`/pages/${page.slug}`}
                  className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  {page.title}
                </Link>
              ))}
            </nav>
            <LocaleSwitcher />
          </div>
        </div>
      </header>
      <main className="flex-1 bg-[var(--background-secondary)]">{children}</main>
    </div>
  );
}
