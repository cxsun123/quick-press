'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Check, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import type { PostVisibility } from '@/models/post.model';

interface VisibilityPanelProps {
  visibility: PostVisibility;
  onChange: (v: PostVisibility) => void;
  password: string;
  onPasswordChange: (p: string) => void;
  slug?: string;
  postId?: string;
  passwordSavedVersion?: number;
}

export function VisibilityPanel({
  visibility,
  onChange,
  password,
  onPasswordChange,
  slug,
  passwordSavedVersion = 0,
}: VisibilityPanelProps) {
  const t = useTranslations('post');
  const tc = useTranslations('common');
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const savedPasswordRef = useRef(password);

  useEffect(() => {
    savedPasswordRef.current = password;
  }, [passwordSavedVersion]);

  const passwordChanged = visibility === 'password' && password !== savedPasswordRef.current;

  const shareUrl = slug
    ? `${window.location.origin}/blog/${slug}`
    : null;

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const OPTIONS: { value: PostVisibility; label: string; desc: string }[] = [
    { value: 'public', label: t('public'), desc: t('publicDesc') },
    { value: 'private', label: t('private'), desc: t('privateDesc') },
    { value: 'password', label: t('passwordProtected'), desc: t('passwordDesc') },
  ];

  return (
    <div>
      <div className="text-xs text-[var(--muted-foreground)] mb-2">{t('visibility')}</div>
      <div className="space-y-1">
        {OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors ${
              visibility === opt.value
                ? 'bg-[var(--primary)]/10 text-[var(--foreground)]'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)]'
            }`}
          >
            <input
              type="radio"
              name="visibility"
              value={opt.value}
              checked={visibility === opt.value}
              onChange={() => onChange(opt.value)}
              className="accent-[var(--primary)]"
            />
            <div>
              <div className="text-sm font-medium">{opt.label}</div>
              <div className="text-xs text-[var(--muted-foreground)]">{opt.desc}</div>
            </div>
          </label>
        ))}
      </div>
      {visibility === 'password' && (
        <div className="mt-2 space-y-2">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder={t('passwordPlaceholder')}
              className="w-full px-2 py-1.5 text-sm rounded-md border border-[var(--border)] bg-transparent text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[var(--ring)] pr-8"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {passwordChanged && (
            <div className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>{t('passwordNote')}</span>
            </div>
          )}
          {shareUrl && (
            <div className="flex items-center gap-2 p-2 rounded-md border border-[var(--border)] bg-[var(--background-secondary)]">
              <span className="text-xs text-[var(--muted-foreground)] truncate flex-1 min-w-0 font-mono">
                {shareUrl}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-[var(--border)] hover:bg-[var(--accent)] shrink-0 transition-colors"
              >
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                {copied ? tc('copied') : tc('copy')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
