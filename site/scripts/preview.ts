// Serves the static export (site/out) on localhost so it can be browsed before deploying.
// Usage: npm run build && npm run preview   (PORT=4173 by default)
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";
import { resolveStaticFile } from "../lib/static-path";

const ROOT = resolve(__dirname, "../out");
const PORT = Number(process.env.PORT ?? 4173);

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/rss+xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

if (!existsSync(ROOT)) {
  console.error(`No export found at ${ROOT}. Run "npm run build" first.`);
  process.exit(1);
}

const isFile = (p: string) => existsSync(p) && statSync(p).isFile();

createServer((req, res) => {
  const found = resolveStaticFile(ROOT, req.url ?? "/")?.find(isFile);
  const file = found ?? resolve(ROOT, "404.html");
  res.writeHead(found ? 200 : 404, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
  res.end(isFile(file) ? readFileSync(file) : "Not found");
}).listen(PORT, "127.0.0.1", () => console.log(`Preview: http://localhost:${PORT}  (Ctrl+C to stop)`));
