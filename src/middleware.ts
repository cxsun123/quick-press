import { type NextRequest } from 'next/server';
import { updateSession } from '@/server/db/middleware';
import { routing } from '@/i18n/routing';

const COOKIE_NAME = 'NEXT_LOCALE';

function resolveLocale(request: NextRequest): string {
  const existing = request.cookies.get(COOKIE_NAME)?.value;
  if (existing && routing.locales.includes(existing as any)) {
    return existing;
  }
  const header = request.headers.get('accept-language') || '';
  const preferred = header.split(',')[0]?.split('-')[0]?.trim();
  if (preferred && routing.locales.includes(preferred as any)) {
    return preferred;
  }
  return routing.defaultLocale;
}

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);

  // Persist the resolved locale so next-intl (getLocale / requestLocale) can read it.
  const locale = resolveLocale(request);
  if (request.cookies.get(COOKIE_NAME)?.value !== locale) {
    response.cookies.set(COOKIE_NAME, locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
