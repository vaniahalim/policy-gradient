import { test } from "node:test";
import assert from "node:assert/strict";
import { layoutSheets, regionCentres, spinTarget, darkness, sheetLook, vec, toLonLat, type LayoutInput } from "./globe";

const timeline = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ date: `2025-0${i + 1}-01`, stage: "in_force", note: `n${i}`, source_url: "https://example.org" }));

const input = (): LayoutInput => ({
  instruments: [
    { slug: "eu-a", jurisdiction: "europe", timeline: timeline(3) },
    { slug: "eu-b", jurisdiction: "europe", timeline: timeline(2) },
    { slug: "us-a", jurisdiction: "us", timeline: timeline(4) },
    { slug: "cn-a", jurisdiction: "asia", timeline: timeline(1) },
  ],
  items: [{ id: "item-1", jurisdiction: "us" }],
});

test("a sheet per instrument, item and (in full mode) timeline event", () => {
  const sheets = layoutSheets(input(), { events: true });
  assert.equal(sheets.length, 4 + 1 + (3 + 2 + 4 + 1));
  assert.equal(sheets.filter((s) => s.kind === "instrument").length, 4);
  assert.equal(sheets.filter((s) => s.kind === "item").length, 1);
  assert.equal(sheets.filter((s) => s.kind === "event").length, 10);
});

test("compact mode leaves out timeline events", () => {
  const sheets = layoutSheets(input(), { events: false });
  assert.equal(sheets.length, 5);
});

test("layout is deterministic", () => {
  assert.deepEqual(layoutSheets(input(), { events: true }), layoutSheets(input(), { events: true }));
});

test("ids are unique and file numbers run from 1", () => {
  const sheets = layoutSheets(input(), { events: true });
  assert.equal(new Set(sheets.map((s) => s.id)).size, sheets.length);
  assert.deepEqual(sheets.map((s) => s.file), sheets.map((_, i) => i + 1));
});

test("positions stay on the sphere and clear of the poles", () => {
  for (const s of layoutSheets(input(), { events: true })) {
    assert.ok(s.lon >= -180 && s.lon <= 360, `lon ${s.lon}`);
    assert.ok(Math.abs(s.lat) <= 80, `lat ${s.lat}`);
  }
});

test("events sit close to their instrument", () => {
  const sheets = layoutSheets(input(), { events: true });
  const angle = (a: { lon: number; lat: number }, b: { lon: number; lat: number }) => {
    const [u, v] = [vec(a.lon, a.lat), vec(b.lon, b.lat)];
    return (Math.acos(Math.min(1, u[0] * v[0] + u[1] * v[1] + u[2] * v[2])) * 180) / Math.PI;
  };
  for (const e of sheets.filter((s) => s.kind === "event")) {
    const parent = sheets.find((s) => s.id === e.parentId)!;
    assert.ok(angle(e, parent) < 25, `${e.id} is ${angle(e, parent)} degrees from its instrument`);
  }
});

test("each region occupies its own band: no region's anchors interleave with another's in longitude", () => {
  const anchors = layoutSheets(input(), { events: false })
    .map((s) => ({ region: s.region, lon: (((s.lon + 50) % 360) + 360) % 360 }))
    .sort((a, b) => a.lon - b.lon)
    .map((a) => a.region);
  const changes = anchors.filter((r, i) => i > 0 && r !== anchors[i - 1]).length;
  assert.equal(changes, 2); // europe | us | asia
});

test("region centre is the mean direction of that region's sheets", () => {
  const sheets = layoutSheets(input(), { events: false });
  const centres = regionCentres(sheets);
  const asia = sheets.find((s) => s.region === "asia")!;
  assert.ok(Math.abs(centres.asia.lat - asia.lat) < 1e-6);
  assert.ok(Math.abs(((centres.asia.lon - asia.lon + 540) % 360) - 180) < 1e-6);
});

test("spinTarget brings a position to the front by the short way round", () => {
  const t = spinTarget({ gx: 0, gy: 10 }, 350, 20);
  assert.ok(Math.abs(t.gy - 10) <= 180);
  assert.equal(((t.gy % 360) + 360) % 360, (((-350) % 360) + 360) % 360);
  assert.equal(t.gx, -20);
});

test("spinTarget clamps how far the globe tips", () => {
  assert.equal(spinTarget({ gx: 0, gy: 0 }, 0, 80).gx, -62);
  assert.equal(spinTarget({ gx: 0, gy: 0 }, 0, -80).gx, 62);
});

test("a sheet facing the viewer is not darkened; one facing away is", () => {
  assert.equal(darkness(0, 0, 0, 0), 0);
  assert.ok(darkness(0, 0, 0, 180) >= 0.5);
});

test("darkness grows as a sheet turns away", () => {
  assert.ok(darkness(0, 0, 0, 20) < darkness(0, 0, 0, 70));
});

test("lon/lat round-trips through a unit vector", () => {
  const p = toLonLat(vec(123, -33));
  assert.ok(Math.abs(p.lon - 123) < 1e-9 && Math.abs(p.lat + 33) < 1e-9);
});

test("a sheet's look is deterministic and stays within its bounds", () => {
  for (const id of ["eu-ai-act", "us-ny-raise-act#2", "item-1"]) {
    const a = sheetLook(id);
    assert.deepEqual(a, sheetLook(id));
    assert.ok(Math.abs(a.tz) <= 7 && Math.abs(a.tx) <= 3 && Math.abs(a.ty) <= 3);
    assert.ok([0, 1, 2].includes(a.paper));
  }
});

test("different sheets get different looks", () => {
  const looks = new Set(["a", "b", "c", "d", "e", "f"].map((id) => JSON.stringify(sheetLook(id))));
  assert.ok(looks.size > 1);
});
