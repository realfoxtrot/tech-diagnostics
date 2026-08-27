import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Разрешить доступ из tailnet (MacBook Олега через Tailscale)
  allowedDevOrigins: ["100.64.0.2", "localhost", "127.0.0.1"],
  // Убрать плашку Next.js Dev Tools ("N 1 Issue") у пользователей
  devIndicators: false,
};

export default nextConfig;
