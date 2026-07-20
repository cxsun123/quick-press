import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/hooks/use-theme";
import { ClientProviders } from "@/components/blog/client-providers";
import { getSiteTheme } from "@/server/actions/site-config.actions";
import { getSiteConfig } from "@/server/actions/site-config.actions";

export async function generateMetadata(): Promise<Metadata> {
  const title = await getSiteConfig('site_title');
  return { title: title || 'i_blog', description: 'A modern blog CMS' };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { mode, theme } = await getSiteTheme();

  // Compute initial classes for SSR to avoid flash
  // Only set dark class when mode is explicitly 'dark' or theme is 'night'
  // For 'system' mode, let client-side resolve it
  const isExplicitDark = mode === 'dark' || theme === 'night';
  const htmlClasses = [
    isExplicitDark ? 'dark' : '',
    `theme-${theme}`,
  ].filter(Boolean).join(' ');

  return (
    <html lang="zh-CN" className={htmlClasses} data-theme-mode={mode} suppressHydrationWarning>
      <body>
        <ClientProviders>
          <ThemeProvider>{children}</ThemeProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
