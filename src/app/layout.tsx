import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/hooks/use-theme";
import { ClientProviders } from "@/components/blog/client-providers";
import { getSiteTheme } from "@/server/actions/site-config.actions";
import { getSiteConfig } from "@/server/actions/site-config.actions";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const title = await getSiteConfig('site_title');
  return { title: title || 'quick-press', description: 'A modern blog CMS' };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { mode, theme } = await getSiteTheme();
  const locale = await getLocale();
  const messages = await getMessages();

  const isExplicitDark = mode === 'dark' || theme === 'night';
  const htmlClasses = [
    isExplicitDark ? 'dark' : '',
    `theme-${theme}`,
  ].filter(Boolean).join(' ');

  return (
    <html lang={locale} className={htmlClasses} data-theme-mode={mode} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ClientProviders>
            <ThemeProvider>{children}</ThemeProvider>
          </ClientProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
