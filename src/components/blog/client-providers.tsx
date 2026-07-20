'use client';

import { LoadingBar } from '@/components/blog/loading-bar';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LoadingBar />
      {children}
    </>
  );
}
