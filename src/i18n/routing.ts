import { defineRouting } from 'next-intl/routing';
import { getDefaultConfig } from 'next-intl/server';

export const routing = defineRouting({
  locales: ['en', 'zh'],
  defaultLocale: 'en',
});

export type Locale = (typeof routing.locales)[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
};
