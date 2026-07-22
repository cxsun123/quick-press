import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/hooks/use-theme";
import { findFontOption } from "@/lib/fonts";
import { ClientProviders } from "@/components/blog/client-providers";
import { getSiteTheme, getSiteConfig } from "@/server/actions/site-config.actions";
import { getFontFamily } from "@/server/services/site-config.service";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const title = await getSiteConfig('site_title');
  return {
    title: title || 'quick-press',
    description: 'A modern blog CMS',
    icons: { icon: '/favicon.ico' },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { mode, theme } = await getSiteTheme();
  const locale = await getLocale();
  const messages = await getMessages();
  const fontId = await getFontFamily();

  const isExplicitDark = mode === 'dark' || theme === 'night';
  const htmlClasses = [
    isExplicitDark ? 'dark' : '',
    `theme-${theme}`,
  ].filter(Boolean).join(' ');

  const fontOpt = findFontOption(fontId);

  const htmlStyle = {
    '--font-body': fontOpt.fontBody,
    '--font-heading': fontOpt.fontHeading,
  } as React.CSSProperties;

  return (
    <html lang={locale} className={htmlClasses} data-theme-mode={mode} style={htmlStyle} suppressHydrationWarning>
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
