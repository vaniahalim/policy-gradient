import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseColor, blend, contrastRatio, readTokens } from "./contrast";

test("black on white is 21:1 and a colour on itself is 1:1", () => {
  assert.equal(contrastRatio("#000000", "#ffffff").toFixed(2), "21.00");
  assert.equal(contrastRatio("#8a2a1d", "#8a2a1d").toFixed(2), "1.00");
});

test("parses 3 and 6 digit hex and rgba()", () => {
  assert.deepEqual(parseColor("#fff"), { r: 255, g: 255, b: 255, a: 1 });
  assert.deepEqual(parseColor("#2a1c13"), { r: 42, g: 28, b: 19, a: 1 });
  assert.deepEqual(parseColor("rgba(234, 223, 196, 0.78)"), { r: 234, g: 223, b: 196, a: 0.78 });
});

test("blends a translucent colour over its background", () => {
  const half = blend(parseColor("rgba(255, 255, 255, 0.5)"), parseColor("#000000"));
  assert.deepEqual(half, { r: 128, g: 128, b: 128, a: 1 });
});

test("reads custom properties out of a stylesheet", () => {
  const t = readTokens(":root { --ink: #1d1712; --x: 3px; --paper: #eadfc4; }");
  assert.equal(t["--ink"], "#1d1712");
  assert.equal(t["--paper"], "#eadfc4");
});

// The real tokens. Body text needs 4.5:1 (WCAG AA). Pairs are taken from how the CSS uses each token.
const css = readFileSync(join(__dirname, "../app/globals.css"), "utf8");
const T = readTokens(css);
const c = (name: string) => {
  const v = T[`--${name}`];
  assert.ok(v, `token --${name} exists`);
  return v;
};

const papers = ["paper", "paper-aged", "paper-pale"];
const AA = 4.5;

for (const bg of papers) {
  for (const fg of ["ink", "ink-soft", "oxblood", "pen", "brass"]) {
    test(`${fg} on ${bg} meets AA`, () => {
      const r = contrastRatio(c(fg), c(bg));
      assert.ok(r >= AA, `${fg} on ${bg} is ${r.toFixed(2)}:1`);
    });
  }
}

test("summary text colour on the paper tints meets AA", () => {
  for (const bg of papers) {
    const r = contrastRatio("#2c231b", c(bg));
    assert.ok(r >= AA, `#2c231b on ${bg} is ${r.toFixed(2)}:1`);
  }
});

test("paper text on ink (kind badges, tooltips, active pills) meets AA", () => {
  assert.ok(contrastRatio(c("paper"), c("ink")) >= AA);
});

test("ink on the paper pill when active meets AA", () => {
  assert.ok(contrastRatio(c("ink"), c("paper")) >= AA);
});

// Text on the desk. The lamp glow lightens the centre of the walnut, so test the lightest it gets too.
const lamp = blend(parseColor("rgba(255, 205, 140, 0.13)"), parseColor(c("walnut")));
const desks: [string, string][] = [
  ["walnut", c("walnut")],
  ["walnut under the lamp glow", `rgb(${lamp.r}, ${lamp.g}, ${lamp.b})`],
];

for (const [name, bg] of desks) {
  test(`on-desk text on ${name} meets AA`, () => {
    const r = contrastRatio(c("on-desk"), bg);
    assert.ok(r >= AA, `${r.toFixed(2)}:1`);
  });
  test(`translucent desk captions on ${name} meet AA`, () => {
    for (const a of [0.7, 0.78, 0.82]) {
      const fg = blend(parseColor(`rgba(234, 223, 196, ${a})`), parseColor(bg));
      const r = contrastRatio(`rgb(${fg.r}, ${fg.g}, ${fg.b})`, bg);
      assert.ok(r >= AA, `alpha ${a} is ${r.toFixed(2)}:1`);
    }
  });
}

// Hover links are the nav (top) and the bottom bar. The lamp glow fades to nothing by 70% of its 60%-tall radius,
// and those links sit at 70% and more from its centre, so the plain walnut is what is behind them.
test("brass-fill hover text on walnut meets AA", () => {
  const r = contrastRatio(c("brass-fill"), c("walnut"));
  assert.ok(r >= AA, `${r.toFixed(2)}:1`);
});

test("ink on the brass fill meets AA", () => {
  assert.ok(contrastRatio(c("ink"), c("brass-fill")) >= AA);
});
