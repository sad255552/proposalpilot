import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["76.13.51.115"],
  turbopack: {
    root: "/root/proposalpilot"
  }
};

export default nextConfig;
