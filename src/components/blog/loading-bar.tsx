'use client';

import { useGlobalLoading } from '@/hooks/use-loading';

export function LoadingBar() {
  const isLoading = useGlobalLoading();

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-0.5 overflow-hidden"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="h-full transition-opacity duration-200"
        style={{
          backgroundColor: 'var(--primary)',
          opacity: isLoading ? 1 : 0,
          animation: isLoading ? 'loading-bar 1.5s ease-in-out infinite' : 'none',
        }}
      />
    </div>
  );
}
