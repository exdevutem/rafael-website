import type { NextConfig } from 'next';

const onCloudflarePages = process.env.CF_PAGES === '1';
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_AUTH_URL: onCloudflarePages
      ? ''
      : process.env.REACT_APP_AUTH_URL || '',
    NEXT_PUBLIC_API_URL: onCloudflarePages
      ? '/api'
      : process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || '',
  },
};
export default nextConfig;
