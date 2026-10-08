"use client";

import "./globe.css";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { regionCentres, REGION_ORDER } from "@/lib/globe";
import { formatDate, stageLabel } from "@/lib/labels";
import { INSTRUMENT_KIND_LABELS, type Instrument, type Item, type Jurisdiction } from "@/lib/schema";
import { DetailPanel } from "./DetailPanel";
import { NavInfo } from "./NavInfo";
import { Sheet } from "./Sheet";
import { buildSheetViews, viewStage, viewSubregion, viewTitle, type SheetView } from "./sheet-view";
import { useGlobeMotion } from "./useGlobeMotion";

const REGION_LABELS: Record<Jurisdiction, string> = { europe: "Europe", us: "US", asia: "Asia" };
const HOME_VIEW = { lon: 18, lat: 6 };

type Region = "all" | Jurisdiction;

export function GlobeHome({ instruments, items }: { instruments: Instrument[]; items: Item[] }) {
  const views = useMemo(() => buildSheetViews(instruments, items), [instruments, items]);
  const byId = useMemo(() => new Map(views.map((v) => [v.id, v])), [views]);
  const centres = useMemo(() => regionCentres(views), [views]);
  const lastVerified = useMemo(() => instruments.map((i) => i.last_verified).sort().at(-1), [instruments]);

  const [region, setRegion] = useState<Region>("all");
  const [selected, setSelected] = useState<SheetView | null>(null);
  const [listMode, setListMode] = useState(false);

  const opener = useRef<HTMLElement | null>(null);
  const hashApplied = useRef(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const tagTitle = useRef<HTMLElement>(null);
  const tagSub = useRef<HTMLSpanElement>(null);

  const { stageRef, globeRef, register, spinTo, setOverSheet, handlers } = useGlobeMotion(views, selected !== null);

  const open = useCallback(
    (view: SheetView, from: HTMLElement | null) => {
      opener.current = from;
      setSelected(view);
      if (!listMode) spinTo(view.lon, view.lat, 900);
    },
    [listMode, spinTo],
  );

  const close = useCallback(() => {
    setSelected(null);
    opener.current?.focus({ preventScroll: true });
  }, []);

  const chooseRegion = useCallback(
    (next: Region) => {
      setRegion(next);
      const c = next === "all" ? HOME_VIEW : centres[next];
      spinTo(c.lon, c.lat);
    },
    [centres, spinTo],
  );

  // Move focus into the panel when it opens; Escape closes it.
  useEffect(() => {
    if (!selected) return;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [selected, close]);

  // Deep links: /#region=us and /#open=<slug>. Applied on the next frame, once the globe has been sized.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (hashApplied.current) return;
      hashApplied.current = true;
      const params = new URLSearchParams(location.hash.slice(1));
      const r = params.get("region");
      if (r === "europe" || r === "us" || r === "asia") chooseRegion(r);
      const target = byId.get(params.get("open") ?? "");
      if (target) open(target, null);
    });
    return () => cancelAnimationFrame(raf);
  }, [byId, chooseRegion, open]);

  const showTag = (view: SheetView | undefined) => {
    if (!tagRef.current || !tagTitle.current || !tagSub.current) return;
    if (!view) return tagRef.current.classList.remove("on");
    tagTitle.current.textContent = `File ${view.file}: ${viewTitle(view)}`;
    tagSub.current.textContent = viewSubregion(view);
    tagRef.current.classList.add("on");
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    handlers.onPointerMove(e);
    if (tagRef.current) {
      tagRef.current.style.left = `${Math.min(e.clientX, innerWidth - 280)}px`;
      tagRef.current.style.top = `${Math.min(e.clientY, innerHeight - 90)}px`;
    }
  };

  const sheetUnder = (el: EventTarget | null) => (el instanceof Element ? el.closest<HTMLElement>("[data-sheet]") : null);

  return (
    <>
      <a className="skip-link" href="#site-nav">
        Skip the sheets, go to the site menu
      </a>
      <Link className="wordmark" href="/" aria-label="Policy Gradient, home">
        Policy
        <br />
        Gradient
      </Link>
      <p className="tagline">Laws and policies on AI in Europe, the US, China and Singapore. Each file is checked against its source.</p>

      <nav className="regions" aria-label="Spin the globe to a region">
        {(["all", ...REGION_ORDER] as Region[]).map((r) => (
          <button key={r} type="button" className="pill" aria-pressed={region === r} onClick={() => chooseRegion(r)}>
            {r === "all" ? "All" : REGION_LABELS[r]}
          </button>
        ))}
      </nav>

      {lastVerified && <div className="verified">Last verified {formatDate(lastVerified)}</div>}

      <main>
        <div
          ref={stageRef}
          className={`stage${selected ? " has-panel" : ""}`}
          role="group"
          aria-label="Globe of AI regulation files. Hover to turn it, drag to spin it, or use the list view."
          style={{ visibility: listMode ? "hidden" : "visible" }}
          onPointerMove={onPointerMove}
          onPointerLeave={() => {
            handlers.onPointerLeave();
            showTag(undefined);
          }}
          onPointerDown={handlers.onPointerDown}
          onClickCapture={handlers.onClickCapture}
        >
          <div
            ref={globeRef}
            className="globe"
            onPointerOver={(e) => {
              const el = sheetUnder(e.target);
              setOverSheet(!!el);
              showTag(el ? byId.get(el.dataset.sheet!) : undefined);
            }}
            onPointerOut={(e) => {
              if (!sheetUnder(e.relatedTarget)) {
                setOverSheet(false);
                showTag(undefined);
              }
            }}
          >
            {views.map((v) => (
              <Sheet
                key={v.id}
                view={v}
                dim={region !== "all" && v.region !== region}
                selected={selected?.id === v.id}
                register={register}
                onOpen={open}
              />
            ))}
          </div>
        </div>

        <section className="list" hidden={!listMode} aria-label="All files">
          {REGION_ORDER.map((r) => (
            <div key={r}>
              <h2>{REGION_LABELS[r]}</h2>
              <ul>
                {views
                  .filter((v) => v.region === r && v.kind !== "event")
                  .map((v) => (
                    <li key={v.id}>
                      <button type="button" onClick={(e) => open(v, e.currentTarget)}>
                        <b>{viewTitle(v)}</b>
                        <span>
                          {viewSubregion(v)}. {v.kind === "instrument" ? `${INSTRUMENT_KIND_LABELS[v.instrument.kind]}. ` : ""}
                          {stageLabel(viewStage(v))}.
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </section>
      </main>

      <p className="legal">A research tracker, not legal advice.</p>
      <NavInfo>
        <button
          className="view"
          type="button"
          onClick={() => {
            setListMode((m) => !m);
            if (selected) close();
          }}
        >
          {listMode ? "Globe view" : "List view"}
        </button>
      </NavInfo>

      <div ref={tagRef} className="tag" role="presentation">
        <b ref={tagTitle} />
        <span ref={tagSub} />
      </div>
      <DetailPanel view={selected} onClose={close} closeRef={closeRef} />
    </>
  );
}
