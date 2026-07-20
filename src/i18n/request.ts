import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';
import { cookies } from 'next/headers';

export default getRequestConfig(async ({ requestLocale }) => {
  // 1) From middleware (createIntlMiddleware)
  const fromMiddleware = await requestLocale;
  if (fromMiddleware && hasLocale(routing.locales, fromMiddleware)) {
    return {
      locale: fromMiddleware,
      messages: (await import(`../messages/${fromMiddleware}.json`)).default,
    };
  }

  // 2) From NEXT_LOCALE cookie directly
  try {
    const cookieStore = await cookies();
    const fromCookie = cookieStore.get('NEXT_LOCALE')?.value;
    if (fromCookie && hasLocale(routing.locales, fromCookie)) {
      return {
        locale: fromCookie,
        messages: (await import(`../messages/${fromCookie}.json`)).default,
      };
    }
  } catch {}

  // 3) Default
  return {
    locale: routing.defaultLocale,
    messages: (await import(`../messages/${routing.defaultLocale}.json`)).default,
  };
});
