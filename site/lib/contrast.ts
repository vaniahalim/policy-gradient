export type Rgba = { r: number; g: number; b: number; a: number };

/** Parses `#rgb`, `#rrggbb`, `rgb(r, g, b)` and `rgba(r, g, b, a)`. */
export function parseColor(input: string): Rgba {
  const s = input.trim().toLowerCase();
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
  }
  const fn = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (fn) return { r: +fn[1], g: +fn[2], b: +fn[3], a: fn[4] === undefined ? 1 : +fn[4] };
  throw new Error(`Cannot parse colour: ${input}`);
}

/** Lays a translucent colour over an opaque background and returns the opaque result. */
export function blend(fg: Rgba, bg: Rgba): Rgba {
  const mix = (f: number, b: number) => Math.round(f * fg.a + b * (1 - fg.a));
  return { r: mix(fg.r, bg.r), g: mix(fg.g, bg.g), b: mix(fg.b, bg.b), a: 1 };
}

function luminance({ r, g, b }: Rgba): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2 contrast ratio between two opaque colours, from 1 to 21. */
export function contrastRatio(fg: string, bg: string): number {
  const [hi, lo] = [luminance(parseColor(fg)), luminance(parseColor(bg))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Reads every `--name: value;` custom property from a stylesheet. Later declarations win. */
export function readTokens(css: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const m of css.matchAll(/(--[\w-]+)\s*:\s*([^;}]+);/g)) tokens[m[1]] = m[2].trim();
  return tokens;
}
