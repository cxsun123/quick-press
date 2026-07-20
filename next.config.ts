import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  transpilePackages: ["@chengxinsun26/editor"],
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: ['127.0.0.1'],
};

export default withNextIntl(nextConfig);
