import type { NextConfig } from "next";
import withSerwist from "@serwist/next";
import { BASE_PATH } from "./lib/paths";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: process.env.GITHUB_PAGES === "true" ? BASE_PATH : "",
};

export default withSerwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
