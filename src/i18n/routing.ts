import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'never',
});

export type Locale = (typeof routing.locales)[number];

export const { getPathname, redirect } = createNavigation(routing);

export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
};
