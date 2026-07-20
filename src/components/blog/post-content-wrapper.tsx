'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PasswordGate } from '@/components/password-gate';
import { CommentSection } from '@/components/blog/comment-section';
import Link from 'next/link';
import { MermaidBlock } from '@chengxinsun26/editor';

interface PostContentWrapperProps {
  postId: string;
  postTitle: string;
  needsPassword: boolean;
}

export function PostContentWrapper({
  postId,
  postTitle,
  needsPassword,
}: PostContentWrapperProps) {
  const [postData, setPostData] = useState<{
    id: string;
    title: string;
    htmlContent: string;
    published_at: string | null;
  } | null>(null);
  const t = useTranslations('home');

  if (needsPassword && !postData) {
    return (
      <PasswordGate
        postId={postId}
        postTitle={postTitle}
        onVerified={(data) => setPostData(data)}
      />
    );
  }

  if (!postData) return null;

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-sm p-8 md:p-12">
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">{postData.title}</h1>
        <div className="text-sm text-[var(--muted-foreground)] mb-8">
          {postData.published_at && new Date(postData.published_at).toLocaleDateString('zh-CN')}
        </div>
        <div
          className="prose prose-lg max-w-none text-[var(--foreground)] leading-relaxed
            prose-headings:text-[var(--foreground)] prose-p:text-[var(--foreground)]
            prose-strong:text-[var(--foreground)] prose-em:text-[var(--foreground)]
            prose-code:text-[var(--primary)] prose-code:bg-[var(--muted)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-[var(--muted)] prose-pre:text-[var(--foreground)]
            prose-blockquote:border-[var(--primary)] prose-blockquote:text-[var(--muted-foreground)]
            prose-a:text-[var(--primary)]
            prose-img:inline prose-img:rounded-lg
            prose-hr:border-[var(--border)]"
          dangerouslySetInnerHTML={{ __html: postData.htmlContent }}
        />
        <MermaidBlock />
      </div>
      <div className="max-w-4xl mx-auto px-4">
        <CommentSection postId={postData.id} />
      </div>
      <div className="max-w-4xl mx-auto mt-12 pt-8 border-t border-[var(--border)]">
        <Link href="/" className="text-sm text-[var(--primary)] hover:underline">
          {t('backToHome')}
        </Link>
      </div>
    </article>
  );
}
