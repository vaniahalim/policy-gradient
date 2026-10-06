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
