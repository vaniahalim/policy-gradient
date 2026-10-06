import { posix } from "node:path";

/**
 * Maps a request URL to the files that could serve it, inside `root`. Returns null when the URL is
 * malformed or tries to leave `root`. Candidates are in the order to try them.
 */
export function resolveStaticFile(root: string, urlPath: string): string[] | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(urlPath.split(/[?#]/)[0]);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;

  // Walk the segments and refuse any URL that ever steps above the root. posix.normalize alone would
  // quietly turn "/../x" into "/x", which is safe but hides the attempt.
  let depth = 0;
  for (const segment of decoded.split("/")) {
    if (segment === "" || segment === ".") continue;
    depth += segment === ".." ? -1 : 1;
    if (depth < 0) return null;
  }

  const normalized = posix.normalize(decoded);
  const full = posix.join(root, normalized);
  if (full !== root && !full.startsWith(`${root}/`)) return null;

  return normalized.endsWith("/") ? [posix.join(full, "index.html")] : [full, `${full}/index.html`, `${full}.html`];
}
