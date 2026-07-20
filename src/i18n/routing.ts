import { defineRouting } from 'next-intl/routing';

// No URL prefix: locale is resolved via the NEXT_LOCALE cookie / Accept-Language.
// This keeps all existing routes (incl. /api and Supabase auth callbacks) intact.
export const routing = defineRouting({
  locales: ['en', 'zh'],
  defaultLocale: 'en',
});

export type Locale = (typeof routing.locales)[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
};
