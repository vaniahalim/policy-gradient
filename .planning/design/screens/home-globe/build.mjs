// Generates option-a.html (instruments + timeline events + items) and option-b.html
// (instruments + items only) from template.html and the REAL content in ../../../../content.
// Usage: node .planning/design/screens/home-globe/build.mjs
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const content = join(here, "../../../../content");

function readJson(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => JSON.parse(readFileSync(join(e.parentPath, e.name), "utf8")));
}

const data = {
  instruments: readJson(join(content, "instruments")).sort((a, b) => a.name.localeCompare(b.name)),
  items: readJson(join(content, "items")).sort((a, b) => b.event_date.localeCompare(a.event_date)),
};
const template = readFileSync(join(here, "template.html"), "utf8");
// "</" inside a script block would end it early.
const json = JSON.stringify(data).replace(/<\//g, "<\\/");

for (const option of ["a", "b"]) {
  const html = template
    .replaceAll("__OPTION_UPPER__", option.toUpperCase())
    .replaceAll("__OPTION__", option)
    .replace("__DATA__", () => json);
  writeFileSync(join(here, `option-${option}.html`), html);
}
console.log(`Built option-a.html and option-b.html from ${data.instruments.length} instruments and ${data.items.length} items.`);
