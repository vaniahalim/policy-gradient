// Hosts that serve the correct page to browsers but return 403 to automated fetches.
// The link check reports these as skipped instead of failed.
const BOT_BLOCKING_HOSTS = new Set(["leginfo.legislature.ca.gov", "www.nysenate.gov"]);

export function blocksAutomatedFetches(url: string): boolean {
  try {
    return BOT_BLOCKING_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

// Node checks certificate chains more strictly than browsers and curl, which can fetch a missing intermediate
// certificate themselves. These codes mean "the chain would not verify here", not "the page is down".
const CERTIFICATE_ERROR_CODES = new Set([
  "SELF_SIGNED_CERT_IN_CHAIN",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "UNABLE_TO_GET_ISSUER_CERT",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "CERT_UNTRUSTED",
]);

export function isCertificateError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("cause" in error)) return false;
  const cause = (error as { cause?: { code?: unknown } }).cause;
  return typeof cause?.code === "string" && CERTIFICATE_ERROR_CODES.has(cause.code);
}

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

/**
 * Arguments for `curl` as a retry when Node cannot verify a certificate chain. Certificate checking stays ON.
 * Run it with execFile (no shell). The URL comes after "--" so it can never be read as an option.
 */
export function curlArgs(url: string): string[] {
  if (!/^https?:\/\//i.test(url)) throw new Error("The curl fallback only handles http(s) URLs.");
  return [
    "-sS", "-L", "--max-time", "20", "-o", "/dev/null", "-w", "%{http_code}",
    "-A", BROWSER_USER_AGENT,
    "-H", "Accept: text/html,application/xhtml+xml,application/pdf,*/*;q=0.8",
    "--", url,
  ];
}

/** Turns the status code curl printed into null (fine) or a short problem description. */
export function curlStatus(printed: string): string | null {
  const code = Number(printed.trim());
  if (!Number.isInteger(code) || code === 0) return "no response";
  return code >= 200 && code < 300 ? null : `HTTP ${code}`;
}
