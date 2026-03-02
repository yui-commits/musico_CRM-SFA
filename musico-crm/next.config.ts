import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack due to bug with multibyte chars in file paths
  // https://github.com/vercel/next.js/issues (Turbopack panic with Japanese paths)
};

export default nextConfig;
