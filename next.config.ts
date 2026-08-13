import type { NextConfig } from 'next';

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/+$/, '');

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  basePath,
};

export default nextConfig;
