import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';
import { cookies } from 'next/headers';

export default getRequestConfig(async ({ requestLocale }) => {
  const fromMiddleware = await requestLocale;
  if (fromMiddleware && hasLocale(routing.locales, fromMiddleware)) {
    return {
      locale: fromMiddleware,
      messages: (await import(`../messages/${fromMiddleware}.json`)).default,
    };
  }

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

  // Fallback: site-wide default locale from site_config
  try {
    const { createAdminClient } = await import('@/server/db/client');
    const admin = createAdminClient();
    const { data } = await admin
      .from('site_config')
      .select('value')
      .eq('key', 'locale')
      .single();
    if (data?.value && hasLocale(routing.locales, data.value)) {
      return {
        locale: data.value,
        messages: (await import(`../messages/${data.value}.json`)).default,
      };
    }
  } catch {}

  return {
    locale: routing.defaultLocale,
    messages: (await import(`../messages/${routing.defaultLocale}.json`)).default,
  };
});
