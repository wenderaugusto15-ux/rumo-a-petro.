import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function MetaPixelPageTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Meta Pixel page view tracking stub
  }, [pathname]);
  return null;
}
