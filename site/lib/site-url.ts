const DEFAULT_URL = "http://localhost:3000";

/**
 * The public address of the deployed site.
 *
 * `raw` is the SITE_URL environment variable and always wins. `hostAddress` is the address the host reports for the
 * production site, as a bare hostname (Vercel sets VERCEL_PROJECT_PRODUCTION_URL), and is only a safety net for when
 * SITE_URL is missing. RSS links must be absolute, so a malformed value fails the build instead of shipping broken links.
 * `isDefault` is true when neither was set, so the caller can warn that links point at localhost.
 */
export function resolveSiteUrl(raw: string | undefined, hostAddress?: string): { url: string; isDefault: boolean } {
  const explicit = raw?.trim();
  if (explicit) return { url: absolute(explicit, "SITE_URL"), isDefault: false };

  const host = hostAddress?.trim();
  if (host) return { url: absolute(/^https?:\/\//i.test(host) ? host : `https://${host}`, "The host's production address"), isDefault: false };

  return { url: DEFAULT_URL, isDefault: true };
}

function absolute(value: string, name: string): string {
  if (!/^https?:\/\/[^\s/]+(\/\S*)?$/i.test(value)) {
    throw new Error(`${name} must be an absolute http(s) URL such as https://policygradient.example, got "${value}"`);
  }
  return value.replace(/\/+$/, "");
}
