import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDate, stageLabel, stageTone } from "./labels";

test("formats a calendar date without shifting it by timezone", () => {
  assert.equal(formatDate("2025-07-10"), "10 Jul 2025");
  assert.equal(formatDate("2026-01-01"), "1 Jan 2026");
  assert.equal(formatDate("2026-09-30"), "30 Sep 2026");
});

test("formats the date part of a UTC timestamp", () => {
  assert.equal(formatDate("2026-10-05T23:59:59Z"), "5 Oct 2026");
});

test("rejects something that is not a date", () => {
  assert.throws(() => formatDate("soon"), /date/i);
});

test("labels every stage in plain words", () => {
  assert.equal(stageLabel("in_force"), "In force");
  assert.equal(stageLabel("consultation"), "Consultation");
  assert.equal(stageLabel("withdrawn"), "Withdrawn");
});

test("tones group stages by what they mean", () => {
  assert.equal(stageTone("in_force"), "oxblood");
  assert.equal(stageTone("proposed"), "pen");
  assert.equal(stageTone("consultation"), "pen");
  assert.equal(stageTone("passed"), "brass");
  assert.equal(stageTone("amended"), "brass");
  assert.equal(stageTone("repealed"), "grey");
});
