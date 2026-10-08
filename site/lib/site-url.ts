const DEFAULT_URL = "http://localhost:3000";

/**
 * The public address of the deployed site, from the SITE_URL environment variable.
 * RSS links must be absolute, so a malformed value fails the build instead of shipping broken links.
 * `isDefault` is true when it was unset, so the caller can warn that links point at localhost.
 */
export function resolveSiteUrl(raw: string | undefined): { url: string; isDefault: boolean } {
  const value = raw?.trim();
  if (!value) return { url: DEFAULT_URL, isDefault: true };
  if (!/^https?:\/\/[^\s/]+/i.test(value)) {
    throw new Error(`SITE_URL must be an absolute http(s) URL such as https://policygradient.example, got "${value}"`);
  }
  return { url: value.replace(/\/+$/, ""), isDefault: false };
}
