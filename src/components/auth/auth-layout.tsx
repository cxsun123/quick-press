interface AuthLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background-secondary)] px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-[var(--foreground)] mb-8">{title}</h1>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
