import Link from 'next/link';
import { getPages } from '@/server/actions/page.actions';
import { getSiteConfig } from '@/server/actions/site-config.actions';
import { getTranslations } from 'next-intl/server';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { NavMenu } from '@/components/blog/nav-menu';

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

  const navLinkClass = 'relative text-sm font-medium text-[var(--foreground)] transition-colors duration-200 md:after:absolute md:after:bottom-0 md:after:left-0 md:after:h-[2px] md:after:w-0 md:after:bg-[var(--primary)] md:after:transition-all md:after:duration-200 md:hover:after:w-full md:px-0 px-3 py-2.5 rounded-lg md:hover:bg-transparent hover:bg-[var(--accent)]';

  const navLinks = (
    <>
      <Link href="/" className={navLinkClass}>
        {t('home')}
      </Link>
      {pages.map((page) => (
        <Link key={page.id} href={`/pages/${page.slug}`} className={navLinkClass}>
          {page.title}
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] font-extrabold text-sm shrink-0">
              {title.charAt(0)}
            </span>
            <span className="font-bold text-lg tracking-tight text-[var(--foreground)] truncate max-w-[140px] sm:max-w-none">
              {title}
            </span>
          </Link>
          <NavMenu navLinks={navLinks} localeSwitcher={<LocaleSwitcher />} />
        </div>
      </header>
      <main className="flex-1 bg-[var(--background-secondary)]">{children}</main>
    </div>
  );
}
