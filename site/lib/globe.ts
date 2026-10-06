// Geometry for the paper globe. Pure functions only: no DOM, so they are easy to test.
//
// Conventions (they match the CSS in components/globe.css):
//  - A sheet sits at (lon, lat) in degrees. Its transform is rotateY(lon) rotateX(lat) translateZ(R).
//  - The globe is turned with rotateX(gx) rotateY(gy). To bring (lon, lat) to the front: gy = -lon, gx = -lat.
//  - Unit vectors use x right, y UP, z toward the viewer.

import type { Jurisdiction } from "./schema";

const RAD = Math.PI / 180;
const GOLDEN_ANGLE = 2.39996;
export const MAX_TILT = 62;

export type Vec3 = [number, number, number];
export type LonLat = { lon: number; lat: number };

export const REGION_ORDER: Jurisdiction[] = ["europe", "us", "asia"];

export const vec = (lon: number, lat: number): Vec3 => [
  Math.cos(lat * RAD) * Math.sin(lon * RAD),
  Math.sin(lat * RAD),
  Math.cos(lat * RAD) * Math.cos(lon * RAD),
];

export const toLonLat = (v: Vec3): LonLat => ({
  lon: Math.atan2(v[0], v[2]) / RAD,
  lat: Math.asin(Math.max(-1, Math.min(1, v[1]))) / RAD,
});

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** The point `distance` degrees from `centre`, in the direction `theta` (radians, 0 = east). */
function offsetFrom(centre: LonLat, distance: number, theta: number): LonLat {
  const c = vec(centre.lon, centre.lat);
  const east: Vec3 = [Math.cos(centre.lon * RAD), 0, -Math.sin(centre.lon * RAD)];
  const north: Vec3 = [
    -Math.sin(centre.lat * RAD) * Math.sin(centre.lon * RAD),
    Math.cos(centre.lat * RAD),
    -Math.sin(centre.lat * RAD) * Math.cos(centre.lon * RAD),
  ];
  const s = Math.sin(distance * RAD);
  const k = Math.cos(distance * RAD);
  const out = c.map((x, i) => x * k + (east[i] * Math.cos(theta) + north[i] * Math.sin(theta)) * s) as Vec3;
  return toLonLat(out);
}

/** Small seeded generator so every build and every browser lays the globe out identically. */
function seeded(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export type LayoutInput = {
  instruments: { slug: string; jurisdiction: Jurisdiction; timeline: unknown[] }[];
  items: { id: string; jurisdiction: Jurisdiction }[];
};

export type SheetKind = "instrument" | "item" | "event";

export type LayoutSheet = {
  id: string;
  kind: SheetKind;
  region: Jurisdiction;
  lon: number;
  lat: number;
  file: number;
  /** events only: the instrument they belong to, and which timeline entry they are */
  parentId?: string;
  eventIndex?: number;
};

/**
 * Anchors (instruments and items) are spread evenly over the sphere on a Fibonacci spiral, then handed out in
 * region order along longitude so each region keeps its own band. With `events`, each instrument's timeline
 * entries orbit it as smaller sheets.
 */
export function layoutSheets(input: LayoutInput, options: { events: boolean }): LayoutSheet[] {
  const anchors: { kind: "instrument" | "item"; id: string; region: Jurisdiction; timelineLength: number }[] = [];
  for (const region of REGION_ORDER) {
    for (const i of input.instruments.filter((x) => x.jurisdiction === region)) {
      anchors.push({ kind: "instrument", id: i.slug, region, timelineLength: i.timeline.length });
    }
    for (const it of input.items.filter((x) => x.jurisdiction === region)) {
      anchors.push({ kind: "item", id: it.id, region, timelineLength: 0 });
    }
  }

  const n = anchors.length;
  const points = anchors
    .map((_, i): LonLat => ({
      lon: (((i * GOLDEN_ANGLE) / RAD) % 360 + 360) % 360,
      lat: Math.asin(0.86 * (1 - (2 * (i + 0.5)) / n)) / RAD, // 0.86 keeps sheets clear of the poles
    }))
    .sort((a, b) => ((a.lon + 50) % 360) - ((b.lon + 50) % 360));

  const sheets: Omit<LayoutSheet, "file">[] = [];
  anchors.forEach((a, i) => {
    const p = points[i];
    sheets.push({ id: a.id, kind: a.kind, region: a.region, lon: p.lon, lat: p.lat });
    if (options.events && a.kind === "instrument") {
      for (let j = 0; j < a.timelineLength; j++) {
        const r = seeded(`${a.id}${j}`);
        const q = offsetFrom(p, 15 + r() * 4, j * ((2 * Math.PI) / a.timelineLength) + r() * 0.6);
        sheets.push({ id: `${a.id}#${j}`, kind: "event", region: a.region, lon: q.lon, lat: q.lat, parentId: a.id, eventIndex: j });
      }
    }
  });
  return sheets.map((s, i) => ({ ...s, file: i + 1 }));
}

/** Where to spin to for a region: the mean direction of its sheets. */
export function regionCentres(sheets: LayoutSheet[]): Record<Jurisdiction, LonLat> {
  const centres = {} as Record<Jurisdiction, LonLat>;
  for (const region of REGION_ORDER) {
    const sum: Vec3 = [0, 0, 0];
    for (const s of sheets.filter((x) => x.region === region)) {
      const v = vec(s.lon, s.lat);
      sum[0] += v[0];
      sum[1] += v[1];
      sum[2] += v[2];
    }
    centres[region] = toLonLat(sum);
  }
  return centres;
}

/** Globe rotation that puts (lon, lat) at the front, turning the short way round. */
export function spinTarget(current: { gx: number; gy: number }, lon: number, lat: number): { gx: number; gy: number } {
  const wanted = -lon;
  const delta = ((((wanted - current.gy) % 360) + 540) % 360) - 180;
  return { gx: clamp(-lat, -MAX_TILT, MAX_TILT), gy: current.gy + delta };
}

/**
 * How much to darken a sheet (0 to 0.55) given where it sits and how the globe is turned.
 * Sheets facing the viewer stay bright; sheets turning away fall into shadow.
 */
export function darkness(lon: number, lat: number, gx: number, gy: number): number {
  const [x, yUp, z] = vec(lon, lat);
  const y = -yUp; // CSS y points down
  const [sa, ca] = [Math.sin(gy * RAD), Math.cos(gy * RAD)];
  const [sb, cb] = [Math.sin(gx * RAD), Math.cos(gx * RAD)];
  const facing = y * sb + (-x * sa + z * ca) * cb; // after rotateY(gy), then rotateX(gx)
  return facing >= 0 ? (1 - Math.min(1, facing * 1.6)) * 0.38 : 0.55;
}

/** A sheet's tilt (degrees) and paper tint (0 to 2), fixed by its id so server and browser agree. */
export function sheetLook(id: string): { tz: number; tx: number; ty: number; paper: 0 | 1 | 2 } {
  const r = seeded(id);
  const tz = r() * 14 - 7;
  const tx = r() * 6 - 3;
  const ty = r() * 6 - 3;
  return { tz, tx, ty, paper: Math.floor(r() * 3) as 0 | 1 | 2 };
}
