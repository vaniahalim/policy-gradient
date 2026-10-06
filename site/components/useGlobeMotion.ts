"use client";

import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent, type MouseEvent as ReactMouseEvent } from "react";
import { darkness, spinTarget, MAX_TILT, type LayoutSheet } from "@/lib/globe";

type Tween = { t0: number; dur: number; fx: number; fy: number; tx: number; ty: number };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Turns the globe. Hovering steers it toward the pointer, dragging spins it, and spinTo() glides to a place.
 * All per-frame work writes straight to the DOM, so React never re-renders while the globe turns.
 */
export function useGlobeMotion(sheets: LayoutSheet[], paused: boolean) {
  const stageRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<HTMLDivElement>(null);
  const els = useRef(new Map<string, HTMLElement>());
  const state = useRef({
    gx: -6, gy: -18, vx: 0, vy: 0, tween: null as Tween | null,
    hover: false, px: 0, py: 0, overSheet: false, dragging: false, moved: 0, last: { x: 0, y: 0 },
    R: 300, reduced: false, paused: false,
  });

  useEffect(() => {
    state.current.paused = paused;
  }, [paused]);

  const register = useCallback((id: string, el: HTMLElement | null) => {
    if (el) els.current.set(id, el);
    else els.current.delete(id);
  }, []);

  const spinTo = useCallback((lon: number, lat: number, duration = 1100) => {
    const st = state.current;
    const to = spinTarget({ gx: st.gx, gy: st.gy }, lon, lat);
    if (st.reduced) {
      st.gx = to.gx;
      st.gy = to.gy;
      return;
    }
    st.tween = { t0: performance.now(), dur: duration, fx: st.gx, fy: st.gy, tx: to.gx, ty: to.gy };
  }, []);

  // Size the globe to the window.
  useEffect(() => {
    const resize = () => {
      const stage = stageRef.current;
      const globe = globeRef.current;
      if (!stage || !globe) return;
      const narrow = innerWidth < 720;
      const R = Math.min(innerWidth * (narrow ? 0.35 : 0.3), innerHeight * (narrow ? 0.28 : 0.36));
      state.current.R = R;
      stage.style.setProperty("--R", `${R}px`);
      stage.style.setProperty("--u", (R / 330).toFixed(3));
      stage.style.perspective = `${R * 3.6}px`;
      stage.style.perspectiveOrigin = narrow ? "50% 46%" : "50% 50%";
      globe.style.top = narrow ? "44%" : "50%";
    };
    resize();
    addEventListener("resize", resize);
    return () => removeEventListener("resize", resize);
  }, []);

  // The animation loop.
  useEffect(() => {
    const st = state.current;
    st.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const apply = () => {
      const globe = globeRef.current;
      if (!globe) return;
      globe.style.transform = `rotateX(${st.gx}deg) rotateY(${st.gy}deg)`;
      for (const s of sheets) els.current.get(s.id)?.style.setProperty("--dark", darkness(s.lon, s.lat, st.gx, st.gy).toFixed(2));
    };

    const frame = () => {
      if (st.tween) {
        const t = st.tween;
        const k = Math.min(1, (performance.now() - t.t0) / t.dur);
        const eased = 1 - Math.pow(1 - k, 4);
        st.gx = t.fx + (t.tx - t.fx) * eased;
        st.gy = t.fy + (t.ty - t.fy) * eased;
        st.vx = st.vy = 0;
        if (k >= 1) st.tween = null;
      } else if (!st.dragging && !st.reduced) {
        let targetVx = 0;
        let targetVy = -0.07; // slow idle drift
        if (st.paused) {
          targetVy = 0;
        } else if (st.hover && globeRef.current) {
          const c = globeRef.current.getBoundingClientRect();
          const dx = (st.px - c.left) / st.R;
          const dy = (st.py - c.top) / st.R;
          const dead = 0.14;
          const slow = st.overSheet ? 0.12 : 1; // ease off when a sheet is under the pointer so it can be read and clicked
          targetVy = Math.abs(dx) > dead ? -clamp(dx, -1.2, 1.2) * 0.55 * slow : 0;
          targetVx = Math.abs(dy) > dead ? clamp(dy, -1.2, 1.2) * 0.4 * slow : 0;
        }
        st.vx += (targetVx - st.vx) * 0.06;
        st.vy += (targetVy - st.vy) * 0.06;
        st.gx = clamp(st.gx + st.vx, -MAX_TILT, MAX_TILT);
        st.gy += st.vy;
      } else if (!st.dragging) {
        st.vx = st.vy = 0;
      }
      apply();
      raf = requestAnimationFrame(frame);
    };

    apply();
    raf = requestAnimationFrame(frame);
    const release = () => {
      st.dragging = false;
      stageRef.current?.classList.remove("dragging");
    };
    addEventListener("pointerup", release);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointerup", release);
    };
  }, [sheets]);

  const handlers = {
    onPointerMove: (e: ReactPointerEvent) => {
      const st = state.current;
      st.px = e.clientX;
      st.py = e.clientY;
      st.hover = e.pointerType === "mouse" && !st.dragging;
      if (st.dragging) {
        const dx = e.clientX - st.last.x;
        const dy = e.clientY - st.last.y;
        st.moved += Math.abs(dx) + Math.abs(dy);
        st.gy += dx * 0.32;
        st.gx = clamp(st.gx - dy * 0.32, -MAX_TILT, MAX_TILT);
        st.vy = dx * 0.12;
        st.vx = -dy * 0.12;
        st.last = { x: e.clientX, y: e.clientY };
        st.tween = null;
      }
    },
    onPointerLeave: () => {
      state.current.hover = false;
      state.current.overSheet = false;
    },
    onPointerDown: (e: ReactPointerEvent) => {
      const st = state.current;
      st.dragging = true;
      st.moved = 0;
      st.last = { x: e.clientX, y: e.clientY };
      st.tween = null;
      stageRef.current?.classList.add("dragging");
    },
    // A drag that ends over a sheet must not count as a click on it.
    onClickCapture: (e: ReactMouseEvent) => {
      if (state.current.moved > 6) {
        e.stopPropagation();
        e.preventDefault();
        state.current.moved = 0;
      }
    },
  };

  const setOverSheet = useCallback((over: boolean) => {
    state.current.overSheet = over;
  }, []);

  return { stageRef, globeRef, register, spinTo, setOverSheet, handlers };
}
