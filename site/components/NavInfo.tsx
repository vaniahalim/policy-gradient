"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const SECTIONS = [
  { href: "/files", label: "Files", text: "The full archive. Browse and filter every law, policy and news item we track by region, type and status." },
  { href: "/methodology", label: "Methodology", text: "How this works. How files are found, how independent reviewers check every source, and what the confidence levels mean." },
  { href: "/digest", label: "Digest", text: "A short weekly summary of what changed, by region. Subscribe by RSS." },
] as const;

/**
 * The bottom navigation. Each section has an (i) button: hover or focus previews its explanation,
 * click or Enter pins it open, Escape or a click elsewhere closes it.
 */
export function NavInfo() {
  const [pinned, setPinned] = useState<number | null>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const shown = pinned ?? preview;
  const pops = useRef<(HTMLDivElement | null)[]>([]);

  // Keep the pop-up inside the window on narrow screens.
  useEffect(() => {
    if (shown === null) return;
    const pop = pops.current[shown];
    if (!pop) return;
    pop.style.left = "0px";
    const r = pop.getBoundingClientRect();
    const limit = document.documentElement.clientWidth - 12;
    if (r.right > limit) pop.style.left = `${limit - r.right}px`;
  }, [shown]);

  useEffect(() => {
    if (pinned === null) return;
    const close = () => setPinned(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    addEventListener("click", close);
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("click", close);
      removeEventListener("keydown", onKey);
    };
  }, [pinned]);

  return (
    <div className="bottom" id="site-nav" tabIndex={-1}>
      {SECTIONS.map((s, i) => (
        <div className="navitem" key={s.href}>
          <Link href={s.href}>{s.label}</Link>
          <button
            type="button"
            className="info"
            aria-label={`About ${s.label}`}
            aria-expanded={shown === i}
            aria-controls={`info-${i}`}
            onClick={(e) => {
              e.stopPropagation();
              setPinned(pinned === i ? null : i);
            }}
            onMouseEnter={() => setPreview(i)}
            onMouseLeave={() => setPreview(null)}
            onFocus={() => setPreview(i)}
            onBlur={() => setPreview(null)}
          >
            i
          </button>
          <div
            ref={(el) => {
              pops.current[i] = el;
            }}
            id={`info-${i}`}
            className="infopop"
            role="note"
            hidden={shown !== i}
          >
            <b>{s.label}</b>
            <p>{s.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
