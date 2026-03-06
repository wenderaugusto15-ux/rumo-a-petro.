import { useMetaPixelPageView } from "@/hooks/useMetaPixel";

/** Invisible component that tracks PageView on /app/* route changes */
export function MetaPixelPageTracker() {
  useMetaPixelPageView();
  return null;
}
