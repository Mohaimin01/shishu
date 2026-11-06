// Shared base path. Blank locally; "/shishu" for GitHub Pages builds (GITHUB_PAGES=true).
export const BASE_PATH = process.env.GITHUB_PAGES === "true" ? "/shishu" : "";

/** Prefixes a root-absolute asset path with the base path (for raw <img src> etc.). */
export function assetPath(p: string): string {
  return `${BASE_PATH}${p}`;
}
