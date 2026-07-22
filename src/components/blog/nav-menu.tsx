'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export function NavMenu({
  navLinks,
  localeSwitcher,
}: {
  navLinks: React.ReactNode;
  localeSwitcher: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="hidden md:flex items-center gap-6">
        <nav className="flex items-center gap-6">
          {navLinks}
        </nav>
        <div className="pl-4 border-l border-[var(--border)]">
          {localeSwitcher}
        </div>
      </div>

      <div className="md:hidden flex items-center gap-2">
        {localeSwitcher}
        <button
          onClick={() => setOpen(true)}
          className="p-2 -mr-2 text-[var(--foreground)]"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute top-0 right-0 bottom-0 w-64 bg-[var(--background)] shadow-2xl border-l border-[var(--border)] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              {localeSwitcher}
              <button
                onClick={() => setOpen(false)}
                className="p-2 -mr-2 text-[var(--foreground)]"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col p-4 gap-1">
              {navLinks}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}