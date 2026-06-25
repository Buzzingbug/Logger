import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@logger/shared', '@logger/db'],
};

export default nextConfig;
