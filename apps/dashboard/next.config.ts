import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@logger/shared', '@logger/db'],
  distDir: 'build',
};

export default nextConfig;
