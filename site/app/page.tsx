import { GlobeHome } from "@/components/GlobeHome";
import { loadContent } from "@/lib/content";

export default function Home() {
  const { instruments, items } = loadContent();
  return <GlobeHome instruments={instruments} items={items} />;
}
