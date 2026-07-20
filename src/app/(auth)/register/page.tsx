import { redirect } from 'next/navigation';
import { register } from '@/server/actions/auth.actions';
import { getRegistrationMode } from '@/server/actions/site-config.actions';
import { AuthLayout } from '@/components/auth/auth-layout';

export default async function RegisterPage(props: { searchParams?: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  const error = searchParams?.error;
  const mode = await getRegistrationMode();

  if (mode === 'closed') {
    redirect('/login?reason=closed');
  }

  return (
    <AuthLayout title={mode === 'invite' ? '邀请注册' : '注册'}>
      {error && (
        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          {error}
        </div>
      )}
      <form action={register} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)] mb-1">
            昵称
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)] mb-1">
            邮箱
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)] mb-1">
            密码
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
        {mode === 'invite' && (
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-[var(--foreground)] mb-1">
              邀请码
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            />
          </div>
        )}
        <button
          type="submit"
          className="w-full py-2 px-4 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 transition-opacity"
        >
          注册
        </button>
        <p className="text-sm text-center text-[var(--muted-foreground)]">
          已有账号？
          <a href="/login" className="text-[var(--primary)] hover:underline ml-1">登录</a>
        </p>
      </form>
    </AuthLayout>
  );
}
