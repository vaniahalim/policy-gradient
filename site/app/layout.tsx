import type { Metadata } from "next";
import { Archivo, Source_Serif_4 } from "next/font/google";
import "./globals.css";

// Display: Archivo's width axis gives the extended bold used for the wordmark, titles and nav.
const display = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-display", display: "swap" });
// Body: a readable serif for the dense legal summaries.
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  title: "Policy Gradient: AI regulation tracker",
  description:
    "Laws and policies on AI in Europe, the US, China and Singapore. Each file is checked against its source.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
