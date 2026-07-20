'use client';

import { useEffect, useState } from 'react';

const LG_BREAKPOINT = 1024;

export function TwoColumnLayout({
  children,
  sidebar,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`);
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return (
    <div
      className="flex gap-8"
      style={{ flexDirection: isDesktop ? 'row' : 'column' }}
    >
      <div className="flex-1 min-w-0">{children}</div>
      {isDesktop ? (
        <aside className="w-[280px] shrink-0">{sidebar}</aside>
      ) : (
        <div className="mt-10">{sidebar}</div>
      )}
    </div>
  );
}
