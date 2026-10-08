import "./page.css";
import Link from "next/link";

const NAV = [
  { key: "home", href: "/", label: "Globe" },
  { key: "files", href: "/files", label: "Files" },
  { key: "methodology", href: "/methodology", label: "Methodology" },
  { key: "digest", href: "/digest", label: "Digest" },
] as const;

/** The frame around every document page: wordmark, section nav, one sheet of paper, and the disclaimer. */
export function PageShell({ current, children }: { current?: (typeof NAV)[number]["key"]; children: React.ReactNode }) {
  return (
    <div className="pg">
      {/* Clicking the bare desk around the sheet goes back to the globe. Keyboard and screen-reader users have the × and the nav. */}
      <Link className="pg-backdrop" href="/" aria-hidden="true" tabIndex={-1} />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="pg-head">
        <Link className="pg-mark" href="/">
          Policy Gradient
        </Link>
        <nav className="pg-nav" aria-label="Sections">
          {NAV.map((n) => (
            <Link key={n.key} href={n.href} aria-current={current === n.key ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="pg-sheet">
        <Link className="pg-close" href="/" aria-label="Close and return to the globe">
          ×
        </Link>
        <div id="main" tabIndex={-1}>
          {children}
        </div>
      </main>
      <p className="pg-foot">A research tracker, not legal advice. Each file records what its sources said on the date it was last verified.</p>
    </div>
  );
}
