import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["phaser"],
  webpack: (config) => {
    config.resolve ??= {};
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      fs: false,
    };

    return config;
  },
};

export default nextConfig;
