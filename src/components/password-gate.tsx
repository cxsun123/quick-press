'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Lock } from 'lucide-react';

interface VerifiedPost {
  id: string;
  title: string;
  htmlContent: string;
  published_at: string | null;
}

interface PasswordGateProps {
  postId: string;
  postTitle: string;
  onVerified: (post: VerifiedPost) => void;
}

export function PasswordGate({ postId, postTitle, onVerified }: PasswordGateProps) {
  const t = useTranslations('common');
  const tp = useTranslations('post');
  const te = useTranslations('error');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onVerified(data.post);
      } else {
        setError(data.error || te('wrongPassword'));
      }
    } catch {
      setError(te('verifyFailed'));
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto my-16 p-8 rounded-lg border border-[var(--border)] bg-[var(--card)] text-center">
      <Lock className="h-10 w-10 mx-auto mb-4 text-[var(--muted-foreground)]" />
      <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">{postTitle}</h1>
      <p className="text-sm text-[var(--muted-foreground)] mb-6">{tp('passwordProtectedText')}</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('enterPassword')}
          className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)]"
          autoFocus
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password.trim()}
          className="w-full px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? t('verifying') : t('verify')}
        </button>
      </form>
    </div>
  );
}
