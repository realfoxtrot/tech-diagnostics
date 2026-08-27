import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Разрешить доступ из tailnet (MacBook Олега через Tailscale)
  allowedDevOrigins: ["100.64.0.2", "localhost", "127.0.0.1"],
};

export default nextConfig;
