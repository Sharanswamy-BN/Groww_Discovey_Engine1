import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["groq-sdk", "google-play-scraper"],
};

export default nextConfig;
