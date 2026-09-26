import type { NextConfig } from "next";

const githubPages = process.env.GITHUB_ACTIONS === "true";
const basePath = githubPages ? "/ohio-website" : "";
const nextConfig: NextConfig = {
  ...(githubPages ? { output: "export" as const, trailingSlash: true, basePath, assetPrefix: basePath } : {}),
};
export default nextConfig;
