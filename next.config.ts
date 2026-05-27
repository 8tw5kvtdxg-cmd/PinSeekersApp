import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.97", "192.168.1.66"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
