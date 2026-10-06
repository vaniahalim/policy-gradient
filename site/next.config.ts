import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The site is plain static files: content lives in git and is read at build time.
  output: "export",
  // /files/ -> files/index.html, which any static host can serve (the default /files -> files.html needs host support).
  trailingSlash: true,
  // A stray package-lock.json higher up the disk would otherwise be picked as the project root.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
